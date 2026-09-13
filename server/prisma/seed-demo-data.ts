import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { categories } from "../src/modules/movimientos/schemas/movimiento.schema";

/**
 * Genera historial sintético REALISTA (no una lista de filas fijas) para un
 * perfil ya existente, pensado para probar la interfaz con datos propios,
 * sin tocar la cuenta/base de datos de otro integrante del equipo (cada
 * quien corre esto contra SU PostgreSQL local).
 *
 * Todo se deriva de una semilla numérica (DEMO_SEED) mediante un PRNG
 * determinista: los montos, fechas, categorías y tarjeta de cada movimiento
 * se calculan en tiempo de ejecución a partir de rangos realistas por
 * categoría, no de un arreglo de datos hardcodeados. Cambiar DEMO_SEED
 * produce un dataset distinto; usar la misma semilla dos veces no duplica
 * nada (es idempotente).
 *
 * Uso (desde server/, con la BD ya migrada y con `npm run db:seed` corrido):
 *   npx tsx prisma/seed-demo-data.ts
 *
 * Variables opcionales:
 *   DEMO_SEED_EMAIL   Email del perfil a poblar (default: BOOTSTRAP_EMAIL)
 *   DEMO_SEED         Semilla numérica/string del PRNG (default: "banorte-demo")
 *   DEMO_MONTHS       Meses de historial hacia atrás (default: 6)
 *   DEMO_RESET        "true" borra el historial "demo" previo de esta cuenta
 *                      y las metas generadas por este script antes de crear uno nuevo
 */

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ---------- PRNG determinista (mulberry32) sembrado por texto ----------
function seedToInt(seed: string): number {
  const hash = createHash("sha256").update(seed).digest();
  return hash.readUInt32LE(0);
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const randInt = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(rng: Rng, items: readonly T[]): T => items[randInt(rng, 0, items.length - 1)];
const chance = (rng: Rng, p: number) => rng() < p;

// UUID determinista (formato válido para la columna uuid de Postgres) a partir de un texto.
function deterministicUuid(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// ---------- Catálogo de plantillas por categoría (para variedad, no valores fijos) ----------
const EXPENSE_TEMPLATES: Record<string, { desc: string[]; min: number; max: number }> = {
  Vivienda: { desc: ["Renta departamento", "Mantenimiento condominio", "Predial"], min: 550000, max: 950000 },
  Alimentación: {
    desc: ["Supermercado La Comer", "Walmart", "OXXO", "Restaurante", "Mercado sobre ruedas", "Panadería", "Café"],
    min: 8000,
    max: 90000,
  },
  Transporte: {
    desc: ["Uber", "Didi", "Gasolina Pemex", "Casetas de cuota", "Transporte público", "Estacionamiento"],
    min: 4000,
    max: 45000,
  },
  Entretenimiento: {
    desc: ["Cinépolis", "Netflix", "Spotify", "Boletos evento", "Bar", "Streaming"],
    min: 9900,
    max: 120000,
  },
  Compras: {
    desc: ["Amazon", "Liverpool", "Mercado Libre", "Zara", "Tienda departamental"],
    min: 15000,
    max: 280000,
  },
  Servicios: {
    desc: ["CFE", "Telmex Infinitum", "Telcel Plan", "Agua", "Gas natural"],
    min: 20000,
    max: 130000,
  },
  Otros: { desc: ["Farmacia", "Regalo", "Donativo", "Gasto varios"], min: 5000, max: 90000 },
};
const INCOME_DESCRIPTIONS = ["Depósito de nómina", "Pago quincenal"];

function monthBounds(monthsAgo: number, today: Date) {
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsAgo, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cap = monthsAgo === 0 ? today.getUTCDate() : lastDay;
  return { first, lastDay: cap };
}
function isoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

async function main() {
  const email = process.env.DEMO_SEED_EMAIL ?? process.env.BOOTSTRAP_EMAIL;
  if (!email) throw new Error("Configura DEMO_SEED_EMAIL o BOOTSTRAP_EMAIL en server/.env");
  const seedText = process.env.DEMO_SEED ?? "banorte-demo";
  const months = Number(process.env.DEMO_MONTHS ?? 6);
  const reset = process.env.DEMO_RESET === "true";
  const rng = mulberry32(seedToInt(`${seedText}:${email}`));

  const user = await db.user.findUnique({ where: { email }, include: { profile: { include: { account: true, cards: true } } } });
  if (!user?.profile?.account) throw new Error(`No hay perfil/cuenta para ${email}. Corre antes: npm run db:seed`);
  const { id: profileId, account } = user.profile;

  if (reset) {
    const deletedMovements = await db.movement.deleteMany({ where: { accountId: account.id, source: "demo" } });
    const deletedGoals = await db.goal.deleteMany({
      where: { profileId, originalInput: { path: ["generatedBy"], equals: "seed-demo-data" } },
    });
    console.log(`DEMO_RESET: ${deletedMovements.count} movimientos y ${deletedGoals.count} metas de demo eliminados.`);
  }

  // 1) Asegurar 2 tarjetas para poder ver movimientos asociados a tarjeta en la UI.
  const desiredProducts = ["clasica", "oro"] as const;
  for (const productKey of desiredProducts) {
    const exists = user.profile.cards.some((c) => c.productKey === productKey) ||
      (await db.card.findUnique({ where: { profileId_productKey: { profileId, productKey } } }));
    if (!exists) {
      const last4 = String(randInt(rng, 1000, 9999));
      await db.card.create({ data: { profileId, productKey, last4 } });
      console.log(`Tarjeta ${productKey} creada (····${last4}).`);
    }
  }
  const cards = await db.card.findMany({ where: { profileId } });

  // 2) Metas de ejemplo (con marcador propio para poder identificarlas/borrarlas después).
  const goalPlans = [
    { name: "Fondo de emergencia", minTarget: 2000000, maxTarget: 5000000, deadlineMonths: 8 },
    { name: "Vacaciones", minTarget: 800000, maxTarget: 2000000, deadlineMonths: 4 },
  ];
  const today = new Date();
  for (const plan of goalPlans) {
    const requestKey = deterministicUuid(`goal:${seedText}:${email}:${plan.name}`);
    const targetCents = BigInt(randInt(rng, plan.minTarget, plan.maxTarget));
    const deadline = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + plan.deadlineMonths, 1));
    await db.goal.upsert({
      where: { profileId_requestKey: { profileId, requestKey } },
      update: {},
      create: {
        profileId,
        name: plan.name,
        targetCents,
        deadline,
        requestKey,
        originalInput: { generatedBy: "seed-demo-data", seed: seedText },
      },
    });
  }
  console.log(`${goalPlans.length} metas de ejemplo listas.`);

  // 3) Movimientos: nómina quincenal + gastos variados por categoría, mes a mes.
  type Row = { idempotencyKey: string; description: string; amountCents: bigint; type: "income" | "expense"; category: string; date: Date; notes: string; cardId: string | null; source: "demo" };
  const rows: Row[] = [];
  let counter = 0;
  const nextKey = () => deterministicUuid(`mov:${seedText}:${email}:${counter++}`);
  const maybeCard = () => (cards.length && chance(rng, 0.55) ? pick(rng, cards).id : null);

  for (let m = months - 1; m >= 0; m--) {
    const { first, lastDay } = monthBounds(m, today);
    const y = first.getUTCFullYear();
    const mo = first.getUTCMonth();

    // Nómina: día 1 y 16 (o hasta donde alcance el mes en curso).
    for (const payday of [1, 16]) {
      if (payday > lastDay) continue;
      rows.push({
        idempotencyKey: nextKey(),
        description: pick(rng, INCOME_DESCRIPTIONS),
        amountCents: BigInt(randInt(rng, 1200000, 1800000)),
        type: "income",
        category: "Nómina",
        date: new Date(Date.UTC(y, mo, payday)),
        notes: "",
        cardId: null,
        source: "demo",
      });
    }

    // Gastos por categoría, con cantidad de ocurrencias variable por categoría/mes.
    const occurrences: Record<string, number> = {
      Vivienda: 1,
      Servicios: randInt(rng, 2, 3),
      Alimentación: randInt(rng, 8, 14),
      Transporte: randInt(rng, 6, 10),
      Entretenimiento: randInt(rng, 2, 5),
      Compras: randInt(rng, 1, 4),
      Otros: randInt(rng, 0, 2),
    };
    for (const category of categories) {
      if (category === "Nómina" || !(category in occurrences)) continue;
      const template = EXPENSE_TEMPLATES[category];
      for (let i = 0; i < occurrences[category]; i++) {
        const day = randInt(rng, 1, lastDay);
        rows.push({
          idempotencyKey: nextKey(),
          description: pick(rng, template.desc),
          amountCents: BigInt(randInt(rng, template.min, template.max)),
          type: "expense",
          category,
          date: new Date(Date.UTC(y, mo, day)),
          notes: "",
          cardId: maybeCard(),
          source: "demo",
        });
      }
    }
  }

  const result = await db.movement.createMany({
    data: rows.map((r) => ({ ...r, accountId: account.id })),
    skipDuplicates: true,
  });
  console.log(`${result.count} movimientos nuevos insertados (de ${rows.length} generados; el resto ya existía).`);

  const summary = await db.movement.aggregate({
    where: { accountId: account.id },
    _sum: { amountCents: true },
    _count: true,
  });
  console.log(`Cuenta ${email}: ${summary._count} movimientos totales.`);
}

main()
  .catch((e) => {
    console.error("Seed de demo falló:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
