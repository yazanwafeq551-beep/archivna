import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { user_id: userId },
      }),
      this.prisma.notification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unread_count: unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    if (notification.user_id !== userId) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    return { message: 'تم تحديد جميع الإشعارات كمقروءة' };
  }

  async create(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entity_type: params.entityType,
        entity_id: params.entityId,
      },
    });
  }
}
