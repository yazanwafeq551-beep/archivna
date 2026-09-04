import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
  video: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
};

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
  video: ['.mp4', '.webm', '.avi', '.mov'],
  archive: ['.zip', '.rar', '.7z'],
};

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    const ext = this.getExtension(file.originalname);
    let matchedCategory: string | null = null;

    for (const [category, extensions] of Object.entries(ALLOWED_EXTENSIONS)) {
      if (extensions.includes(ext)) {
        matchedCategory = category;
        break;
      }
    }

    if (!matchedCategory) {
      throw new BadRequestException(
        `امتداد الملف "${ext}" غير مدعوم. الامتدادات المدعومة: ${Object.values(ALLOWED_EXTENSIONS).flat().join(', ')}`,
      );
    }

    const allowedMimes = ALLOWED_MIME_TYPES[matchedCategory];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `نوع الملف "${file.mimetype}" غير متوافق مع امتداد "${ext}"`,
      );
    }

    const maxSize = this.getMaxSize(matchedCategory);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد الأقصى (${this.formatSize(maxSize)})`,
      );
    }

    return file;
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  }

  private getMaxSize(category: string): number {
    const envSizes: Record<string, string | undefined> = {
      image: process.env.MAX_IMAGE_SIZE,
      document: process.env.MAX_DOCUMENT_SIZE,
      audio: process.env.MAX_AUDIO_SIZE,
      video: process.env.MAX_VIDEO_SIZE,
      archive: process.env.MAX_ZIP_SIZE,
    };
    const envVal = envSizes[category];
    if (envVal) return parseInt(envVal, 10);

    const defaults: Record<string, number> = {
      image: 20 * 1024 * 1024,
      document: 100 * 1024 * 1024,
      audio: 250 * 1024 * 1024,
      video: 1024 * 1024 * 1024,
      archive: 250 * 1024 * 1024,
    };
    return defaults[category] || 100 * 1024 * 1024;
  }

  private formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
}
