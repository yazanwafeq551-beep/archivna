import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAccessRequestDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  intended_use?: string;
}
