import {
  Injectable,
  SetMetadata,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptionalAuth) {
      return user || null;
    }

    if (err || !user) {
      throw err || new UnauthorizedException('غير مصرح بالدخول');
    }

    return user;
  }
}
