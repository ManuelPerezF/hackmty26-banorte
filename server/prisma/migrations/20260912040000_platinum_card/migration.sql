-- Replace the catalog product while preserving assigned card IDs and history.
INSERT INTO "CardProduct" ("key", "name", "network", "imageKey")
VALUES ('platinum', 'Platinum', 'Visa', 'platinum')
ON CONFLICT ("key") DO UPDATE SET "name" = 'Platinum', "imageKey" = 'platinum';
UPDATE "Card" SET "productKey" = 'platinum' WHERE "productKey" = 'infinite';
DELETE FROM "CardProduct" WHERE "key" = 'infinite';
