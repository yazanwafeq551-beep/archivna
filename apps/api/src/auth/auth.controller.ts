import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SessionTokenDto } from './dto/session-token.dto';
import { JwtAuthGuard, Public } from './auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Same-site by default. A deployment that serves the site and the API from
 * different domains has to mark the cookie cross-site, and browsers only
 * accept that over HTTPS.
 */
/**
 * A packaged app runs in a web view, where a third-party SameSite=None cookie
 * is dropped - so it would never hold a session. Those clients say so, and
 * carry the refresh token themselves instead. Browsers keep the cookie: it is
 * unreadable by JavaScript, which device storage is not.
 */
function isTokenBearingClient(req: Request): boolean {
  return req.headers['x-client'] === 'native';
}

function refreshCookiePolicy() {
  const crossSite = process.env.CROSS_SITE_COOKIES === 'true';
  return {
    sameSite: (crossSite ? 'none' : 'strict') as 'none' | 'strict',
    secure: crossSite || process.env.NODE_ENV === 'production',
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * `remember` controls persistence only: without it the cookie is dropped when
   * the browser closes, with it the session survives for a week.
   */
  private setRefreshCookie(res: Response, token: string, remember = true) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      ...refreshCookiePolicy(),
      ...(remember ? { maxAge: REFRESH_COOKIE_MAX_AGE } : {}),
    });
  }

  /**
   * One token, one place. Setting the cookie *and* returning the token would
   * leave two live copies of a value that is rotated on every use, turning
   * every refresh into a race resolved by the replacement grace window.
   */
  private issueSession(
    req: Request,
    res: Response,
    result: { user: unknown; accessToken: string; refreshToken: string },
    remember = true,
  ) {
    if (isTokenBearingClient(req)) {
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    }

    this.setRefreshCookie(res, result.refreshToken, remember);
    return { user: result.user, accessToken: result.accessToken };
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      ...refreshCookiePolicy(),
    });
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'تسجيل مستخدم جديد' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    return this.issueSession(req, res, result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    return this.issueSession(req, res, result, dto.remember_me !== false);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديث رمز الوصول' })
  async refresh(
    @Body() dto: SessionTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto?.refresh_token || req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('رمز التحديث غير موجود');
    }

    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
    }

    try {
      const result = await this.authService.rotateRefreshToken(refreshToken);
      return this.issueSession(req, res, result);
    } catch (error) {
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الخروج' })
  async logout(
    @Body() dto: SessionTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Without this a client that holds its own token could not revoke it, and
    // signing out would leave a live refresh token on the device for a week.
    const refreshToken = dto?.refresh_token || req.cookies?.[REFRESH_COOKIE];

    const result = await this.authService.logout(refreshToken);

    this.clearRefreshCookie(res);

    return result;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'طلب إعادة تعيين كلمة المرور' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إعادة تعيين كلمة المرور' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تغيير كلمة المرور' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }
}
