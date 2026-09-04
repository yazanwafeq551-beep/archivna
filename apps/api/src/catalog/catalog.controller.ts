import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, OptionalAuth, Public } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import { CreateArchivalUnitDto } from './dto/create-archival-unit.dto';
import { UpdateArchivalUnitDto } from './dto/update-archival-unit.dto';
import { CreateAgentDto, CreateControlledTermDto, LinkAgentDto, LinkTermDto } from './dto/authority.dto';

@ApiTags('Archival catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('institutions/:institutionId/hierarchy')
  @ApiOperation({ summary: 'التسلسل الهرمي لمؤسسة أرشيفية' })
  hierarchy(@Param('institutionId') institutionId: string) {
    return this.catalog.hierarchy(institutionId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('units')
  create(@Body() dto: CreateArchivalUnitDto, @CurrentUser('id') userId: string) {
    return this.catalog.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('units/:id')
  update(@Param('id') id: string, @Body() dto: UpdateArchivalUnitDto, @CurrentUser('id') userId: string) {
    return this.catalog.update(id, dto, userId);
  }

  @Public()
  @Get('units/:id/path')
  path(@Param('id') id: string) {
    return this.catalog.path(id);
  }

  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @Get('records/:id/export/:format')
  exportMetadata(
    @Param('id') id: string,
    @Param('format') format: 'dc' | 'ric' | 'ead',
    @CurrentUser('id') userId?: string,
  ) {
    return this.catalog.exportMetadata(id, format, userId);
  }

  @Public()
  @Get('agents')
  agents(@Query('q') q?: string) { return this.catalog.agents(q); }

  @Public()
  @Get('terms')
  terms(@Query('scheme') scheme?: string, @Query('q') q?: string) { return this.catalog.terms(scheme, q); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('agents')
  createAgent(@Body() dto: CreateAgentDto, @CurrentUser('id') userId: string) { return this.catalog.createAgent(dto, userId); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('terms')
  createTerm(@Body() dto: CreateControlledTermDto, @CurrentUser('id') userId: string) { return this.catalog.createTerm(dto, userId); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('records/:id/agents')
  linkAgent(@Param('id') id: string, @Body() dto: LinkAgentDto, @CurrentUser('id') userId: string) { return this.catalog.linkAgent(id, dto, userId); }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('records/:id/terms')
  linkTerm(@Param('id') id: string, @Body() dto: LinkTermDto, @CurrentUser('id') userId: string) { return this.catalog.linkTerm(id, dto, userId); }
}
