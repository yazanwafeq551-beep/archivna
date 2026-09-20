import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Carries a refresh token in the request body, for clients that cannot hold a
 * cookie. A browser sends neither field and keeps using the httpOnly cookie.
 *
 * snake_case because CamelToSnakePipe rewrites incoming keys before validation
 * and ValidationPipe({ whitelist: true }) drops whatever the DTO does not
 * declare - a camelCase field here would be silently discarded.
 */
export class SessionTokenDto {
  @ApiPropertyOptional({
    description: 'رمز التحديث، للعملاء الذين لا يحتفظون بالكوكيز',
  })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
