import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class WorkflowActionDto {
  @IsEnum(['submit', 'start_cataloging', 'request_review', 'approve', 'return_changes', 'publish', 'unpublish'])
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
