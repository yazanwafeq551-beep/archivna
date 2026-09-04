import { Module } from '@nestjs/common';
import { ArchivesService } from './archives.service';
import { ArchivesController } from './archives.controller';
import { FilesModule } from '../files/files.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [FilesModule, AuditModule],
  controllers: [ArchivesController],
  providers: [ArchivesService],
  exports: [ArchivesService],
})
export class ArchivesModule {}
