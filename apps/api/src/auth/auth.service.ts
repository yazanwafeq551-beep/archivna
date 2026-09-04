import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  /** How long a just-rotated refresh token still answers concurrent callers. */
  private static readonly REFRESH_GRACE_MS = 60_000;
  private static readonly MAX_ROTATION_HOPS = 5;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('البريد الإلكتروني مسجل بالفعل');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        full_name: dto.full_name,
        email: dto.email,
        password_hash: hashedPassword,
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.institution_name && { institution_name: dto.institution_name }),
        ...(dto.institution_id && { institution_id: dto.institution_id }),
        ...(dto.account_type && { account_type: dto.account_type }),
        app_settings: {
          create: {},
        },
        role_assignments: {
          create: { role: 'researcher' },
        },
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        institution_name: true,
        institution_id: true,
        account_type: true,
        avatar_path: true,
        avatar_url: true,
        bio: true,
        created_at: true,
      },
    });

    const userWithRoles = await this.getMe(user.id);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: userWithRoles,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    if (user.account_status !== 'active') {
      throw new UnauthorizedException('الحساب غير نشط');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    this.purgeExpiredTokens(user.id);

    const userResult = await this.getMe(user.id);

    return {
      user: userResult,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Rotates a refresh token.
   *
   * Rotation is racy by nature: a page load, a couple of parallel requests that
   * hit an expired access token, or a second browser tab all present the same
   * cookie at once. Only one caller may rotate it, so the losers are answered
   * with the replacement token instead of being logged out.
   */
  async rotateRefreshToken(presentedToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: presentedToken },
    });

    if (!stored) {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    if (stored.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedException('انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد');
    }

    if (stored.is_revoked) {
      const replacement = await this.resolveReplacement(stored.id);
      if (replacement) {
        return this.issueFromExistingRefreshToken(stored.user_id, replacement.token);
      }

      // The token was revoked long ago but is being presented again. Either it
      // leaked or the session was closed - drop every session for that user.
      await this.revokeAllUserTokens(stored.user_id);
      throw new UnauthorizedException('انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد');
    }

    // Claim the rotation. Exactly one concurrent caller gets count === 1.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, is_revoked: false },
      data: { is_revoked: true, revoked_at: new Date() },
    });

    if (claimed.count === 0) {
      const replacement = await this.resolveReplacement(stored.id);
      if (!replacement) {
        throw new UnauthorizedException('انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد');
      }
      return this.issueFromExistingRefreshToken(stored.user_id, replacement.token);
    }

    const user = await this.getMe(stored.user_id);
    this.assertActiveAccount(user.account_status);

    const tokens = await this.generateTokens(user.id, user.email);
    const created = await this.storeRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replaced_by_id: created.id },
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(presentedToken?: string) {
    if (presentedToken) {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: presentedToken },
        select: { id: true, user_id: true },
      });

      if (stored) {
        // Revoke the whole rotation chain so a token issued moments earlier in
        // another tab cannot keep the session alive.
        await this.revokeChain(stored.id);
      }
    }

    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * Follows the rotation chain of a revoked token and returns the live token it
   * was replaced with, as long as the rotation happened inside the grace window.
   */
  private async resolveReplacement(tokenId: string) {
    let currentId: string | null = tokenId;

    for (let hop = 0; hop < AuthService.MAX_ROTATION_HOPS; hop += 1) {
      const current = await this.waitForReplacement(currentId);
      if (!current?.replaced_by_id) return null;

      const revokedAt = current.revoked_at?.getTime() ?? 0;
      if (Date.now() - revokedAt > AuthService.REFRESH_GRACE_MS) return null;

      const next = await this.prisma.refreshToken.findUnique({
        where: { id: current.replaced_by_id },
      });
      if (!next) return null;
      if (next.expires_at.getTime() <= Date.now()) return null;
      if (!next.is_revoked) return next;

      currentId = next.id;
    }

    return null;
  }

  /**
   * The winner of a rotation race writes `replaced_by_id` a moment after it
   * flips `is_revoked`, so a loser that arrives in between polls briefly.
   */
  private async waitForReplacement(tokenId: string) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const token = await this.prisma.refreshToken.findUnique({
        where: { id: tokenId },
      });
      if (!token) return null;
      if (token.replaced_by_id) return token;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }

  private async issueFromExistingRefreshToken(userId: string, refreshToken: string) {
    const user = await this.getMe(userId);
    this.assertActiveAccount(user.account_status);

    const accessToken = this.signAccessToken(user.id, user.email);

    return { user, accessToken, refreshToken };
  }

  private async revokeChain(tokenId: string) {
    let currentId: string | null = tokenId;

    for (let hop = 0; hop < AuthService.MAX_ROTATION_HOPS; hop += 1) {
      const current = await this.prisma.refreshToken.findUnique({
        where: { id: currentId },
        select: { id: true, replaced_by_id: true },
      });
      if (!current) return;

      await this.prisma.refreshToken.updateMany({
        where: { id: current.id, is_revoked: false },
        data: { is_revoked: true, revoked_at: new Date() },
      });

      if (!current.replaced_by_id) return;
      currentId = current.replaced_by_id;
    }
  }

  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, is_revoked: false },
      data: { is_revoked: true, revoked_at: new Date() },
    });
  }

  private assertActiveAccount(status: string) {
    if (status !== 'active') {
      throw new UnauthorizedException('الحساب غير نشط');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        institution_name: true,
        institution_id: true,
        account_type: true,
        avatar_path: true,
        avatar_url: true,
        bio: true,
        preferred_language: true,
        theme: true,
        text_size: true,
        reduced_motion: true,
        account_status: true,
        created_at: true,
        updated_at: true,
        last_login_at: true,
        role_assignments: {
          where: { is_active: true },
          select: { id: true, role: true, institution_id: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    const token = randomBytes(32).toString('hex');
    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: this.hashToken(token),
          password_reset_expires_at: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    }

    const result: { message: string; reset_token?: string } = {
      message:
        'إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة إعادة تعيين كلمة المرور',
    };

    if (process.env.NODE_ENV !== 'production') {
      result.reset_token = token;
    }

    return result;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        password_reset_token: this.hashToken(token),
        password_reset_expires_at: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { user_id: user.id },
      data: { is_revoked: true },
    });

    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.current_password,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    const hashedNewPassword = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedNewPassword },
    });

    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { is_revoked: true },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  private signAccessToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'ACCESS_TOKEN_EXPIRATION',
          '15m',
        ),
      },
    );
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = this.signAccessToken(userId, email);

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: randomUUID() },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'REFRESH_TOKEN_EXPIRATION',
          '7d',
        ),
      },
    );

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const decoded = this.jwtService.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    return this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });
  }

  /** Housekeeping so the table does not grow forever - failures are not fatal. */
  private purgeExpiredTokens(userId: string) {
    this.prisma.refreshToken
      .deleteMany({
        where: { user_id: userId, expires_at: { lt: new Date() } },
      })
      .catch(() => undefined);
  }
}
