import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as path from 'path';
import * as mime from 'mime-types';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private authorization: AuthorizationService,
    private audit: AuditService,
  ) {}

  async uploadFile(
    archiveRecordId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    const archive = await this.prisma.archiveRecord.findUnique({
      where: { id: archiveRecordId },
    });

    if (!archive) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (!(await this.authorization.canEditArchive(archive, userId))) {
      throw new ForbiddenException('ليس لديك صلاحية رفع ملفات لهذا السجل');
    }

    let uploadResult;
    try {
      uploadResult = await this.storageService.upload(
        file,
        `archives/${archiveRecordId}`,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `File upload failed for archive ${archiveRecordId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('فشل في رفع الملف');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType =
      file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream';
    const fileType = this.getFileType(ext);

    const checksum = 'cloudinary-managed';

    const archiveFile = await this.prisma.archiveFile.create({
      data: {
        archive_record_id: archiveRecordId,
        owner_id: userId,
        storage_path: uploadResult.publicId,
        secure_url: uploadResult.secureUrl,
        public_id: uploadResult.publicId,
        resource_type: uploadResult.resourceType,
        original_filename: file.originalname,
        stored_filename: uploadResult.publicId.split('/').pop() || file.originalname,
        file_extension: ext,
        file_type: fileType,
        mime_type: mimeType,
        file_size: file.size,
        checksum,
      },
    });
    await this.audit.log({ userId, action: 'archive.file_uploaded', entityType: 'ArchiveFile', entityId: archiveFile.id, metadata: { archiveRecordId, mimeType } });

    return {
      id: archiveFile.id,
      original_filename: archiveFile.original_filename,
      file_type: archiveFile.file_type,
      mime_type: archiveFile.mime_type,
      file_size: archiveFile.file_size,
      secure_url: archiveFile.secure_url,
      public_id: archiveFile.public_id,
      resource_type: archiveFile.resource_type,
      checksum: archiveFile.checksum,
      created_at: archiveFile.created_at,
    };
  }

  async getFilesByArchiveId(archiveRecordId: string, userId?: string) {
    const archive = await this.prisma.archiveRecord.findUnique({
      where: { id: archiveRecordId },
    });

    if (!archive) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    const canRead = await this.authorization.canReadFile(archive, userId);

    const files = await this.prisma.archiveFile.findMany({
      where: { archive_record_id: archiveRecordId },
      select: {
        id: true,
        original_filename: true,
        file_type: true,
        mime_type: true,
        file_size: true,
        secure_url: true,
        public_id: true,
        resource_type: true,
        checksum: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    return canRead
      ? files.map((file) => ({ ...file, access_granted: true }))
      : files.map(({ secure_url, public_id, ...file }) => ({ ...file, access_granted: false }));
  }

  async getFileForDownload(archiveRecordId: string, userId?: string) {
    const archive = await this.prisma.archiveRecord.findUnique({
      where: { id: archiveRecordId },
    });

    if (!archive) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    this.authorization.assert(
      await this.authorization.canReadFile(archive, userId),
      'تحتاج إلى موافقة سارية للوصول إلى هذا الملف',
    );

    const files = await this.prisma.archiveFile.findMany({
      where: { archive_record_id: archiveRecordId },
      orderBy: { created_at: 'asc' },
    });

    if (!files || files.length === 0) {
      throw new NotFoundException('لا توجد ملفات مرفقة لهذا السجل');
    }

    return files[0];
  }

  async getFileById(fileId: string, userId?: string) {
    const file = await this.prisma.archiveFile.findUnique({
      where: { id: fileId },
      include: {
        archive_record: {
          select: { owner_id: true, status: true, access_level: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('الملف غير موجود');
    }

    const archive = file.archive_record;
    this.authorization.assert(
      await this.authorization.canReadFile({ id: file.archive_record_id, ...archive }, userId),
      'تحتاج إلى موافقة سارية للوصول إلى هذا الملف',
    );

    return file;
  }

  resolveDelivery(file: { secure_url: string | null; storage_path: string; resource_type: string | null }) {
    if (file.secure_url?.startsWith('/uploads/') || file.resource_type === 'local') {
      const uploadsRoot = path.resolve(process.cwd(), 'uploads');
      const filePath = path.resolve(uploadsRoot, file.storage_path);
      if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
        throw new ForbiddenException('مسار الملف غير صالح');
      }
      return { kind: 'local' as const, path: filePath };
    }
    if (file.secure_url) return { kind: 'remote' as const, url: file.secure_url };
    throw new NotFoundException('الملف غير موجود');
  }

  async deleteFile(archiveRecordId: string, userId: string) {
    const archive = await this.prisma.archiveRecord.findUnique({
      where: { id: archiveRecordId },
    });

    if (!archive) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (!(await this.authorization.canEditArchive(archive, userId))) {
      throw new ForbiddenException('ليس لديك صلاحية حذف ملفات هذا السجل');
    }

    const files = await this.prisma.archiveFile.findMany({
      where: { archive_record_id: archiveRecordId },
    });

    if (!files || files.length === 0) {
      throw new NotFoundException('لا توجد ملفات مرفقة لهذا السجل');
    }

    for (const file of files) {
      const deleteId = file.public_id || file.storage_path;
      await this.storageService.delete(deleteId).catch((err) => {
        this.logger.warn(`Failed to delete Cloudinary asset ${deleteId}: ${err.message}`);
      });
    }

    await this.prisma.archiveFile.deleteMany({
      where: { archive_record_id: archiveRecordId },
    });

    return { message: 'تم حذف جميع ملفات السجل بنجاح' };
  }

  /** Removes a single attachment, leaving the rest of the record intact. */
  async deleteSingleFile(
    archiveRecordId: string,
    fileId: string,
    userId: string,
  ) {
    const archive = await this.prisma.archiveRecord.findUnique({
      where: { id: archiveRecordId },
    });

    if (!archive) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (!(await this.authorization.canEditArchive(archive, userId))) {
      throw new ForbiddenException('ليس لديك صلاحية حذف ملفات هذا السجل');
    }

    const file = await this.prisma.archiveFile.findFirst({
      where: { id: fileId, archive_record_id: archiveRecordId },
    });

    if (!file) {
      throw new NotFoundException('الملف غير موجود');
    }

    const deleteId = file.public_id || file.storage_path;
    await this.storageService.delete(deleteId).catch((err) => {
      this.logger.warn(`Failed to delete stored asset ${deleteId}: ${err.message}`);
    });

    await this.prisma.archiveFile.delete({ where: { id: file.id } });

    return { message: 'تم حذف الملف بنجاح' };
  }

  async deleteFilesByArchiveId(archiveRecordId: string) {
    const files = await this.prisma.archiveFile.findMany({
      where: { archive_record_id: archiveRecordId },
    });

    for (const file of files) {
      const deleteId = file.public_id || file.storage_path;
      await this.storageService.delete(deleteId).catch((err) => {
        this.logger.warn(`Failed to delete Cloudinary asset ${deleteId}: ${err.message}`);
      });
    }

    await this.prisma.archiveFile.deleteMany({
      where: { archive_record_id: archiveRecordId },
    });
  }

  private getFileType(ext: string): string {
    const imageExts = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.tiff',
      '.bmp',
    ];
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const videoExts = ['.mp4', '.webm', '.avi', '.mov'];

    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    if (videoExts.includes(ext)) return 'video';
    return 'document';
  }
}
