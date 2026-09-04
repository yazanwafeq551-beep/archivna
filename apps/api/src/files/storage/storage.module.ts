import { Module } from '@nestjs/common';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.service';

/**
 * STORAGE_DRIVER picks where uploads land. It used to be ignored, so a
 * deployment configured for local disk still shipped everything to Cloudinary.
 */
@Module({
  providers: [
    {
      provide: StorageService,
      useClass:
        process.env.STORAGE_DRIVER === 'local'
          ? LocalStorageService
          : CloudinaryStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
