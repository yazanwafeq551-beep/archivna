import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateArchivalUnitDto {
  @IsString()
  institution_id: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  @IsEnum(['fonds', 'collection', 'series', 'file'])
  level: string;

  @IsString()
  @MaxLength(300)
  title_ar: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title_en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_code?: string;

  @IsOptional()
  @IsString()
  description_ar?: string;

  @IsOptional()
  @IsString()
  description_en?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
