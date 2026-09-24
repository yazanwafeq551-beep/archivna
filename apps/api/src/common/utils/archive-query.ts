import { Prisma } from '@prisma/client';
import { buildSearchTerms } from './arabic-normalization';

export interface ArchiveQueryParams {
  q?: string;
  material_type?: string;
  institution?: string;
  institution_id?: string;
  archival_unit_id?: string;
  collection?: string;
  place?: string;
  language?: string;
  access_level?: string;
  subject?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export function buildArchiveWhere(
  params: ArchiveQueryParams,
  userId?: string,
): Prisma.ArchiveRecordWhereInput {
  const andClauses: Prisma.ArchiveRecordWhereInput[] = [];

  if (userId) {
    andClauses.push({
      OR: [
        { status: 'published', access_level: { in: ['public', 'sensitive'] } },
        { owner_id: userId },
      ],
    });
  } else {
    andClauses.push({ status: 'published', access_level: { in: ['public', 'sensitive'] } });
  }

  if (params.q) {
    /*
     * One normalised column instead of a nineteen-way OR over raw ones.
     * The old form compared a normalised query against text that was never
     * normalised, so "دبكة" became "دبكه" and matched nothing at all: the
     * folding that was supposed to widen the search was the thing closing
     * it. search_text holds the same folding, applied by the database.
     *
     * Terms are ANDed so every word has to appear somewhere in the record,
     * and each term carries its spellings - "الدبكة" also searches "دبكة".
     */
    for (const variants of buildSearchTerms(params.q)) {
      andClauses.push({
        OR: variants.map((variant) => ({
          search_text: { contains: variant },
        })),
      });
    }
  }

  if (params.material_type) {
    const types = params.material_type.split(',').filter(Boolean);
    if (types.length === 1) {
      andClauses.push({ material_type: types[0] });
    } else if (types.length > 1) {
      andClauses.push({ material_type: { in: types } });
    }
  }

  if (params.institution) {
    andClauses.push({
      OR: [
        { institution_name: { contains: params.institution, mode: 'insensitive' } },
        { institution: { name_ar: { contains: params.institution, mode: 'insensitive' } } },
        { institution: { name_en: { contains: params.institution, mode: 'insensitive' } } },
      ],
    });
  }

  if (params.institution_id) andClauses.push({ institution_id: params.institution_id });
  if (params.archival_unit_id) {
    andClauses.push({
      OR: [
        { archival_unit_id: params.archival_unit_id },
        { archival_unit: { parent_id: params.archival_unit_id } },
      ],
    });
  }

  if (params.collection) {
    andClauses.push({
      collection_name: { contains: params.collection, mode: 'insensitive' },
    });
  }

  if (params.place) {
    andClauses.push({
      place: { contains: params.place, mode: 'insensitive' },
    });
  }

  if (params.language) {
    andClauses.push({
      language: { contains: params.language, mode: 'insensitive' },
    });
  }

  if (params.access_level) {
    const levels = params.access_level.split(',').filter(Boolean);
    if (levels.length === 1) {
      andClauses.push({ access_level: levels[0] });
    } else if (levels.length > 1) {
      andClauses.push({ access_level: { in: levels } });
    }
  }

  if (params.status && userId) {
    andClauses.push({ status: params.status });
  }

  if (params.subject) {
    andClauses.push({
      subjects: {
        some: { subject: { contains: params.subject, mode: 'insensitive' } },
      },
    });
  }

  if (params.date_from) {
    andClauses.push({
      date_from: { gte: new Date(params.date_from) },
    });
  }

  if (params.date_to) {
    andClauses.push({
      date_to: { lte: new Date(params.date_to) },
    });
  }

  return { AND: andClauses };
}

export function buildArchiveOrderBy(
  sort?: string,
): Prisma.ArchiveRecordOrderByWithRelationInput {
  switch (sort) {
    case 'oldest':
      return { created_at: 'asc' };
    case 'title':
      return { title_ar: 'asc' };
    case 'relevance':
      return { created_at: 'desc' };
    case 'newest':
    default:
      return { created_at: 'desc' };
  }
}

/**
 * Listings may expose file locations for public records only. Restricted
 * records still list their files (so the UI can show what exists) but without
 * anything that could be fetched directly.
 */
export function sanitizeListingRecord<T extends { access_level?: string; files?: any[] }>(
  record: T,
): T {
  if (record.access_level === 'public') return record;

  return {
    ...record,
    files: (record.files || []).map(
      ({ secure_url, public_id, thumbnail_path, ...file }: any) => file,
    ),
  };
}
