-- Why a refresh token was revoked: only a replayed *rotated* token means theft,
-- a signed-out one must not take the user's other sessions with it.
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "revoked_reason" TEXT;

UPDATE "RefreshToken"
SET "revoked_reason" = CASE
  WHEN "replaced_by_id" IS NOT NULL THEN 'rotated'
  ELSE 'logout'
END
WHERE "is_revoked" = true AND "revoked_reason" IS NULL;
