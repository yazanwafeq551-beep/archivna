import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: any) => {
        if (req?.cookies?.refresh_token) {
          return req.cookies.refresh_token;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: { sub: string; jti: string }) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });

    if (!refreshToken || refreshToken.is_revoked) {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    if (new Date() > refreshToken.expires_at) {
      throw new UnauthorizedException('رمز التحديث منتهي الصلاحية');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    return { user, refreshToken };
  }
}
