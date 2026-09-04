-- Arsheefna archival core: hierarchy, institutional RBAC, editorial workflow,
-- standards-ready metadata, and controlled access.

ALTER TABLE "ArchiveRecord"
  ADD COLUMN "institution_id" TEXT,
  ADD COLUMN "archival_unit_id" TEXT,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "technical_metadata" JSONB,
  ADD COLUMN "submitted_at" TIMESTAMP(3),
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "reviewed_by" TEXT,
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "approved_by" TEXT;

CREATE TABLE "ArchivalUnit" (
  "id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "level" TEXT NOT NULL,
  "title_ar" TEXT NOT NULL,
  "title_en" TEXT,
  "reference_code" TEXT,
  "description_ar" TEXT,
  "description_en" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchivalUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoleAssignment" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "institution_id" TEXT,
  "assigned_by_id" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessPolicy" (
  "id" TEXT NOT NULL,
  "archive_record_id" TEXT NOT NULL,
  "access_level" TEXT NOT NULL DEFAULT 'public',
  "metadata_visibility" TEXT NOT NULL DEFAULT 'public',
  "requires_reason" BOOLEAN NOT NULL DEFAULT false,
  "watermark_enabled" BOOLEAN NOT NULL DEFAULT false,
  "default_grant_hours" INTEGER NOT NULL DEFAULT 72,
  "sovereign_region" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessRequest" (
  "id" TEXT NOT NULL,
  "archive_record_id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "institution_id" TEXT,
  "reason" TEXT NOT NULL,
  "intended_use" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "decision_note" TEXT,
  "decided_by_id" TEXT,
  "decided_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArchiveWorkflowEvent" (
  "id" TEXT NOT NULL,
  "archive_record_id" TEXT NOT NULL,
  "actor_id" TEXT,
  "from_status" TEXT,
  "to_status" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchiveWorkflowEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Agent" (
  "id" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "name_en" TEXT,
  "agent_type" TEXT NOT NULL,
  "authority_reference" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArchiveAgent" (
  "archive_record_id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  CONSTRAINT "ArchiveAgent_pkey" PRIMARY KEY ("archive_record_id", "agent_id", "role")
);

CREATE TABLE "ControlledTerm" (
  "id" TEXT NOT NULL,
  "scheme" TEXT NOT NULL,
  "label_ar" TEXT NOT NULL,
  "label_en" TEXT,
  "code" TEXT,
  "broader_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlledTerm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArchiveRecordTerm" (
  "archive_record_id" TEXT NOT NULL,
  "term_id" TEXT NOT NULL,
  CONSTRAINT "ArchiveRecordTerm_pkey" PRIMARY KEY ("archive_record_id", "term_id")
);

CREATE UNIQUE INDEX "RoleAssignment_user_id_role_institution_id_key" ON "RoleAssignment"("user_id", "role", "institution_id");
CREATE UNIQUE INDEX "AccessPolicy_archive_record_id_key" ON "AccessPolicy"("archive_record_id");
CREATE INDEX "ArchiveRecord_institution_id_status_idx" ON "ArchiveRecord"("institution_id", "status");
CREATE INDEX "ArchiveRecord_archival_unit_id_idx" ON "ArchiveRecord"("archival_unit_id");
CREATE INDEX "ArchiveRecord_access_level_status_idx" ON "ArchiveRecord"("access_level", "status");
CREATE INDEX "ArchivalUnit_institution_id_level_idx" ON "ArchivalUnit"("institution_id", "level");
CREATE INDEX "ArchivalUnit_parent_id_sort_order_idx" ON "ArchivalUnit"("parent_id", "sort_order");
CREATE INDEX "RoleAssignment_institution_id_role_idx" ON "RoleAssignment"("institution_id", "role");
CREATE INDEX "AccessRequest_requester_id_status_idx" ON "AccessRequest"("requester_id", "status");
CREATE INDEX "AccessRequest_institution_id_status_idx" ON "AccessRequest"("institution_id", "status");
CREATE INDEX "AccessRequest_archive_record_id_status_idx" ON "AccessRequest"("archive_record_id", "status");
CREATE INDEX "ArchiveWorkflowEvent_archive_record_id_created_at_idx" ON "ArchiveWorkflowEvent"("archive_record_id", "created_at");
CREATE INDEX "ControlledTerm_scheme_label_ar_idx" ON "ControlledTerm"("scheme", "label_ar");

ALTER TABLE "ArchivalUnit" ADD CONSTRAINT "ArchivalUnit_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchivalUnit" ADD CONSTRAINT "ArchivalUnit_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ArchivalUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessPolicy" ADD CONSTRAINT "AccessPolicy_archive_record_id_fkey" FOREIGN KEY ("archive_record_id") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_archive_record_id_fkey" FOREIGN KEY ("archive_record_id") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArchiveWorkflowEvent" ADD CONSTRAINT "ArchiveWorkflowEvent_archive_record_id_fkey" FOREIGN KEY ("archive_record_id") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchiveWorkflowEvent" ADD CONSTRAINT "ArchiveWorkflowEvent_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArchiveAgent" ADD CONSTRAINT "ArchiveAgent_archive_record_id_fkey" FOREIGN KEY ("archive_record_id") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchiveAgent" ADD CONSTRAINT "ArchiveAgent_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ControlledTerm" ADD CONSTRAINT "ControlledTerm_broader_id_fkey" FOREIGN KEY ("broader_id") REFERENCES "ControlledTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArchiveRecordTerm" ADD CONSTRAINT "ArchiveRecordTerm_archive_record_id_fkey" FOREIGN KEY ("archive_record_id") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchiveRecordTerm" ADD CONSTRAINT "ArchiveRecordTerm_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "ControlledTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_archival_unit_id_fkey" FOREIGN KEY ("archival_unit_id") REFERENCES "ArchivalUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pilot institution and safe data migration.
INSERT INTO "Institution" ("id", "name_ar", "name_en", "slug", "institution_type", "description_ar", "description_en", "created_at", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000001', 'التجمع الأرشيفي الفلسطيني', 'Palestinian Archival Collective', 'palestinian-archival-collective', 'archival_collective', 'المؤسسة التجريبية المركزية لمنصة أرشيفنا', 'The pilot institution for the Arsheefna platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "ArchiveRecord" r
SET "institution_id" = i."id"
FROM "Institution" i
WHERE r."institution_id" IS NULL AND r."institution_name" = i."name_ar";

UPDATE "ArchiveRecord"
SET "institution_id" = (SELECT "id" FROM "Institution" WHERE "slug" = 'palestinian-archival-collective')
WHERE "institution_id" IS NULL;

UPDATE "ArchiveRecord" SET "access_level" = 'sensitive' WHERE "access_level" = 'private';

INSERT INTO "ArchivalUnit" ("id", "institution_id", "level", "title_ar", "title_en", "reference_code", "description_ar", "created_at", "updated_at")
SELECT md5(i."id" || ':default-fonds')::uuid::text, i."id", 'fonds', 'الرصيد العام', 'General Fonds', 'GF-001', 'رصيد افتراضي لحفظ السجلات الحالية حتى استكمال ترتيبها', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Institution" i;

UPDATE "ArchiveRecord" r
SET "archival_unit_id" = md5(r."institution_id" || ':default-fonds')::uuid::text
WHERE r."archival_unit_id" IS NULL;

INSERT INTO "AccessPolicy" ("id", "archive_record_id", "access_level", "metadata_visibility", "requires_reason", "watermark_enabled", "default_grant_hours", "created_at", "updated_at")
SELECT md5(r."id" || ':access-policy')::uuid::text, r."id", r."access_level",
       CASE WHEN r."access_level" = 'sovereign' THEN 'restricted' ELSE 'public' END,
       r."access_level" <> 'public', r."access_level" = 'sensitive', 72, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ArchiveRecord" r;

INSERT INTO "ArchiveWorkflowEvent" ("id", "archive_record_id", "actor_id", "from_status", "to_status", "note", "created_at")
SELECT md5(r."id" || ':migration-event')::uuid::text, r."id", r."owner_id", NULL, r."status", 'ترحيل السجل مع الحفاظ على حالة النشر الحالية', CURRENT_TIMESTAMP
FROM "ArchiveRecord" r;

INSERT INTO "RoleAssignment" ("id", "user_id", "role", "institution_id", "is_active", "created_at", "updated_at")
SELECT md5(u."id" || ':researcher')::uuid::text, u."id", 'researcher', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u;

INSERT INTO "RoleAssignment" ("id", "user_id", "role", "institution_id", "is_active", "created_at", "updated_at")
SELECT md5(u."id" || ':system-admin')::uuid::text, u."id", 'system_admin', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u WHERE lower(u."email") = 'admin@example.com';
