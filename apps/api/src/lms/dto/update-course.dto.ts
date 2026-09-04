import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

/** Everything on a course can be edited; lessons have their own endpoints. */
export class UpdateCourseDto extends PartialType(
  OmitType(CreateCourseDto, ['lessons'] as const),
) {}
