import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArchivesService } from './archives.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { QueryArchiveDto } from './dto/query-archive.dto';
import { JwtAuthGuard, OptionalAuth } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Archives')
@Controller('archives')
export class ArchivesController {
  constructor(private archivesService: ArchivesService) {}

  @Get()
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'البحث في السجلات الأرشيفية' })
  async findAll(
    @Query() query: QueryArchiveDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.archivesService.findAll(query, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء سجل أرشيفي جديد' })
  async create(
    @Body() dto: CreateArchiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.create(dto, userId);
  }

  @Get('latest')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'أحدث المواد الأرشيفية' })
  async findLatest(
    @Query('limit') limit?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.archivesService.findLatest(limit ? parseInt(limit, 10) : 6, userId);
  }

  @Get('featured')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'المواد الأرشيفية المميزة' })
  async findFeatured(
    @Query('limit') limit?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.archivesService.findFeatured(limit ? parseInt(limit, 10) : 4, userId);
  }

  @Get('stats')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'إحصائيات الأرشيف' })
  async findStats(@CurrentUser('id') userId?: string) {
    return this.archivesService.findStats(userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'المواد الأرشيفية الخاصة بي' })
  async findMy(
    @Query() query: QueryArchiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.findMy(query, userId);
  }

  @Get('my/drafts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'مسوداتي' })
  async findMyDrafts(
    @Query() query: QueryArchiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.findMyDrafts(query, userId);
  }

  @Get('my/published')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'منشوراتي' })
  async findMyPublished(
    @Query() query: QueryArchiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.findMyPublished(query, userId);
  }

  @Get(':id')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'الحصول على تفاصيل السجل الأرشيفي' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.archivesService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث السجل الأرشيفي' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArchiveDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف السجل الأرشيفي' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.remove(id, userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'نشر السجل الأرشيفي' })
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.publish(id, userId);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء نشر السجل الأرشيفي' })
  async unpublish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.archivesService.unpublish(id, userId);
  }
}
