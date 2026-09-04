import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  // No length rule here: sign-in checks the stored password, and rejecting a
  // short one with a validation error would both leak the policy and lock out
  // accounts created under an older rule.
  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'إبقاء الجلسة مفتوحة بعد إغلاق المتصفح',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;
}
