import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    let settings = await this.prisma.appSetting.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = await this.prisma.appSetting.create({
        data: { user_id: userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    let settings = await this.prisma.appSetting.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = await this.prisma.appSetting.create({
        data: {
          user_id: userId,
          ...dto,
        },
      });
    } else {
      settings = await this.prisma.appSetting.update({
        where: { user_id: userId },
        data: dto,
      });
    }

    if (dto.language || dto.theme || dto.text_size || dto.reduced_motion !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.language && { preferred_language: dto.language }),
          ...(dto.theme && { theme: dto.theme }),
          ...(dto.text_size && { text_size: dto.text_size }),
          ...(dto.reduced_motion !== undefined && {
            reduced_motion: dto.reduced_motion,
          }),
        },
      });
    }

    return settings;
  }
}
