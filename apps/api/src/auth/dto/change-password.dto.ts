import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  current_password: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  new_password: string;
}
