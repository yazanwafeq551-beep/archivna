import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../files/storage/storage.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private authService: AuthService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        institution_name: true,
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
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const { institution, ...rest } = dto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(rest.full_name && { full_name: rest.full_name }),
        ...(rest.phone !== undefined && { phone: rest.phone }),
        ...(institution !== undefined && {
          institution_name: institution,
        }),
        ...(rest.bio !== undefined && { bio: rest.bio }),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        institution_name: true,
        avatar_path: true,
        bio: true,
        preferred_language: true,
        theme: true,
        text_size: true,
        reduced_motion: true,
        account_status: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.authService.changePassword(userId, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('يجب أن يكون الصورة بصيغة JPEG أو PNG أو GIF أو WebP');
    }

    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || '20971520', 10);
    if (file.size > maxSize) {
      throw new BadRequestException('حجم الصورة يتجاوز الحد الأقصى');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.avatar_path) {
      await this.storageService.delete(user.avatar_path).catch(() => {});
    }

    const uploadResult = await this.storageService.upload(
      file,
      'avatars',
      userId,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar_path: uploadResult.publicId,
        avatar_url: uploadResult.secureUrl,
      },
    });

    return { avatar_path: uploadResult.publicId, avatar_url: uploadResult.secureUrl };
  }
}
