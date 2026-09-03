import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString() @IsNotEmpty() title_ar: string;
  @IsOptional() @IsString() title_en?: string;
  @IsString() @IsNotEmpty() instructor_name: string;
  @IsOptional() @IsString() short_desc_ar?: string;
  @IsOptional() @IsString() full_desc_ar?: string;
  @IsOptional() @IsString() thumbnail_url?: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsInt() @Min(1) duration?: number;
  @IsOptional() @IsBoolean() is_featured?: boolean;
  @IsString() @IsNotEmpty() lesson_title_ar: string;
  @IsOptional() @IsString() lesson_title_en?: string;
  @IsOptional() @IsString() lesson_content_ar?: string;
  @IsOptional() @IsString() lesson_summary_ar?: string;
  @IsOptional() @IsString() lesson_video_url?: string;
}
