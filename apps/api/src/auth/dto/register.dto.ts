import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'أحمد محمد' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: '+970-59-123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution_id?: string;

  @ApiPropertyOptional({ enum: ['individual', 'institution_representative'] })
  @IsOptional()
  @IsIn(['individual', 'institution_representative'])
  account_type?: string;
}
