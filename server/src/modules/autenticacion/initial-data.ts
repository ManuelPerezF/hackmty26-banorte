import { randomInt } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { todayInTimezone } from "../movimientos/schemas/movimiento.schema";
export const legacyUserId = "00000000-0000-4000-8000-000000000010";
export const legacyProfileId = "00000000-0000-4000-8000-000000000011";
export const legacyAccountId = "00000000-0000-4000-8000-000000000001";
export const products = [
  { key: "clasica", name: "Clásica", imageKey: "clasica" },
  { key: "oro", name: "Oro", imageKey: "oro" },
  { key: "infinite", name: "Infinite", imageKey: "infinite" },
];
export const sampleEntries = [
  {
    description: "Depósito de nómina",
    amountCents: 2450000n,
    type: "income",
    category: "Nómina",
    days: 0,
  },
  {
    description: "Suscripción digital",
    amountCents: 129900n,
    type: "expense",
    category: "Entretenimiento",
    days: 0,
  },
  {
    description: "Renta del departamento",
    amountCents: 850000n,
    type: "expense",
    category: "Vivienda",
    days: 1,
  },
  {
    description: "Supermercado",
    amountCents: 124580n,
    type: "expense",
    category: "Alimentación",
    days: 2,
  },
  {
    description: "Café de la esquina",
    amountCents: 8900n,
    type: "expense",
    category: "Alimentación",
    days: 2,
  },
  {
    description: "Viaje en aplicación",
    amountCents: 16500n,
    type: "expense",
    category: "Transporte",
    days: 3,
  },
  {
    description: "Reembolso de compra",
    amountCents: 79900n,
    type: "income",
    category: "Compras",
    days: 4,
  },
  {
    description: "Servicio de luz",
    amountCents: 68000n,
    type: "expense",
    category: "Servicios",
    days: 5,
  },
  { description: "Librería", amountCents: 42000n, type: "expense", category: "Compras", days: 6 },
] as const;
export async function seedProducts(tx: Prisma.TransactionClient) {
  for (const p of products)
    await tx.cardProduct.upsert({ where: { key: p.key }, create: p, update: p });
}
export async function assignCards(tx: Prisma.TransactionClient, profileId: string) {
  const hadCards = await tx.card.findFirst({ where: { profileId }, select: { id: true } });
  for (const productKey of ["clasica", "oro"])
    await tx.card.upsert({
      where: { profileId_productKey: { profileId, productKey } },
      update: {},
      create: { profileId, productKey, last4: String(randomInt(1000, 10000)) },
    });
  const first = await tx.card.findUniqueOrThrow({
    where: { profileId_productKey: { profileId, productKey: "clasica" } },
  });
  if (!hadCards)
    await tx.profile.updateMany({
      where: { id: profileId, preferredCardId: null },
      data: { preferredCardId: first.id },
    });
}
export async function provision(
  tx: Prisma.TransactionClient,
  userId: string,
  displayName: string,
  timezone: string,
) {
  await seedProducts(tx);
  const profile = await tx.profile.create({ data: { userId, displayName, timezone } });
  const net = sampleEntries.reduce(
    (s, x) => s + (x.type === "income" ? x.amountCents : -x.amountCents),
    0n,
  );
  const account = await tx.account.create({
    data: { profileId: profile.id, name: "Cuenta personal", openingBalanceCents: 28465000n - net },
  });
  const today = todayInTimezone(timezone);
  await tx.movement.createMany({
    data: sampleEntries.map((e, i) => {
      const date = new Date(`${today}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - e.days);
      return {
        accountId: account.id,
        description: e.description,
        amountCents: e.amountCents,
        type: e.type,
        category: e.category,
        date,
        source: "demo",
        notes: "Movimiento de ejemplo inicial.",
        idempotencyKey: `00000000-0000-4000-8001-${String(i + 1).padStart(12, "0")}`,
        createdAt: new Date(Date.now() - i),
      };
    }),
  });
  await assignCards(tx, profile.id);
  return profile;
}
