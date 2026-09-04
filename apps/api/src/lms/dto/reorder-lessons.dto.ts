import { ArrayMinSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderLessonsDto {
  @ApiProperty({ type: [String], description: 'معرّفات الدروس بالترتيب المطلوب' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  lesson_ids: string[];
}
