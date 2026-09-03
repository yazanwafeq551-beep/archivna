import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional({ example: '+970-59-123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'جامعة النجاح الوطنية' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;

  @ApiPropertyOptional({ example: 'باحث في التاريخ الفلسطيني' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
