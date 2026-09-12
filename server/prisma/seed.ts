import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

if (process.env.NODE_ENV === 'production' || (process.env.DEMO_MODE && process.env.DEMO_MODE !== 'true')) {
  throw new Error('El seed solo admite datos de demostración.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? 'postgresql://banorte:banorte_local_demo@127.0.0.1:5433/banorte' }) });
const accountId = process.env.DEMO_ACCOUNT_ID ?? '00000000-0000-4000-8000-000000000001';
const entries = [
  { description: 'Depósito de nómina', amountCents: 2450000n, type: 'income', category: 'Nómina', date: '2026-09-11', notes: 'Primera quincena de septiembre.' },
  { description: 'Suscripción digital', amountCents: 129900n, type: 'expense', category: 'Entretenimiento', date: '2026-09-11', notes: '' },
  { description: 'Renta del departamento', amountCents: 850000n, type: 'expense', category: 'Vivienda', date: '2026-09-10', notes: 'Renta de septiembre.' },
  { description: 'Supermercado', amountCents: 124580n, type: 'expense', category: 'Alimentación', date: '2026-09-09', notes: '' },
  { description: 'Café de la esquina', amountCents: 8900n, type: 'expense', category: 'Alimentación', date: '2026-09-09', notes: '' },
  { description: 'Viaje en aplicación', amountCents: 16500n, type: 'expense', category: 'Transporte', date: '2026-09-08', notes: '' },
  { description: 'Reembolso de compra', amountCents: 79900n, type: 'income', category: 'Compras', date: '2026-09-07', notes: '' },
  { description: 'Servicio de luz', amountCents: 68000n, type: 'expense', category: 'Servicios', date: '2026-09-06', notes: '' },
  { description: 'Librería', amountCents: 42000n, type: 'expense', category: 'Compras', date: '2026-09-05', notes: '' },
] as const;

async function seed() {
  const net = entries.reduce((sum, item) => sum + (item.type === 'income' ? item.amountCents : -item.amountCents), 0n);
  await prisma.$transaction(async tx => {
    await tx.account.upsert({ where: { id: accountId }, update: {}, create: { id: accountId, name: 'Cuenta personal demo', openingBalanceCents: 28465000n - net } });
    for (const [index, entry] of entries.entries()) {
      const key = `00000000-0000-4000-8001-${String(index + 1).padStart(12, '0')}`;
      await tx.movement.upsert({
        where: { accountId_idempotencyKey: { accountId, idempotencyKey: key } },
        update: {},
        create: { ...entry, accountId, idempotencyKey: key, date: new Date(`${entry.date}T00:00:00Z`), createdAt: new Date(`2026-09-11T12:00:${String(9 - index).padStart(2, '0')}Z`), source: 'demo' },
      });
    }
  });
  console.log('Cuenta demo y 9 movimientos disponibles. Los registros existentes se conservan.');
}
seed().catch(() => { console.error('No se pudo cargar el seed. Revisa la conexión y las migraciones.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
