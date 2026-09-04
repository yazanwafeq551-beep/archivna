import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class LessonAttachmentDto {
  @ApiProperty({ example: 'دليل الفهرسة' })
  @IsString()
  @IsNotEmpty()
  title_ar: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiProperty({ description: 'رابط الملف بعد رفعه' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'pdf' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  file_size?: number;
}

export class LessonInputDto {
  @ApiProperty({ example: 'مدخل إلى الوصف الأرشيفي' })
  @IsString()
  @IsNotEmpty()
  title_ar: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiPropertyOptional({ description: 'نص الدرس' })
  @IsOptional()
  @IsString()
  content_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary_en?: string;

  @ApiPropertyOptional({ description: 'رابط الفيديو بعد رفعه' })
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiPropertyOptional({ description: 'مدة الفيديو بالثواني' })
  @IsOptional()
  @IsInt()
  @Min(0)
  video_duration?: number;

  @ApiPropertyOptional({ description: 'وقت القراءة المقدر بالدقائق' })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimated_reading_time?: number;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [LessonAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonAttachmentDto)
  attachments?: LessonAttachmentDto[];
}

/** PATCH: every field is optional, including the title. */
export class UpdateLessonDto extends PartialType(LessonInputDto) {
  @ApiPropertyOptional({ description: 'ترتيب الدرس داخل الدورة' })
  @IsOptional()
  @IsInt()
  @Min(1)
  lesson_number?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  replace_attachments?: boolean;
}
