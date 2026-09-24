import { PrismaClient } from '@prisma/client';
import { normalizeArabic } from '../src/common/utils/arabic-normalization';
import { buildArchiveWhere } from '../src/common/utils/archive-query';

const prisma = new PrismaClient();

const AR = {
  dabkeWithArticle: 'الدبكة الشعبية',
  galilee: 'رقصة تراثية من الجليل',
  songs: 'أرشيف الأغاني',
  dabkeInBody: 'تسجيلات دبكة من عرس',
  dabke: 'دبكة',
  dabkeArticle: 'الدبكة',
  dabkeHa: 'دبكه',
  dabkeDiacritics: 'دِبْكَة',
  dabkeTatweel: 'دبـــكة',
  galileeWord: 'الجليل',
  absent: 'زيتون',
};

describe('Arabic search (e2e)', () => {
  const ids: string[] = [];

  beforeAll(async () => {
    const owner = await prisma.user.findFirst({ select: { id: true } });
    if (!owner) throw new Error('seed the database before running this suite');

    for (const [title_ar, description_ar] of [
      [AR.dabkeWithArticle, AR.galilee],
      [AR.songs, AR.dabkeInBody],
    ]) {
      const record = await prisma.archiveRecord.create({
        data: {
          title_ar,
          description_ar,
          owner_id: owner.id,
          material_type: 'document',
          status: 'published',
          access_level: 'public',
        },
        select: { id: true },
      });
      ids.push(record.id);
    }
  });

  afterAll(async () => {
    await prisma.archiveRecord.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  const countFor = async (q: string) =>
    prisma.archiveRecord.count({
      where: { AND: [buildArchiveWhere({ q }), { id: { in: ids } }] },
    });

  /**
   * The bug this suite exists for: the query was normalised in TypeScript and
   * the stored text was not, so every fold made a match less likely. The two
   * transformations have to stay identical, and only the database can say so.
   */
  it('folds text in the database exactly as the application does', async () => {
    const samples = [
      AR.dabkeWithArticle,
      AR.dabkeDiacritics,
      AR.dabkeTatweel,
      'إسرائيل',
      'مصطفى',
      'مؤسسة',
      'Dabke ARC-1948',
    ];

    for (const sample of samples) {
      const [row] = await prisma.$queryRaw<{ sql: string }[]>`
        SELECT archivna_normalize(${sample}) AS sql
      `;
      expect(row.sql).toBe(normalizeArabic(sample.toLowerCase()));
    }
  });

  it('indexes a record the moment it is written', async () => {
    const record = await prisma.archiveRecord.findUnique({
      where: { id: ids[0] },
      select: { search_text: true },
    });
    expect(record?.search_text).toContain(AR.dabkeHa);
  });

  it.each([
    [AR.dabke, 2, 'the plain word'],
    [AR.dabkeArticle, 2, 'the same word carrying the definite article'],
    [AR.dabkeHa, 2, 'spelled with ha rather than ta marbuta'],
    [AR.dabkeDiacritics, 2, 'spelled with diacritics'],
    [AR.dabkeTatweel, 2, 'spelled with tatweel'],
  ])('finds both records for %s (%s)', async (q, expected) => {
    expect(await countFor(q)).toBe(expected);
  });

  it('requires every word of a phrase, in any order', async () => {
    expect(await countFor(`${AR.dabke} ${AR.galileeWord}`)).toBe(1);
    expect(await countFor(`${AR.galileeWord} ${AR.dabke}`)).toBe(1);
  });

  it('matches nothing when a word is genuinely absent', async () => {
    expect(await countFor(AR.absent)).toBe(0);
    expect(await countFor(`${AR.dabke} ${AR.absent}`)).toBe(0);
  });

  it('re-indexes when the record changes', async () => {
    await prisma.archiveRecord.update({
      where: { id: ids[0] },
      data: { place: 'يافا' },
    });
    expect(await countFor('يافا')).toBe(1);
  });
});
