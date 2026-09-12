import { Prisma } from "../../generated/prisma/client";
export const legacyUserId = "00000000-0000-4000-8000-000000000010";
export const legacyProfileId = "00000000-0000-4000-8000-000000000011";
export const legacyAccountId = "00000000-0000-4000-8000-000000000001";
// Product metadata is a catalog, never a user's ownership or financial activity.
export const products = [
  { key: "clasica", name: "Clásica", imageKey: "clasica" },
  { key: "oro", name: "Oro", imageKey: "oro" },
  { key: "infinite", name: "Infinite", imageKey: "infinite" },
];
export async function seedProducts(tx: Prisma.TransactionClient) {
  for (const p of products)
    await tx.cardProduct.upsert({ where: { key: p.key }, create: p, update: p });
}
export async function provision(
  tx: Prisma.TransactionClient,
  userId: string,
  displayName: string,
  timezone: string,
) {
  const profile = await tx.profile.create({ data: { userId, displayName, timezone } });
  await tx.account.create({
    data: { profileId: profile.id, name: "Cuenta personal", openingBalanceCents: 0n },
  });
  return profile;
}
