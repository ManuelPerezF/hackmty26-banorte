-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "profileId" UUID;

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es-MX',
    "timezone" TEXT NOT NULL DEFAULT 'America/Monterrey',
    "preferredCardId" UUID,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardProduct" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'Visa',
    "imageKey" TEXT NOT NULL,

    CONSTRAINT "CardProduct_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "productKey" TEXT NOT NULL,
    "last4" CHAR(4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "targetCents" BIGINT NOT NULL,
    "deadline" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "requestKey" UUID NOT NULL,
    "originalInput" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "requestKey" UUID NOT NULL,
    "originalInput" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "turnId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTurn" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "requestKey" UUID NOT NULL,
    "input" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "uiSnapshot" JSONB,
    "assistantMessage" TEXT NOT NULL DEFAULT '',
    "errorCode" TEXT,
    "trace" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AgentTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingAction" (
    "id" UUID NOT NULL,
    "turnId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "surfaceId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingAction_pkey" PRIMARY KEY ("id")
);

-- Preserve the existing account under an explicitly provisioned, initially disabled owner.
INSERT INTO "User" ("id","email","passwordHash","active") VALUES ('00000000-0000-4000-8000-000000000010','initial-owner@example.test','!unprovisioned',false);
INSERT INTO "Profile" ("id","userId","displayName") VALUES ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000010','Alex Morgan');
UPDATE "Account" SET "profileId"='00000000-0000-4000-8000-000000000011' WHERE "id"='00000000-0000-4000-8000-000000000001';
ALTER TABLE "Account" ALTER COLUMN "profileId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Card_profileId_productKey_key" ON "Card"("profileId", "productKey");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_profileId_requestKey_key" ON "Goal"("profileId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_profileId_requestKey_key" ON "Conversation"("profileId", "requestKey");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTurn_conversationId_requestKey_key" ON "AgentTurn"("conversationId", "requestKey");

-- CreateIndex
CREATE INDEX "PendingAction_sessionId_status_idx" ON "PendingAction"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Account_profileId_key" ON "Account"("profileId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_productKey_fkey" FOREIGN KEY ("productKey") REFERENCES "CardProduct"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTurn" ADD CONSTRAINT "AgentTurn_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingAction" ADD CONSTRAINT "PendingAction_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "AgentTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "AgentTurn_one_active" ON "AgentTurn" ("conversationId") WHERE "status" IN ('queued','running');
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_target_check" CHECK ("targetCents">0 AND "targetCents"<=99999999999);
ALTER TABLE "Card" ADD CONSTRAINT "Card_last4_check" CHECK ("last4" ~ '^[0-9]{4}$');
