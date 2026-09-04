-- Certificates issued on course completion.
CREATE TABLE IF NOT EXISTS "certificates" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "course_title_ar" TEXT NOT NULL,
    "course_title_en" TEXT,
    "instructor_name" TEXT,
    "lessons_count" INTEGER NOT NULL DEFAULT 0,
    "learning_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "certificates_serial_key" ON "certificates"("serial");
CREATE UNIQUE INDEX IF NOT EXISTS "certificates_user_id_course_id_key" ON "certificates"("user_id", "course_id");
CREATE INDEX IF NOT EXISTS "certificates_course_id_idx" ON "certificates"("course_id");

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
