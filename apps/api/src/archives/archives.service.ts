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
import {
  buildArchiveWhere,
  buildArchiveOrderBy,
  sanitizeListingRecord,
} from '../common/utils/archive-query';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ArchivesService {
  private readonly logger = new Logger(ArchivesService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private authorization: AuthorizationService,
    private audit: AuditService,
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
    const { subjects, date_from, date_to, status: _requestedStatus, institution_id: _institutionId, archival_unit_id: _archivalUnitId, ...archiveData } = mapped;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    const pilot = await this.prisma.institution.findUnique({ where: { slug: 'palestinian-archival-collective' } });
    const institutionId = dto.institution_id || user.institution_id || pilot?.id;
    if (!institutionId) throw new ForbiddenException('يجب ربط السجل بمؤسسة أرشيفية');
    this.authorization.assert(
      await this.authorization.canDeposit(userId, institutionId),
      'يتطلب إيداع المواد دور المودع أو المفهرس',
    );
    if (dto.archival_unit_id) {
      const unit = await this.prisma.archivalUnit.findUnique({ where: { id: dto.archival_unit_id } });
      if (!unit || unit.institution_id !== institutionId) throw new ForbiddenException('الوحدة الأرشيفية لا تتبع المؤسسة المحددة');
    }

    const data: any = {
      owner: { connect: { id: userId } },
      ...archiveData,
      institution: { connect: { id: institutionId } },
      ...(dto.archival_unit_id && { archival_unit: { connect: { id: dto.archival_unit_id } } }),
      status: 'draft',
      ...(date_from && { date_from: new Date(date_from) }),
      ...(date_to && { date_to: new Date(date_to) }),
      access_policy: {
        create: {
          access_level: archiveData.access_level || 'public',
          metadata_visibility: archiveData.access_level === 'sovereign' ? 'restricted' : 'public',
          requires_reason: archiveData.access_level !== 'public',
          watermark_enabled: archiveData.access_level === 'sensitive',
        },
      },
      workflow_events: {
        create: { actor: { connect: { id: userId } }, to_status: 'draft', note: 'إنشاء السجل' },
      },
    };

    if (subjects && subjects.length > 0) {
      data.subjects = { create: subjects.map((s: string) => ({ subject: s })) };
    }

    const record = await this.prisma.archiveRecord.create({
      data,
      include: { subjects: true, institution: true, archival_unit: true, access_policy: true },
    });
    await this.audit.log({ userId, action: 'archive.created', entityType: 'ArchiveRecord', entityId: record.id, metadata: { institutionId } });
    return record;
  }

  private listingIncludes = {
    owner: {
      select: { id: true, full_name: true, avatar_path: true, avatar_url: true },
    },
    subjects: true,
    institution: { select: { id: true, name_ar: true, name_en: true, slug: true } },
    archival_unit: { select: { id: true, title_ar: true, title_en: true, level: true, reference_code: true } },
    access_policy: { select: { access_level: true, metadata_visibility: true, requires_reason: true, watermark_enabled: true } },
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

  private sanitizeListingRecord(record: any) {
    return sanitizeListingRecord(record);
  }

  async findAll(query: QueryArchiveDto, userId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where = buildArchiveWhere(
      {
        q: query.q,
        material_type: query.material_type,
        institution: query.institution,
        institution_id: query.institution_id,
        archival_unit_id: query.archival_unit_id,
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
      data: records.map((record) => this.sanitizeListingRecord(record)),
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
        institution: true,
        archival_unit: true,
        access_policy: true,
        workflow_events: { orderBy: { created_at: 'asc' }, include: { actor: { select: { id: true, full_name: true } } } },
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

    const isOwner = Boolean(userId && record.owner_id === userId);
    const canReview = userId ? await this.authorization.canReview(userId, record.institution_id) : false;
    if (record.status !== 'published' && !isOwner && !canReview) throw new NotFoundException('السجل الأرشيفي غير موجود');
    if (record.access_level === 'sovereign' && !isOwner && !(await this.authorization.canAdministerSovereign(userId))) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }
    const canReadFile = await this.authorization.canReadFile(record, userId);
    if (canReadFile) return { ...record, access_granted: true };
    return {
      ...record,
      access_granted: false,
      files: record.files.map(({ secure_url, public_id, storage_path, ...metadata }: any) => metadata),
      technical_metadata: undefined,
      ocr_text_ar: undefined,
      ocr_text_en: undefined,
    };
  }

  async update(id: string, dto: UpdateArchiveDto, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (!(await this.authorization.canEditArchive(record, userId))) {
      throw new ForbiddenException('ليس لديك صلاحية تعديل هذا السجل');
    }

    const { subjects, description, institution, creator, collection, rights, date, status: _status, ...rest } = dto as any;
    if (rest.institution_id && rest.institution_id !== record.institution_id) {
      this.authorization.assert(await this.authorization.canManageInstitution(userId, rest.institution_id), 'تغيير المؤسسة يتطلب صلاحية مدير');
    }
    if (rest.archival_unit_id) {
      const unit = await this.prisma.archivalUnit.findUnique({ where: { id: rest.archival_unit_id } });
      const targetInstitutionId = rest.institution_id || record.institution_id;
      if (!unit || unit.institution_id !== targetInstitutionId) throw new ForbiddenException('الوحدة الأرشيفية لا تتبع المؤسسة المحددة');
    }

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

    const updated = await this.prisma.archiveRecord.update({
      where: { id },
      data: updateData,
      include: { subjects: true, institution: true, archival_unit: true, access_policy: true },
    });
    if (dto.access_level && dto.access_level !== record.access_level) {
      await this.prisma.accessPolicy.upsert({
        where: { archive_record_id: id },
        create: { archive_record_id: id, access_level: dto.access_level, metadata_visibility: dto.access_level === 'sovereign' ? 'restricted' : 'public', requires_reason: dto.access_level !== 'public', watermark_enabled: dto.access_level === 'sensitive' },
        update: { access_level: dto.access_level, metadata_visibility: dto.access_level === 'sovereign' ? 'restricted' : 'public', requires_reason: dto.access_level !== 'public', watermark_enabled: dto.access_level === 'sensitive' },
      });
    }
    await this.audit.log({ userId, action: 'archive.updated', entityType: 'ArchiveRecord', entityId: id });
    return updated;
  }

  async remove(id: string, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (!(await this.authorization.canEditArchive(record, userId))) {
      throw new ForbiddenException('ليس لديك صلاحية حذف هذا السجل');
    }

    try {
      await this.filesService.deleteFilesByArchiveId(id);
    } catch (error) {
      this.logger.warn(`Failed to delete Cloudinary assets for archive ${id}: ${error.message}`);
    }

    await this.prisma.archiveRecord.delete({ where: { id } });
    await this.audit.log({ userId, action: 'archive.deleted', entityType: 'ArchiveRecord', entityId: id });

    return { message: 'تم حذف السجل الأرشيفي بنجاح' };
  }

  async publish(id: string, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    this.authorization.assert(record.status === 'approved', 'يجب اعتماد السجل قبل نشره');
    this.authorization.assert(await this.authorization.canApprove(userId, record.institution_id), 'النشر يتطلب صلاحية مدير المؤسسة');

    const updated = await this.prisma.archiveRecord.update({
      where: { id },
      data: {
        status: 'published',
        published_at: new Date(),
      },
    });
    await this.prisma.archiveWorkflowEvent.create({ data: { archive_record_id: id, actor_id: userId, from_status: record.status, to_status: 'published', note: 'نشر عبر مسار التوافق' } });
    await this.audit.log({ userId, action: 'archive.workflow.publish', entityType: 'ArchiveRecord', entityId: id, metadata: { from: record.status, to: 'published' } });
    return updated;
  }

  async unpublish(id: string, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    this.authorization.assert(record.status === 'published', 'يمكن إلغاء نشر السجلات المنشورة فقط');
    this.authorization.assert(await this.authorization.canApprove(userId, record.institution_id), 'إلغاء النشر يتطلب صلاحية مدير المؤسسة');

    const updated = await this.prisma.archiveRecord.update({
      where: { id },
      data: {
        status: 'draft',
        published_at: null,
      },
    });
    await this.prisma.archiveWorkflowEvent.create({ data: { archive_record_id: id, actor_id: userId, from_status: record.status, to_status: 'draft', note: 'إلغاء النشر عبر مسار التوافق' } });
    await this.audit.log({ userId, action: 'archive.workflow.unpublish', entityType: 'ArchiveRecord', entityId: id, metadata: { from: record.status, to: 'draft' } });
    return updated;
  }

  async findLatest(limit: number, userId?: string) {
    const where: Prisma.ArchiveRecordWhereInput = {
      status: 'published',
      access_level: { in: ['public', 'sensitive'] },
    };

    const records = await this.prisma.archiveRecord.findMany({
      where,
      include: this.listingIncludes,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return records.map((record) => this.sanitizeListingRecord(record));
  }

  async findFeatured(limit: number, userId?: string) {
    const where: Prisma.ArchiveRecordWhereInput = {
      status: 'published',
      access_level: { in: ['public', 'sensitive'] },
    };

    const records = await this.prisma.archiveRecord.findMany({
      where,
      include: this.listingIncludes,
      orderBy: [
        { created_at: 'desc' },
      ],
      take: limit,
    });
    return records.map((record) => this.sanitizeListingRecord(record));
  }

  async findStats(userId?: string) {
    const publishedWhere = { status: 'published', access_level: { in: ['public', 'sensitive'] } };
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
