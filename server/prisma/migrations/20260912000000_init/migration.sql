-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "MovementSource" AS ENUM ('demo', 'manual');

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'MXN',
    "openingBalanceCents" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "description" VARCHAR(80) NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "type" "MovementType" NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "date" DATE NOT NULL,
    "notes" VARCHAR(500) NOT NULL DEFAULT '',
    "source" "MovementSource" NOT NULL DEFAULT 'manual',
    "idempotencyKey" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movement_accountId_date_createdAt_id_idx" ON "Movement"("accountId", "date", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Movement_accountId_type_category_idx" ON "Movement"("accountId", "type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_accountId_idempotencyKey_key" ON "Movement"("accountId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reglas de dinero también en la base de datos.
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_amountCents_check" CHECK ("amountCents" > 0 AND "amountCents" <= 99999999999);
ALTER TABLE "Account" ADD CONSTRAINT "Account_currency_check" CHECK ("currency" = 'MXN');
