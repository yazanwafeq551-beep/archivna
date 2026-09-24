-- Search never matched Arabic text that was spelled slightly differently from
-- the query, which in Arabic is most of the time. The query was normalised -
-- ة folded to ه, أ إ آ folded to ا, diacritics stripped - and the stored text
-- was not, so normalising made a match *less* likely, not more: typing "دبكة"
-- produced "دبكه", which appears nowhere in a column holding "الدبكة".
--
-- The fix is to hold a normalised copy of every searchable field and compare
-- like with like. It is maintained by triggers rather than by the application,
-- so it cannot drift: seeds, imports and raw SQL all keep it correct.

-- Wrapped, because a role without permission to install an extension would
-- otherwise fail this migration and take the whole API deploy down with it.
-- The index makes search fast; it is not what makes search correct.
DO $ext$
BEGIN
  EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_trgm';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm unavailable (%) - search will run without its index', SQLERRM;
END $ext$;

-- Diacritics and tatweel are invisible in a file, so they are written by code
-- point. Everything else is a letter you can read.
CREATE OR REPLACE FUNCTION archivna_normalize(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $fn$
  SELECT btrim(regexp_replace(
    translate(
      translate(
        lower(coalesce(input, '')),
        -- fatha, damma, kasra, shadda, sukun, tanween, superscript alef, tatweel
        chr(1611) || chr(1612) || chr(1613) || chr(1614) || chr(1615) ||
        chr(1616) || chr(1617) || chr(1618) || chr(1619) || chr(1620) ||
        chr(1621) || chr(1648) || chr(1600),
        ''
      ),
      -- أ إ آ ٱ ى ة ؤ ئ ء  ->  ا ا ا ا ي ه و ي (and ء is dropped: the target
      -- string is one shorter, which is how translate deletes a character)
      'أإآٱىةؤئء',
      'اااايهوي'
    ),
    '\s+', ' ', 'g'
  ));
$fn$;

ALTER TABLE "ArchiveRecord" ADD COLUMN IF NOT EXISTS "search_text" text;

-- Everything a person might reasonably type to find a record, in one place.
-- The related names are pulled in by sub-query; the triggers below keep them
-- fresh when an institution or a unit is renamed.
CREATE OR REPLACE FUNCTION archivna_archive_search_text()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW."search_text" := archivna_normalize(concat_ws(' ',
    NEW."title_ar", NEW."title_en",
    NEW."alternative_title_ar", NEW."alternative_title_en",
    NEW."reference_number",
    NEW."description_ar", NEW."description_en",
    NEW."creator_name", NEW."institution_name", NEW."collection_name",
    NEW."subject_text", NEW."place", NEW."date_text",
    NEW."ocr_text_ar", NEW."ocr_text_en",
    (SELECT concat_ws(' ', i."name_ar", i."name_en")
       FROM "Institution" i WHERE i."id" = NEW."institution_id"),
    (SELECT concat_ws(' ', u."title_ar", u."title_en", u."reference_code")
       FROM "ArchivalUnit" u WHERE u."id" = NEW."archival_unit_id"),
    (SELECT string_agg(s."subject", ' ')
       FROM "ArchiveSubject" s WHERE s."archive_record_id" = NEW."id")
  ));
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS archive_record_search_text ON "ArchiveRecord";
CREATE TRIGGER archive_record_search_text
  BEFORE INSERT OR UPDATE ON "ArchiveRecord"
  FOR EACH ROW EXECUTE FUNCTION archivna_archive_search_text();

-- A no-op UPDATE is enough to refresh a row, because the trigger above
-- recomputes on any update. updated_at is set by the application, so touching
-- it here leaves the timestamp alone.
CREATE OR REPLACE FUNCTION archivna_refresh_archive_search()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF TG_TABLE_NAME = 'ArchiveSubject' THEN
    UPDATE "ArchiveRecord" SET "updated_at" = "updated_at"
     WHERE "id" = COALESCE(NEW."archive_record_id", OLD."archive_record_id");
  ELSIF TG_TABLE_NAME = 'Institution' THEN
    UPDATE "ArchiveRecord" SET "updated_at" = "updated_at"
     WHERE "institution_id" = NEW."id";
  ELSIF TG_TABLE_NAME = 'ArchivalUnit' THEN
    UPDATE "ArchiveRecord" SET "updated_at" = "updated_at"
     WHERE "archival_unit_id" = NEW."id";
  END IF;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS archive_subject_refresh_search ON "ArchiveSubject";
CREATE TRIGGER archive_subject_refresh_search
  AFTER INSERT OR UPDATE OR DELETE ON "ArchiveSubject"
  FOR EACH ROW EXECUTE FUNCTION archivna_refresh_archive_search();

DROP TRIGGER IF EXISTS institution_refresh_search ON "Institution";
CREATE TRIGGER institution_refresh_search
  AFTER UPDATE OF "name_ar", "name_en" ON "Institution"
  FOR EACH ROW EXECUTE FUNCTION archivna_refresh_archive_search();

DROP TRIGGER IF EXISTS archival_unit_refresh_search ON "ArchivalUnit";
CREATE TRIGGER archival_unit_refresh_search
  AFTER UPDATE OF "title_ar", "title_en", "reference_code" ON "ArchivalUnit"
  FOR EACH ROW EXECUTE FUNCTION archivna_refresh_archive_search();

-- Fills every existing row through the same trigger, so there is one
-- definition of what search_text contains.
UPDATE "ArchiveRecord" SET "updated_at" = "updated_at";

-- Trigram index, because the whole point is matching in the middle of a word:
-- "دبكة" has to find "الدبكة", and a b-tree cannot answer LIKE '%...%'.
DO $idx$
BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS "ArchiveRecord_search_text_trgm"'
       || ' ON "ArchiveRecord" USING gin ("search_text" gin_trgm_ops)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'trigram index not created (%) - search is still correct, just unindexed', SQLERRM;
END $idx$;
