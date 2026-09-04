import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryArchiveDto {
  @ApiPropertyOptional({ description: 'نص البحث' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['relevance', 'newest', 'oldest'], default: 'newest' })
  @IsOptional()
  @IsString()
  @IsEnum(['relevance', 'newest', 'oldest'])
  sort?: string;

  @ApiPropertyOptional({
    enum: ['document', 'image', 'audio', 'video', 'map', 'manuscript'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['document', 'image', 'audio', 'video', 'map', 'manuscript'])
  material_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  archival_unit_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ enum: ['public', 'sensitive', 'sovereign'] })
  @IsOptional()
  @IsString()
  access_level?: string;

  @ApiPropertyOptional({ enum: ['draft', 'processing', 'cataloging', 'in_review', 'approved', 'published', 'archived'] })
  @IsOptional()
  @IsString()
  @IsEnum(['draft', 'processing', 'cataloging', 'in_review', 'approved', 'published', 'archived'])
  status?: string;
}
