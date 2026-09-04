-- AlterTable
ALTER TABLE "User" ADD COLUMN "password_reset_token" TEXT,
ADD COLUMN "password_reset_expires_at" TIMESTAMP(3);
