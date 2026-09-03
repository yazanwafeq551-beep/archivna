import { Module } from '@nestjs/common';
import { ArchivesService } from './archives.service';
import { ArchivesController } from './archives.controller';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [ArchivesController],
  providers: [ArchivesService],
  exports: [ArchivesService],
})
export class ArchivesModule {}
