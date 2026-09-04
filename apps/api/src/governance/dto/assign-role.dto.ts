import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PLATFORM_ROLES } from '../../common/authorization/authorization.service';

export class AssignRoleDto {
  @IsString()
  user_id: string;

  @IsEnum(PLATFORM_ROLES)
  role: string;

  @IsOptional()
  @IsString()
  institution_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
