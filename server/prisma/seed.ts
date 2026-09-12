import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  assignCards,
  legacyUserId,
  legacyProfileId,
  legacyAccountId,
  seedProducts,
  sampleEntries,
} from "../src/modules/autenticacion/initial-data";
import { hashPassword } from "../src/modules/autenticacion/password";
import { registerSchema } from "../src/modules/autenticacion/auth.schemas";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function seed() {
  const existing = await db.user.findUniqueOrThrow({ where: { id: legacyUserId } });
  let credentials: { email: string; passwordHash: string } | undefined;
  if (!existing.active && process.env.BOOTSTRAP_EMAIL && process.env.BOOTSTRAP_PASSWORD) {
    const input = registerSchema.parse({
      displayName: "Alex Morgan",
      email: process.env.BOOTSTRAP_EMAIL,
      password: process.env.BOOTSTRAP_PASSWORD,
    });
    credentials = { email: input.email, passwordHash: await hashPassword(input.password) };
  }
  await db.$transaction(async (tx) => {
    await seedProducts(tx);
    if (credentials)
      await tx.user.update({ where: { id: legacyUserId }, data: { ...credentials, active: true } });
    const net = sampleEntries.reduce(
      (s, e) => s + (e.type === "income" ? e.amountCents : -e.amountCents),
      0n,
    );
    await tx.account.upsert({
      where: { id: legacyAccountId },
      update: {},
      create: {
        id: legacyAccountId,
        profileId: legacyProfileId,
        name: "Cuenta personal",
        openingBalanceCents: 28465000n - net,
      },
    });
    await assignCards(tx, legacyProfileId);
    for (const [index, e] of sampleEntries.entries()) {
      const date = new Date("2026-09-11T00:00:00Z");
      date.setUTCDate(date.getUTCDate() - e.days);
      const idempotencyKey = `00000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`;
      await tx.movement.upsert({
        where: { accountId_idempotencyKey: { accountId: legacyAccountId, idempotencyKey } },
        update: {},
        create: {
          accountId: legacyAccountId,
          idempotencyKey,
          description: e.description,
          amountCents: e.amountCents,
          type: e.type,
          category: e.category,
          date,
          source: "demo",
          notes: "Movimiento de ejemplo inicial.",
        },
      });
    }
  });
  console.log(
    "Productos, tarjetas e historial inicial preparados. Las credenciales existentes y movimientos se conservan.",
  );
  if (!existing.active && !credentials)
    console.log(
      "El propietario inicial permanece deshabilitado: configura BOOTSTRAP_EMAIL y BOOTSTRAP_PASSWORD para habilitarlo.",
    );
}
seed()
  .catch(() => {
    console.error("Seed falló: revisa configuración, credenciales y migraciones.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
