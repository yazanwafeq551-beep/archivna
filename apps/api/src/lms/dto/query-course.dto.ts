import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCourseDto {
  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructor?: string;

  @ApiPropertyOptional({ enum: ['newest', 'popular', 'rating', 'oldest'] })
  @IsOptional()
  @IsString()
  sort?: string;
}
