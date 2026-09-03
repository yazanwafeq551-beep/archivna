import { Prisma } from '@prisma/client';
import { normalizeSearchQuery } from './arabic-normalization';

export interface ArchiveQueryParams {
  q?: string;
  material_type?: string;
  institution?: string;
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
        { status: 'published', access_level: 'public' },
        { owner_id: userId },
      ],
    });
  } else {
    andClauses.push({ status: 'published', access_level: 'public' });
  }

  if (params.q) {
    const normalizedQuery = normalizeSearchQuery(params.q);
    andClauses.push({
      OR: [
        { title_ar: { contains: normalizedQuery, mode: 'insensitive' } },
        { title_en: { contains: normalizedQuery, mode: 'insensitive' } },
        {
          alternative_title_ar: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          alternative_title_en: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          reference_number: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          description_ar: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          description_en: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          creator_name: { contains: normalizedQuery, mode: 'insensitive' },
        },
        {
          institution_name: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          collection_name: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          subject_text: { contains: normalizedQuery, mode: 'insensitive' },
        },
        { place: { contains: normalizedQuery, mode: 'insensitive' } },
        {
          ocr_text_ar: { contains: normalizedQuery, mode: 'insensitive' },
        },
        {
          ocr_text_en: { contains: normalizedQuery, mode: 'insensitive' },
        },
      ],
    });
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
      institution_name: { contains: params.institution, mode: 'insensitive' },
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
