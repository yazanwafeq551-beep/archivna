-- The schema declares @default(now()) on this column but the table was created
-- without it, so the migration chain and the schema disagreed. Prisma always
-- writes the value itself, which is why nothing broke - but any insert that did
-- not go through Prisma would have.
ALTER TABLE "SupportRequest" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
