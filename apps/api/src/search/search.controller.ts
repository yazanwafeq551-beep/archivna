import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService, SearchParams } from './search.service';
import { JwtAuthGuard, OptionalAuth } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { parsePage, parseLimit } from '../common/utils/pagination';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('suggestions')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'اقتراحات البحث العربي' })
  async suggestions(@Query('q') q?: string, @CurrentUser('id') userId?: string) {
    return this.searchService.suggestions(q || '', userId);
  }

  @Get()
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'بحث في السجلات الأرشيفية' })
  async search(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('material_type') material_type?: string,
    @Query('institution_name') institution?: string,
    @Query('institution') institutionAlt?: string,
    @Query('institution_id') institution_id?: string,
    @Query('archival_unit_id') archival_unit_id?: string,
    @Query('collection') collection?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('subject') subject?: string,
    @Query('place') place?: string,
    @Query('language') language?: string,
    @Query('access_level') access_level?: string,
    @CurrentUser('id') userId?: string,
  ) {
    const params: SearchParams = {
      q,
      page: parsePage(page),
      limit: parseLimit(limit, 12, 100),
      sort,
      material_type,
      institution_name: institution || institutionAlt,
      institution_id,
      archival_unit_id,
      collection_name: collection,
      date_from,
      date_to,
      subject,
      place,
      language,
      access_level,
    };

    return this.searchService.search(params, userId);
  }
}
