import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { StorageService, StorageUploadResult } from './storage.service';

@Injectable()
export class CloudinaryStorageService extends StorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  constructor() {
    super();
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private getCloudinaryResourceType(mimetype: string): 'image' | 'video' | 'raw' | 'auto' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw';
  }

  private getCloudinaryFolder(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
    userId: string,
  ): Promise<StorageUploadResult> {
    try {
      const resourceType = this.getCloudinaryResourceType(file.mimetype);
      const cloudinaryFolder = `archivna/${folder}/${this.getCloudinaryFolder(file.mimetype)}`;
      const ext = file.originalname.split('.').pop() || 'bin';
      const safeFilename = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_');
      const publicId = `${cloudinaryFolder}/${Date.now()}_${safeFilename.replace(`.${ext}`, '')}`;

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: resourceType,
            folder: undefined,
            format: ext,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        if (file.buffer) {
          const readable = new Readable();
          readable.push(file.buffer);
          readable.push(null);
          readable.pipe(uploadStream);
        } else {
          reject(new Error('No file data available'));
        }
      });

      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format || ext,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      };
    } catch (error) {
      this.logger.error(
        `Cloudinary upload failed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('فشل في رفع الملف إلى السحابة');
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      const parts = publicId.split('/');
      const filename = parts[parts.length - 1];
      const ext = filename.split('.').pop();

      let resourceType: string;
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext || '')) {
        resourceType = 'image';
      } else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext || '')) {
        resourceType = 'video';
      } else {
        resourceType = 'raw';
      }

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      this.logger.warn(
        `Cloudinary delete failed for ${publicId}: ${error.message}`,
      );
    }
  }

  getFilePath(filePath: string): string {
    return filePath;
  }

  calculateChecksum(_filePath: string): string {
    return 'cloudinary-managed';
  }
}
