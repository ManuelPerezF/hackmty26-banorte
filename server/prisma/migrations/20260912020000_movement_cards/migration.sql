ALTER TABLE "Movement" ADD COLUMN "cardId" UUID;
CREATE INDEX "Movement_accountId_cardId_date_idx" ON "Movement"("accountId", "cardId", "date");
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Only initial example rows are associated; existing manual records stay on their account.
UPDATE "Movement" m SET "cardId" = c.id FROM "Account" a, "Card" c
WHERE m."accountId" = a.id AND c."profileId" = a."profileId" AND m.source = 'demo'
AND ((c."productKey"='clasica' AND m."idempotencyKey"::text IN ('00000000-0000-4000-8001-000000000004','00000000-0000-4000-8001-000000000005','00000000-0000-4000-8001-000000000009'))
OR (c."productKey"='oro' AND m."idempotencyKey"::text IN ('00000000-0000-4000-8001-000000000002','00000000-0000-4000-8001-000000000006','00000000-0000-4000-8001-000000000007')));
