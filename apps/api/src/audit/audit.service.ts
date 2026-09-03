import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        metadata: params.metadata || undefined,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      },
    });
  }

  async findAll(params: {
    userId?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.userId) where.user_id = params.userId;
    if (params.action) where.action = params.action;
    if (params.entityType) where.entity_type = params.entityType;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
