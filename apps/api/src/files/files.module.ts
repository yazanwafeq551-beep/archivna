import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
