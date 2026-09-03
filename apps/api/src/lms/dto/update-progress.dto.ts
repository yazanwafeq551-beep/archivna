import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  watched_seconds: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  watch_percentage: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  last_position: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  total_watch_time: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  course_progress?: number;
}
