import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  provision,
  legacyUserId,
  legacyProfileId,
  legacyAccountId,
  seedProducts,
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
    await tx.account.upsert({
      where: { id: legacyAccountId },
      update: {},
      create: {
        id: legacyAccountId,
        profileId: legacyProfileId,
        name: "Cuenta personal",
        openingBalanceCents: 0n,
      },
    });

  });
  const secondId="00000000-0000-4000-8000-000000000020";
  if (await db.user.count() < 2 && !await db.user.findUnique({where:{id:secondId}}) && process.env.SECOND_TEST_EMAIL && process.env.SECOND_TEST_PASSWORD) {
    const input=registerSchema.parse({displayName:"Sofía Torres",email:process.env.SECOND_TEST_EMAIL,password:process.env.SECOND_TEST_PASSWORD});
    const passwordHash=await hashPassword(input.password);
    await db.$transaction(async tx=>{await tx.user.create({data:{id:secondId,email:input.email,passwordHash}});await provision(tx,secondId,input.displayName,process.env.BUSINESS_TIMEZONE??"America/Monterrey");});
  }
  console.log(
    "Catálogo y accesos preparados. No se generan saldos, tarjetas ni movimientos de ejemplo; los datos existentes se conservan.",
  );
  if (!existing.active && !credentials)
    console.log(
      "El propietario inicial permanece deshabilitado: configura BOOTSTRAP_EMAIL y BOOTSTRAP_PASSWORD para habilitarlo.",
    );
}
seed()
  .catch((e) => {
    console.error("Seed falló: revisa configuración, credenciales y migraciones.", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
