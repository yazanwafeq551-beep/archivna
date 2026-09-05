import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RespondSupportRequestDto {
  @ApiPropertyOptional({ description: 'رد الفريق على الطلب' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  response?: string;

  @ApiPropertyOptional({ enum: ['new', 'in_review', 'answered', 'closed'] })
  @IsOptional()
  @IsIn(['new', 'in_review', 'answered', 'closed'])
  status?: string;
}
