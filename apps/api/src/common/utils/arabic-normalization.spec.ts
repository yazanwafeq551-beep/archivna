import {
  normalizeArabic,
  normalizeSearchQuery,
  buildSearchTerms,
} from './arabic-normalization';

/**
 * Search was broken because this file and archivna_normalize() in the database
 * disagreed: the query was folded and the stored text was not, so folding made
 * a match less likely rather than more. These tests pin the folding itself;
 * search.e2e-spec.ts pins that the database still agrees with it.
 */
describe('normalizeArabic', () => {
  it.each([
    ['الدبكة', 'الدبكه', 'ta marbuta folds to ha'],
    ['دِبْكَة', 'دبكه', 'diacritics are dropped'],
    ['دبـــكة', 'دبكه', 'tatweel is decoration'],
    ['أحمد', 'احمد', 'hamza above alef folds'],
    ['إسرائيل', 'اسراييل', 'hamza below alef, and hamza on ya'],
    ['آثار', 'اثار', 'madda folds'],
    ['مصطفى', 'مصطفي', 'alef maqsura folds to ya'],
    ['مؤسسة', 'موسسه', 'hamza on waw folds to waw'],
    ['شيء', 'شي', 'bare hamza is dropped'],
  ])('%s -> %s (%s)', (input, expected) => {
    expect(normalizeArabic(input)).toBe(expected);
  });

  it('collapses runs of whitespace', () => {
    expect(normalizeArabic('  أ ب   ج  ')).toBe('ا ب ج');
  });

  it('leaves Latin text alone apart from case', () => {
    expect(normalizeSearchQuery('Dabke ARC-1948')).toBe('dabke arc-1948');
  });

  it('is a no-op on already normalised text', () => {
    const once = normalizeArabic('الدبكة');
    expect(normalizeArabic(once)).toBe(once);
  });
});

describe('buildSearchTerms', () => {
  it('splits a phrase into terms so word order does not matter', () => {
    expect(buildSearchTerms('دبكة الجليل')).toHaveLength(2);
  });

  it('searches a word with the definite article stripped as well', () => {
    // الدبكة -> ["الدبكه", "دبكه"], so it finds records that omit the article.
    const [variants] = buildSearchTerms('الدبكة');
    expect(variants).toEqual(['الدبكه', 'دبكه']);
  });

  it('keeps short words whole', () => {
    // الله must not become له, which appears inside a great deal of Arabic.
    const [variants] = buildSearchTerms('الله');
    expect(variants).toEqual(['الله']);
  });

  it('ignores an empty or whitespace-only query', () => {
    expect(buildSearchTerms('   ')).toEqual([]);
  });

  it('bounds how many terms one query can produce', () => {
    expect(buildSearchTerms(Array(40).fill('بحث').join(' '))).toHaveLength(8);
  });
});
