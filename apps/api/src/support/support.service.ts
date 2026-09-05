import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { RespondSupportRequestDto } from './dto/respond-support-request.dto';

/** Consultations, notes and complaints all land in the same queue. */
@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private authorization: AuthorizationService,
    private notifications: NotificationsService,
  ) {}

  private readonly requesterSelect = {
    id: true,
    full_name: true,
    email: true,
    institution_name: true,
  };

  async create(userId: string, dto: CreateSupportRequestDto) {
    return this.prisma.supportRequest.create({
      data: {
        kind: dto.kind,
        topic: dto.topic,
        subject: dto.subject,
        message: dto.message,
        contact_email: dto.contact_email,
        user_id: userId,
      },
    });
  }

  async mine(userId: string, kind?: string) {
    return this.prisma.supportRequest.findMany({
      where: { user_id: userId, ...(kind ? { kind } : {}) },
      orderBy: { created_at: 'desc' },
      include: { responder: { select: { id: true, full_name: true } } },
    });
  }

  /** The staff inbox. */
  async findAll(userId: string, filters: { kind?: string; status?: string }) {
    await this.assertStaff(userId);

    return this.prisma.supportRequest.findMany({
      where: {
        ...(filters.kind ? { kind: filters.kind } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
      include: {
        user: { select: this.requesterSelect },
        responder: { select: { id: true, full_name: true } },
      },
      take: 200,
    });
  }

  async counts(userId: string) {
    await this.assertStaff(userId);

    const grouped = await this.prisma.supportRequest.groupBy({
      by: ['kind', 'status'],
      _count: { _all: true },
    });

    return grouped.map((row) => ({
      kind: row.kind,
      status: row.status,
      count: row._count._all,
    }));
  }

  async respond(id: string, userId: string, dto: RespondSupportRequestDto) {
    await this.assertStaff(userId);

    const request = await this.prisma.supportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('الطلب غير موجود');

    const answering = dto.response !== undefined && dto.response !== null;
    const updated = await this.prisma.supportRequest.update({
      where: { id },
      data: {
        ...(answering && {
          response: dto.response,
          responded_by: userId,
          responded_at: new Date(),
        }),
        status: dto.status ?? (answering ? 'answered' : request.status),
      },
      include: { user: { select: this.requesterSelect } },
    });

    if (answering) {
      // The person who wrote in should hear about the reply.
      await this.notifications
        .create({
          userId: updated.user_id,
          type: 'support_response',
          title: 'وصلك رد على طلبك',
          message: updated.subject,
          entityType: 'SupportRequest',
          entityId: updated.id,
        })
        .catch(() => undefined);
    }

    return updated;
  }

  private async assertStaff(userId: string) {
    const allowed = await this.authorization.hasRole(userId, [
      'system_admin',
      'institution_admin',
      'reviewer',
    ]);
    if (!allowed) {
      throw new ForbiddenException('هذه الصفحة مخصصة لفريق المنصة');
    }
  }
}
