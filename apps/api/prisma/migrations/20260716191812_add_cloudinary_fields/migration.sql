-- AlterTable
ALTER TABLE "ArchiveFile" ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "resource_type" TEXT,
ADD COLUMN     "secure_url" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_url" TEXT;
