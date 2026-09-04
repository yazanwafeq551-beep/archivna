-- Add rotation metadata so concurrent refresh calls can be resolved safely
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP(3);
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "replaced_by_id" TEXT;

CREATE INDEX IF NOT EXISTS "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
CREATE INDEX IF NOT EXISTS "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");
