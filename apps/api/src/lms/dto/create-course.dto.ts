import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonInputDto } from './lesson.dto';

export class CreateCourseDto {
  @ApiProperty({ example: 'أساسيات الوصف الأرشيفي' })
  @IsString()
  @IsNotEmpty()
  title_ar: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiProperty({ example: 'أرشيفنا' })
  @IsString()
  @IsNotEmpty()
  instructor_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructor_bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  short_desc_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  short_desc_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  full_desc_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  full_desc_en?: string;

  @ApiPropertyOptional({ description: 'رابط الغلاف بعد رفعه' })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @ApiPropertyOptional({ description: 'مدة الدورة بالدقائق' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ enum: ['draft', 'published'], default: 'published' })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;

  @ApiProperty({ type: [LessonInputDto], description: 'درس واحد على الأقل' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LessonInputDto)
  lessons: LessonInputDto[];
}
