import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'إبقاء الجلسة مفتوحة بعد إغلاق المتصفح',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;
}
