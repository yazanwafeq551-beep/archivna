-- The learning tables.
--
-- These were created with `prisma db push` during development, so they existed
-- on the development database but no migration ever built them. A deployment
-- running `migrate deploy` against an empty database therefore failed at the
-- certificates migration, which references "courses".
--
-- Written so it can run against a database that already has them: the
-- development database does.

CREATE TABLE IF NOT EXISTS "course_categories" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "course_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "course_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "course_tag_on_course" (
    "course_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "course_tag_on_course_pkey" PRIMARY KEY ("course_id","tag_id")
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "slug" TEXT NOT NULL,
    "short_desc_ar" TEXT,
    "short_desc_en" TEXT,
    "full_desc_ar" TEXT,
    "full_desc_en" TEXT,
    "thumbnail_url" TEXT,
    "banner_url" TEXT,
    "instructor_name" TEXT NOT NULL,
    "instructor_bio" TEXT,
    "instructor_avatar" TEXT,
    "category_id" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "duration" INTEGER,
    "estimated_study_time" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "prerequisites" TEXT,
    "learning_objectives" JSONB,
    "archive_topic" TEXT,
    "region" TEXT,
    "historical_period" TEXT,
    "target_audience" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "version" TEXT DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lessons" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lesson_number" INTEGER NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "slug" TEXT NOT NULL,
    "video_url" TEXT,
    "video_duration" INTEGER,
    "content_ar" TEXT,
    "content_en" TEXT,
    "summary_ar" TEXT,
    "summary_en" TEXT,
    "transcript" TEXT,
    "estimated_reading_time" INTEGER,
    "completion_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "is_assessment" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lesson_attachments" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "course_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "current_lesson_number" INTEGER NOT NULL DEFAULT 1,
    "course_progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lessons_completed" INTEGER NOT NULL DEFAULT 0,
    "total_watch_time" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "watched_seconds" INTEGER NOT NULL DEFAULT 0,
    "watch_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_position" INTEGER NOT NULL DEFAULT 0,
    "total_watch_time" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "achievements" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "description_ar" TEXT,
    "description_en" TEXT,
    "icon_url" TEXT,
    "badge_color" TEXT,
    "criteria_type" TEXT NOT NULL,
    "criteria_value" INTEGER,
    "course_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_achievements" (
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id","achievement_id")
);

CREATE TABLE IF NOT EXISTS "course_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "saved_courses" (
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_courses_pkey" PRIMARY KEY ("user_id","course_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_categories_slug_key" ON "course_categories"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "course_tags_slug_key" ON "course_tags"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "courses_slug_key" ON "courses"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "lessons_course_id_lesson_number_key" ON "lessons"("course_id", "lesson_number");
CREATE UNIQUE INDEX IF NOT EXISTS "lessons_course_id_slug_key" ON "lessons"("course_id", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "course_enrollments_user_id_course_id_key" ON "course_enrollments"("user_id", "course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_user_id_lesson_id_key" ON "lesson_progress"("user_id", "lesson_id");
CREATE UNIQUE INDEX IF NOT EXISTS "course_reviews_user_id_course_id_key" ON "course_reviews"("user_id", "course_id");

DO $$ BEGIN
  ALTER TABLE "course_tag_on_course" ADD CONSTRAINT "course_tag_on_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "course_tag_on_course" ADD CONSTRAINT "course_tag_on_course_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "course_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_attachments" ADD CONSTRAINT "lesson_attachments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "achievements" ADD CONSTRAINT "achievements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
