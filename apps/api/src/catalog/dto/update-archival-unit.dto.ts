import { PartialType } from '@nestjs/swagger';
import { CreateArchivalUnitDto } from './create-archival-unit.dto';

export class UpdateArchivalUnitDto extends PartialType(CreateArchivalUnitDto) {}
