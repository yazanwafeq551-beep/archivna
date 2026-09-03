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
}
