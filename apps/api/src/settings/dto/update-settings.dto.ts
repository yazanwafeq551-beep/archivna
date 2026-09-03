import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: ['ar', 'en'] })
  @IsOptional()
  @IsEnum(['ar', 'en'])
  language?: string;

  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  theme?: string;

  @ApiPropertyOptional({ enum: ['small', 'medium', 'large', 'normal'] })
  @IsOptional()
  @IsEnum(['small', 'medium', 'large', 'normal'])
  text_size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reduced_motion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;
}
