import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { JwtAuthGuard, Public } from '../auth/auth.guard';
import { parsePage, parseLimit } from '../common/utils/pagination';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'الحصول على الأخبار' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parsePage(page);
    const limitNum = parseLimit(limit, 10, 50);
    return this.newsService.findAll(pageNum, limitNum);
  }

  @Get('categories')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'الحصول على تصنيفات الأخبار' })
  async findCategories() {
    return this.newsService.findCategories();
  }

  @Get('latest')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'آخر الأخبار' })
  async findLatest(@Query('limit') limit?: string) {
    return this.newsService.findLatest(parseLimit(limit, 3, 50));
  }

  @Get(':slug')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'الحصول على مقال بالرابط المختصر' })
  async findBySlug(@Param('slug') slug: string) {
    return this.newsService.findBySlug(slug);
  }
}
