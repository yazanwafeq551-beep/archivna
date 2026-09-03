import { Injectable } from '@nestjs/common';

export interface StorageUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}

@Injectable()
export abstract class StorageService {
  abstract upload(
    file: Express.Multer.File,
    folder: string,
    userId: string,
  ): Promise<StorageUploadResult>;
  abstract delete(path: string): Promise<void>;
  abstract getFilePath(path: string): string;
  abstract calculateChecksum(path: string): string;
}
