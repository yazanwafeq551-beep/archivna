-- Institution sign-up collects a contact person; keep it with the institution.
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "contact_person" TEXT;
