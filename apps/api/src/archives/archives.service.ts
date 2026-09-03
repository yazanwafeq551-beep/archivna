import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { QueryArchiveDto } from './dto/query-archive.dto';
import { buildArchiveWhere, buildArchiveOrderBy } from '../common/utils/archive-query';

@Injectable()
export class ArchivesService {
  private readonly logger = new Logger(ArchivesService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  private mapDtoToCreate(dto: CreateArchiveDto) {
    const { subjects, description, institution, creator, collection, rights, date, ...rest } = dto;
    return {
      ...rest,
      description_ar: description,
      institution_name: institution,
      creator_name: creator,
      collection_name: collection,
      rights_statement: rights,
      date_text: date,
      subjects,
    };
  }

  async create(dto: CreateArchiveDto, userId: string) {
    const mapped = this.mapDtoToCreate(dto);
    const { subjects, date_from, date_to, ...archiveData } = mapped;

    const data: any = {
      owner: { connect: { id: userId } },
      ...archiveData,
      ...(date_from && { date_from: new Date(date_from) }),
      ...(date_to && { date_to: new Date(date_to) }),
    };

    if (subjects && subjects.length > 0) {
      data.subjects = { create: subjects.map((s: string) => ({ subject: s })) };
    }

    return this.prisma.archiveRecord.create({
      data,
      include: { subjects: true },
    });
  }

  private listingIncludes = {
    owner: {
      select: { id: true, full_name: true, avatar_path: true, avatar_url: true },
    },
    subjects: true,
    files: {
      select: {
        id: true,
        original_filename: true,
        thumbnail_path: true,
        file_type: true,
        secure_url: true,
        public_id: true,
        mime_type: true,
      },
      take: 1,
    },
    _count: { select: { files: true, favorites: true } },
  };

  async findAll(query: QueryArchiveDto, userId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where = buildArchiveWhere(
      {
        q: query.q,
        material_type: query.material_type,
        institution: query.institution,
        collection: query.collection,
        place: query.place,
        language: query.language,
        access_level: query.access_level,
        subject: query.subject,
        date_from: query.date_from,
        date_to: query.date_to,
        status: query.status,
      },
      userId,
    );

    const orderBy = buildArchiveOrderBy(query.sort);

    const [records, total] = await Promise.all([
      this.prisma.archiveRecord.findMany({
        where,
        include: this.listingIncludes,
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

  async findOne(id: string, userId?: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, full_name: true, avatar_path: true, avatar_url: true },
        },
        subjects: true,
        files: {
          select: {
            id: true,
            original_filename: true,
            file_type: true,
            mime_type: true,
            file_size: true,
            thumbnail_path: true,
            secure_url: true,
            public_id: true,
            resource_type: true,
            created_at: true,
          },
        },
        _count: { select: { favorites: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (
      record.status !== 'published' ||
      record.access_level !== 'public'
    ) {
      if (!userId || record.owner_id !== userId) {
        throw new NotFoundException('السجل الأرشيفي غير موجود');
      }
    }

    return record;
  }

  async update(id: string, dto: UpdateArchiveDto, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (record.owner_id !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية تعديل هذا السجل');
    }

    const { subjects, description, institution, creator, collection, rights, date, ...rest } = dto as any;

    const updateData: any = {
      ...rest,
      ...(description !== undefined && { description_ar: description }),
      ...(institution !== undefined && { institution_name: institution }),
      ...(creator !== undefined && { creator_name: creator }),
      ...(collection !== undefined && { collection_name: collection }),
      ...(rights !== undefined && { rights_statement: rights }),
      ...(date !== undefined && { date_text: date }),
      ...(rest.date_from && { date_from: new Date(rest.date_from) }),
      ...(rest.date_to && { date_to: new Date(rest.date_to) }),
    };

    if (subjects) {
      await this.prisma.archiveSubject.deleteMany({
        where: { archive_record_id: id },
      });
      updateData.subjects = {
        create: subjects.map((s: string) => ({ subject: s })),
      };
    }

    delete updateData.subjects_array;

    return this.prisma.archiveRecord.update({
      where: { id },
      data: updateData,
      include: { subjects: true },
    });
  }

  async remove(id: string, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (record.owner_id !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية حذف هذا السجل');
    }

    try {
      await this.filesService.deleteFilesByArchiveId(id);
    } catch (error) {
      this.logger.warn(`Failed to delete Cloudinary assets for archive ${id}: ${error.message}`);
    }

    await this.prisma.archiveRecord.delete({ where: { id } });

    return { message: 'تم حذف السجل الأرشيفي بنجاح' };
  }

  async publish(id: string, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (record.owner_id !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية نشر هذا السجل');
    }

    return this.prisma.archiveRecord.update({
      where: { id },
      data: {
        status: 'published',
        published_at: new Date(),
      },
    });
  }

  async unpublish(id: string, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (record.owner_id !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية إلغاء نشر هذا السجل');
    }

    return this.prisma.archiveRecord.update({
      where: { id },
      data: {
        status: 'draft',
        published_at: null,
      },
    });
  }

  async findLatest(limit: number, userId?: string) {
    const where: Prisma.ArchiveRecordWhereInput = {
      status: 'published',
      access_level: 'public',
    };

    return this.prisma.archiveRecord.findMany({
      where,
      include: this.listingIncludes,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async findFeatured(limit: number, userId?: string) {
    const where: Prisma.ArchiveRecordWhereInput = {
      status: 'published',
      access_level: 'public',
    };

    return this.prisma.archiveRecord.findMany({
      where,
      include: this.listingIncludes,
      orderBy: [
        { created_at: 'desc' },
      ],
      take: limit,
    });
  }

  async findStats(userId?: string) {
    const publishedWhere = { status: 'published', access_level: 'public' };
    const myWhere = userId ? { owner_id: userId } : {};

    const [totalRecords, totalUsers, totalDownloads, totalInstitutions, totalDrafts, totalPublished, totalMyArchives, totalStorage] =
      await Promise.all([
        this.prisma.archiveRecord.count({ where: publishedWhere }),
        this.prisma.user.count(),
        this.prisma.archiveFile.count(),
        this.prisma.institution.count(),
        this.prisma.archiveRecord.count({ where: { ...myWhere, status: 'draft' } }),
        this.prisma.archiveRecord.count({ where: { ...myWhere, status: 'published' } }),
        this.prisma.archiveRecord.count({ where: myWhere }),
        this.prisma.archiveFile.aggregate({ _sum: { file_size: true } }),
      ]);

    return {
      totalRecords,
      totalUsers,
      totalDownloads,
      totalInstitutions,
      myDrafts: totalDrafts,
      myPublished: totalPublished,
      myArchives: totalMyArchives,
      storageUsed: totalStorage._sum.file_size || 0,
    };
  }

  async findMy(query: QueryArchiveDto, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ArchiveRecordWhereInput = {
      owner_id: userId,
    };

    let orderBy: Prisma.ArchiveRecordOrderByWithRelationInput = { created_at: 'desc' };

    const [records, total] = await Promise.all([
      this.prisma.archiveRecord.findMany({
        where,
        include: this.listingIncludes,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.archiveRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMyDrafts(query: QueryArchiveDto, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ArchiveRecordWhereInput = {
      owner_id: userId,
      status: 'draft',
    };

    const [records, total] = await Promise.all([
      this.prisma.archiveRecord.findMany({
        where,
        include: this.listingIncludes,
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.archiveRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMyPublished(query: QueryArchiveDto, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ArchiveRecordWhereInput = {
      owner_id: userId,
      status: 'published',
    };

    const [records, total] = await Promise.all([
      this.prisma.archiveRecord.findMany({
        where,
        include: this.listingIncludes,
        orderBy: { published_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.archiveRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
