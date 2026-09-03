const DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;

const ALEF_VARIANTS_MAP: Record<string, string> = {
  '\u0622': '\u0627',
  '\u0623': '\u0627',
  '\u0625': '\u0627',
  '\u0649': '\u064A',
};

const TAA_MARBUTA_REGEX = /[\u0629]/g;

export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text;

  normalized = normalized.replace(DIACRITICS_REGEX, '');

  for (const [variant, base] of Object.entries(ALEF_VARIANTS_MAP)) {
    normalized = normalized.split(variant).join(base);
  }

  normalized = normalized.replace(TAA_MARBUTA_REGEX, '\u0647');

  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function normalizeSearchQuery(query: string): string {
  return normalizeArabic(query.toLowerCase());
}
