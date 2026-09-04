import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard, OptionalAuth } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@ApiTags('Files')
@Controller('archives')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post(':id/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(process.env.MAX_VIDEO_SIZE || '1073741824'),
      },
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'رفع ملف للسجل الأرشيفي' })
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.filesService.uploadFile(id, file, userId);
  }

  @Get(':id/file')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'الحصول على معلومات ملفات السجل' })
  async getFileMetadata(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.filesService.getFilesByArchiveId(id, userId);
  }

  @Get(':id/download')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'تحميل ملف السجل الأرشيفي' })
  async downloadFile(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const file = await this.filesService.getFileForDownload(id, userId);
    return this.deliver(file, res, false);
  }

  @Delete(':id/file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف جميع ملفات السجل الأرشيفي' })
  async deleteAllFiles(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.filesService.deleteFile(id, userId);
  }

  @Delete(':id/file/:fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف ملف واحد من السجل الأرشيفي' })
  async deleteFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.filesService.deleteSingleFile(id, fileId, userId);
  }

  @Get('file/:fileId/download')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'تحميل ملف بواسطة معرف الملف' })
  async downloadFileById(
    @Param('fileId') fileId: string,
    @Res() res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const file = await this.filesService.getFileById(fileId, userId);
    return this.deliver(file, res, false);
  }

  @Get('file/:fileId/content')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'عرض محتوى الملف بعد التحقق من صلاحية الوصول' })
  async viewFileById(
    @Param('fileId') fileId: string,
    @Res() res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const file = await this.filesService.getFileById(fileId, userId);
    return this.deliver(file, res, true);
  }

  private deliver(
    file: { secure_url: string | null; storage_path: string; resource_type: string | null; mime_type: string; original_filename: string },
    res: Response,
    inline: boolean,
  ) {
    const delivery = this.filesService.resolveDelivery(file);
    if (delivery.kind === 'remote') return res.redirect(delivery.url);
    res.type(file.mime_type);
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.original_filename)}`,
    );
    return res.sendFile(delivery.path);
  }
}
