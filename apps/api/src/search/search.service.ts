import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildArchiveWhere, buildArchiveOrderBy } from '../common/utils/archive-query';

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  material_type?: string;
  institution_name?: string;
  institution_id?: string;
  archival_unit_id?: string;
  collection_name?: string;
  date_from?: string;
  date_to?: string;
  subject?: string;
  place?: string;
  language?: string;
  access_level?: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(params: SearchParams, userId?: string) {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    const where = buildArchiveWhere(
      {
        q: params.q,
        material_type: params.material_type,
        institution: params.institution_name,
        institution_id: params.institution_id,
        archival_unit_id: params.archival_unit_id,
        collection: params.collection_name,
        place: params.place,
        language: params.language,
        access_level: params.access_level,
        subject: params.subject,
        date_from: params.date_from,
        date_to: params.date_to,
      },
      userId,
    );

    const orderBy = buildArchiveOrderBy(params.sort);

    const [records, total] = await Promise.all([
      this.prisma.archiveRecord.findMany({
        where,
        include: {
          owner: {
            select: { id: true, full_name: true, avatar_path: true },
          },
          subjects: true,
          institution: { select: { id: true, name_ar: true, name_en: true } },
          archival_unit: { select: { id: true, title_ar: true, title_en: true, level: true, reference_code: true } },
          access_policy: { select: { requires_reason: true, watermark_enabled: true } },
          files: {
            select: { id: true, original_filename: true, thumbnail_path: true, file_type: true },
            take: 1,
          },
          _count: { select: { files: true, favorites: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.archiveRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async suggestions(q: string, userId?: string) {
    const term = q.trim();
    if (term.length < 2) return [];
    const where = buildArchiveWhere({ q: term }, userId);
    const records = await this.prisma.archiveRecord.findMany({
      where,
      select: {
        id: true,
        title_ar: true,
        title_en: true,
        reference_number: true,
        institution: { select: { name_ar: true, name_en: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 8,
    });
    return records.map((record) => ({
      id: record.id,
      label_ar: record.title_ar,
      label_en: record.title_en,
      reference_number: record.reference_number,
      institution_ar: record.institution?.name_ar,
      institution_en: record.institution?.name_en,
    }));
  }
}
