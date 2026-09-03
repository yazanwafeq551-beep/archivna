import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StorageService, StorageUploadResult } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadDir: string;

  constructor() {
    super();
    this.uploadDir = process.env.UPLOAD_DIRECTORY || './uploads';
    this.ensureDirectoryExists(this.uploadDir);
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
    userId: string,
  ): Promise<StorageUploadResult> {
    const targetDir = path.join(this.uploadDir, folder);
    this.ensureDirectoryExists(targetDir);

    const ext = path.extname(file.originalname).toLowerCase();
    const storedFilename = `${uuidv4()}${ext}`;
    const filePath = path.join(targetDir, storedFilename);

    try {
      if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      } else if (file.path) {
        fs.copyFileSync(file.path, filePath);
      } else {
        throw new Error('No file data available');
      }

      const storagePath = path.join(folder, storedFilename);
      const mimeType = file.mimetype || 'application/octet-stream';

      return {
        secureUrl: `/uploads/${storagePath}`,
        publicId: storagePath,
        resourceType: 'local',
        format: ext.replace('.', ''),
        originalFileName: file.originalname,
        mimeType,
        fileSize: file.size,
      };
    } catch (error) {
      throw new InternalServerErrorException('فشل في رفع الملف');
    }
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getFilePath(filePath: string): string {
    return path.join(this.uploadDir, filePath);
  }

  calculateChecksum(filePath: string): string {
    const fullPath = path.join(this.uploadDir, filePath);
    const fileBuffer = fs.readFileSync(fullPath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
