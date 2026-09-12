-- Remove only the legacy opening balance and explicitly marked sample activity.
-- Manual movements, credentials, assigned cards, goals and conversations remain intact.
UPDATE "Account" a SET "openingBalanceCents" = 0
WHERE a."openingBalanceCents" = 27174980
AND (
  a.id = '00000000-0000-4000-8000-000000000001'
  OR EXISTS (
    SELECT 1 FROM "Movement" m WHERE m."accountId" = a.id
    AND m.source = 'demo'
    AND m."idempotencyKey"::text LIKE '00000000-0000-4000-8001-%'
  )
);
DELETE FROM "Movement" WHERE source = 'demo';
