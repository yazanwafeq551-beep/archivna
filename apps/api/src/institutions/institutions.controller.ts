import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { JwtAuthGuard, Public } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private institutionsService: InstitutionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'البحث عن المؤسسات' })
  async findAll(@Query('q') q?: string) {
    return this.institutionsService.findAll(q);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل مؤسسة' })
  async findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء مؤسسة جديدة' })
  async create(
    @Body() dto: CreateInstitutionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.institutionsService.create(dto, userId);
  }
}
