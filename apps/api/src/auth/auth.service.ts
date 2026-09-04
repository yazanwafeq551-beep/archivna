import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
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

    const userResult = await this.getMe(user.id);

    return {
      user: userResult,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(userId: string, oldRefreshTokenId: string) {
    await this.prisma.refreshToken.update({
      where: { id: oldRefreshTokenId },
      data: { is_revoked: true },
    });

    const user = await this.getMe(userId);

    if (!user || user.id !== userId) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshTokenId: string) {
    if (refreshTokenId) {
      await this.prisma.refreshToken.updateMany({
        where: { id: refreshTokenId },
        data: { is_revoked: true },
      });
    }
    return { message: 'تم تسجيل الخروج بنجاح' };
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

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>(
        'ACCESS_TOKEN_EXPIRATION',
        '15m',
      ),
    });

    const jti = (
      await import('uuid')
    ).v4();
    const refreshTokenPayload = { sub: userId, jti };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'REFRESH_TOKEN_EXPIRATION',
        '7d',
      ),
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const decoded = this.jwtService.decode(refreshToken) as any;
    const expiresAt = new Date(decoded.exp * 1000);

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findFirst({
      where: { token, is_revoked: false },
    });
  }
}
