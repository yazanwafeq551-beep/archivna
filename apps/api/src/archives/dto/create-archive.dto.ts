import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArchiveDto {
  @ApiProperty({ example: 'وثائق النكبة الفلسطينية' })
  @IsString()
  @MaxLength(300)
  title_ar: string;

  @ApiPropertyOptional({ example: 'Palestinian Nakba Documents' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title_en?: string;

  @ApiPropertyOptional({ example: 'ARC-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_number?: string;

  @ApiPropertyOptional({ example: 'وصف الوثيقة...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  creator?: string;

  @ApiPropertyOptional({ example: 'جامعة النجاح الوطنية' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;

  @ApiPropertyOptional({ example: 'أرشيف النكبة' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  collection?: string;

  @ApiPropertyOptional({ example: 'النكبة الفلسطينية' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject_text?: string;

  @ApiPropertyOptional({ example: 'فلسطين' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  place?: string;

  @ApiPropertyOptional({ example: 'العربية' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  language?: string;

  @ApiProperty({ example: 'document', enum: ['document', 'image', 'audio', 'video'] })
  @IsString()
  @IsEnum(['document', 'image', 'audio', 'video'])
  material_type: string;

  @ApiPropertyOptional({ example: '1948' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rights?: string;

  @ApiPropertyOptional({ example: 'public', enum: ['public', 'sensitive', 'private'] })
  @IsOptional()
  @IsString()
  @IsEnum(['public', 'sensitive', 'private'])
  access_level?: string;

  @ApiPropertyOptional({ example: ['nkba', 'history'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  subjects?: string[];

  @ApiPropertyOptional({ example: 'published', enum: ['draft', 'published'] })
  @IsOptional()
  @IsString()
  status?: string;
}
