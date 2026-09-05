import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SUPPORT_KINDS = [
  'consultation',
  'feedback',
  'complaint',
  'suggestion',
] as const;

export class CreateSupportRequestDto {
  @ApiProperty({ enum: SUPPORT_KINDS })
  @IsIn(SUPPORT_KINDS as unknown as string[])
  kind: string;

  @ApiPropertyOptional({ description: 'مجال الاستشارة أو تصنيف الملاحظة' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ description: 'بريد بديل للرد' })
  @IsOptional()
  @IsEmail()
  contact_email?: string;
}
