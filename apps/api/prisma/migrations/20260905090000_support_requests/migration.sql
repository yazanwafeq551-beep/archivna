-- Knowledge-support requests and the notes/complaints channel.
CREATE TABLE IF NOT EXISTS "SupportRequest" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "topic" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contact_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "response" TEXT,
    "responded_by" TEXT,
    "responded_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportRequest_kind_status_idx" ON "SupportRequest"("kind", "status");
CREATE INDEX IF NOT EXISTS "SupportRequest_user_id_idx" ON "SupportRequest"("user_id");

ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_responded_by_fkey"
  FOREIGN KEY ("responded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
