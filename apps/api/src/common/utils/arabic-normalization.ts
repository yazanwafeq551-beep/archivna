const DIACRITICS_REGEX =
  /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ]/g;

/** Tatweel is decoration: "دبـــكة" and "دبكة" are the same word. */
const TATWEEL_REGEX = /ـ/g;

const LETTER_VARIANTS_MAP: Record<string, string> = {
  'آ': 'ا', // آ
  'أ': 'ا', // أ
  'إ': 'ا', // إ
  'ٱ': 'ا', // ٱ
  'ى': 'ي', // ى
  'ؤ': 'و', // ؤ
  'ئ': 'ي', // ئ
  'ة': 'ه', // ة
  'ء': '', //       ء
};

/**
 * Folds the spellings of a word that Arabic treats as interchangeable but a
 * byte comparison does not: ة and ه, the alef family, ى and ي, diacritics
 * nobody types, tatweel.
 *
 * This must stay in step with archivna_normalize() in the database, which is
 * the same transformation in SQL. The query is normalised here and the stored
 * text there, and search only works while the two agree.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text.replace(DIACRITICS_REGEX, '').replace(TATWEEL_REGEX, '');

  for (const [variant, base] of Object.entries(LETTER_VARIANTS_MAP)) {
    normalized = normalized.split(variant).join(base);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

export function normalizeSearchQuery(query: string): string {
  return normalizeArabic(query.toLowerCase());
}

/**
 * More than this and a single search can build an unbounded query; nobody
 * narrows anything with a twentieth word.
 */
const MAX_TERMS = 8;

/**
 * The query as a list of terms, each with the spellings that should count as
 * a match. Terms are combined with AND by the caller, so "دبكة فلسطينية"
 * finds records containing both words anywhere, in any order - which is what
 * people expect and what a single `contains` on the whole phrase never did.
 */
export function buildSearchTerms(query: string): string[][] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [];

  return normalized
    .split(' ')
    .filter(Boolean)
    .slice(0, MAX_TERMS)
    .map(termVariants);
}

const DEFINITE_ARTICLE = 'ال'; // ال

/**
 * A search for "الدبكة" should find "دبكة" as surely as the reverse. Matching
 * is on substrings, so the reverse already works; this covers the direction
 * that does not.
 *
 * The length floor matters: stripping the article from "الله" leaves "له",
 * which appears inside a large share of Arabic text and would turn one search
 * into everything.
 */
function termVariants(term: string): string[] {
  if (term.startsWith(DEFINITE_ARTICLE) && term.length >= 5) {
    return [term, term.slice(DEFINITE_ARTICLE.length)];
  }
  return [term];
}
