import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthorizationService, PlatformRole } from '../common/authorization/authorization.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { DecideAccessRequestDto } from './dto/decide-access-request.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';

export const WORKFLOW_TRANSITIONS: Record<string, Record<string, string>> = {
  draft: { submit: 'processing' },
  processing: { start_cataloging: 'cataloging', return_changes: 'draft' },
  cataloging: { request_review: 'in_review', return_changes: 'draft' },
  in_review: { approve: 'approved', return_changes: 'draft' },
  approved: { publish: 'published', return_changes: 'draft' },
  published: { unpublish: 'draft' },
};

export function workflowTarget(status: string, action: string): string | null {
  return WORKFLOW_TRANSITIONS[status]?.[action] || null;
}

@Injectable()
export class GovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async usersWithRoles(actorId: string, institutionId?: string) {
    const isSystemAdmin = await this.authorization.isSystemAdmin(actorId);
    if (!isSystemAdmin) {
      if (!institutionId || !(await this.authorization.canManageInstitution(actorId, institutionId))) {
        throw new ForbiddenException('لا يمكنك عرض صلاحيات هذه المؤسسة');
      }
    }
    return this.prisma.user.findMany({
      where: isSystemAdmin || !institutionId ? {} : { institution_id: institutionId },
      select: {
        id: true,
        full_name: true,
        email: true,
        institution_id: true,
        account_status: true,
        role_assignments: {
          where: { is_active: true },
          select: { id: true, role: true, institution_id: true, created_at: true },
        },
      },
      orderBy: { full_name: 'asc' },
    });
  }

  async assignRole(dto: AssignRoleDto, actorId: string) {
    const globalRoles = ['system_admin', 'sovereignty_custodian'];
    const isSystemAdmin = await this.authorization.isSystemAdmin(actorId);
    if (globalRoles.includes(dto.role)) {
      this.authorization.assert(isSystemAdmin, 'هذه الأدوار يعيّنها مدير النظام فقط');
    } else if (dto.role !== 'researcher') {
      if (!dto.institution_id) throw new BadRequestException('يجب تحديد المؤسسة لهذا الدور');
      this.authorization.assert(
        isSystemAdmin || await this.authorization.canManageInstitution(actorId, dto.institution_id),
        'لا يمكنك إدارة أدوار هذه المؤسسة',
      );
    } else if (!isSystemAdmin && dto.institution_id) {
      this.authorization.assert(await this.authorization.canManageInstitution(actorId, dto.institution_id));
    }

    const target = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!target) throw new NotFoundException('المستخدم غير موجود');
    if (!isSystemAdmin && dto.institution_id && target.institution_id !== dto.institution_id) {
      throw new ForbiddenException('يمكن لمدير المؤسسة تعيين أدوار لمستخدمي مؤسسته فقط');
    }

    const existing = await this.prisma.roleAssignment.findFirst({
      where: { user_id: dto.user_id, role: dto.role, institution_id: dto.institution_id || null },
    });
    const assignment = existing
      ? await this.prisma.roleAssignment.update({
          where: { id: existing.id },
          data: { is_active: dto.is_active ?? true, assigned_by_id: actorId },
        })
      : await this.prisma.roleAssignment.create({
          data: {
            user_id: dto.user_id,
            role: dto.role,
            institution_id: dto.institution_id,
            assigned_by_id: actorId,
            is_active: dto.is_active ?? true,
          },
        });
    await this.audit.log({ userId: actorId, action: 'role.assigned', entityType: 'RoleAssignment', entityId: assignment.id, metadata: { targetUserId: dto.user_id, role: dto.role, institutionId: dto.institution_id } });
    return assignment;
  }

  async revokeRole(id: string, actorId: string) {
    const assignment = await this.prisma.roleAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('تعيين الدور غير موجود');
    const isSystemAdmin = await this.authorization.isSystemAdmin(actorId);
    if (['system_admin', 'sovereignty_custodian'].includes(assignment.role)) {
      this.authorization.assert(isSystemAdmin, 'هذه الأدوار يديرها مدير النظام فقط');
    } else if (assignment.institution_id) {
      this.authorization.assert(isSystemAdmin || await this.authorization.canManageInstitution(actorId, assignment.institution_id));
    } else {
      this.authorization.assert(isSystemAdmin);
    }
    const result = await this.prisma.roleAssignment.update({ where: { id }, data: { is_active: false } });
    await this.audit.log({ userId: actorId, action: 'role.revoked', entityType: 'RoleAssignment', entityId: id });
    return result;
  }

  async requestAccess(archiveId: string, dto: CreateAccessRequestDto, requesterId: string) {
    const archive = await this.prisma.archiveRecord.findUnique({ where: { id: archiveId } });
    if (!archive || archive.status !== 'published') throw new NotFoundException('السجل الأرشيفي غير موجود');
    if (archive.access_level === 'public') throw new BadRequestException('هذه المادة متاحة للعامة ولا تحتاج طلب وصول');
    const canAlreadyRead = await this.authorization.canReadFile(archive, requesterId);
    if (canAlreadyRead) throw new BadRequestException('لديك وصول فعّال إلى هذه المادة');
    const duplicate = await this.prisma.accessRequest.findFirst({
      where: {
        archive_record_id: archiveId,
        requester_id: requesterId,
        OR: [{ status: 'pending' }, { status: 'approved', expires_at: { gt: new Date() } }],
      },
    });
    if (duplicate) throw new BadRequestException('يوجد طلب نشط لهذه المادة');
    const request = await this.prisma.accessRequest.create({
      data: {
        archive_record_id: archiveId,
        requester_id: requesterId,
        institution_id: archive.institution_id,
        reason: dto.reason,
        intended_use: dto.intended_use,
      },
      include: { archive_record: { select: { title_ar: true, title_en: true, access_level: true } } },
    });
    await this.audit.log({ userId: requesterId, action: 'access.requested', entityType: 'AccessRequest', entityId: request.id, metadata: { archiveId } });
    return request;
  }

  myAccessRequests(userId: string) {
    return this.prisma.accessRequest.findMany({
      where: { requester_id: userId },
      include: { archive_record: { select: { id: true, title_ar: true, title_en: true, access_level: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async reviewQueue(userId: string, status = 'pending') {
    const roles = await this.authorization.rolesFor(userId);
    const system = roles.some((role) => role.role === 'system_admin');
    const sovereign = roles.some((role) => role.role === 'sovereignty_custodian');
    const institutions = roles
      .filter((role) => ['institution_admin', 'reviewer'].includes(role.role) && role.institution_id)
      .map((role) => role.institution_id as string);
    if (!system && !sovereign && institutions.length === 0) throw new ForbiddenException('يتطلب ذلك دور المراجع أو مدير المؤسسة');
    return this.prisma.accessRequest.findMany({
      where: {
        status,
        ...(system ? {} : {
          archive_record: sovereign
            ? { access_level: 'sovereign' }
            : { institution_id: { in: institutions }, access_level: 'sensitive' },
        }),
      },
      include: {
        requester: { select: { id: true, full_name: true, email: true } },
        archive_record: { select: { id: true, title_ar: true, title_en: true, access_level: true, institution_id: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async decideAccess(id: string, dto: DecideAccessRequestDto, actorId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id },
      include: { archive_record: true },
    });
    if (!request) throw new NotFoundException('طلب الوصول غير موجود');
    if (request.status !== 'pending') throw new BadRequestException('تم اتخاذ قرار في هذا الطلب مسبقاً');
    const allowed = request.archive_record.access_level === 'sovereign'
      ? await this.authorization.canAdministerSovereign(actorId)
      : await this.authorization.hasRole(actorId, ['system_admin', 'institution_admin', 'reviewer'], request.institution_id);
    this.authorization.assert(allowed, 'لا يمكنك اتخاذ قرار في هذا الطلب');
    const policy = await this.prisma.accessPolicy.findUnique({ where: { archive_record_id: request.archive_record_id } });
    const hours = dto.grant_hours || policy?.default_grant_hours || 72;
    const now = new Date();
    const result = await this.prisma.accessRequest.update({
      where: { id },
      data: {
        status: dto.decision,
        decision_note: dto.note,
        decided_by_id: actorId,
        decided_at: now,
        expires_at: dto.decision === 'approved' ? new Date(now.getTime() + hours * 60 * 60 * 1000) : null,
      },
    });
    await this.prisma.notification.create({
      data: {
        user_id: request.requester_id,
        type: `access_${dto.decision}`,
        title: dto.decision === 'approved' ? 'تمت الموافقة على طلب الوصول' : 'تم رفض طلب الوصول',
        message: dto.note || (dto.decision === 'approved' ? `الوصول متاح لمدة ${hours} ساعة` : 'يمكنك تقديم طلب جديد بمعلومات إضافية'),
        entity_type: 'AccessRequest',
        entity_id: id,
      },
    });
    await this.audit.log({ userId: actorId, action: `access.${dto.decision}`, entityType: 'AccessRequest', entityId: id, metadata: { archiveId: request.archive_record_id, grantHours: dto.decision === 'approved' ? hours : undefined } });
    return result;
  }

  async workflowQueue(userId: string, status?: string) {
    const roles = await this.authorization.rolesFor(userId);
    const system = roles.some((role) => role.role === 'system_admin');
    const institutions = roles.filter((role) => role.institution_id).map((role) => role.institution_id as string);
    if (!system && institutions.length === 0) throw new ForbiddenException('لا توجد مؤسسة مرتبطة بصلاحياتك');
    return this.prisma.archiveRecord.findMany({
      where: { ...(status ? { status } : { status: { in: ['processing', 'cataloging', 'in_review', 'approved'] } }), ...(system ? {} : { institution_id: { in: institutions } }) },
      include: { owner: { select: { id: true, full_name: true } }, institution: { select: { id: true, name_ar: true, name_en: true } }, archival_unit: true, _count: { select: { files: true } } },
      orderBy: { updated_at: 'asc' },
    });
  }

  async transition(archiveId: string, dto: WorkflowActionDto, actorId: string) {
    const record = await this.prisma.archiveRecord.findUnique({ where: { id: archiveId } });
    if (!record) throw new NotFoundException('السجل الأرشيفي غير موجود');
    const rule = this.transitionRule(record.status, dto.action);
    if (!rule) throw new BadRequestException('هذا الانتقال غير مسموح من الحالة الحالية');
    const owner = record.owner_id === actorId;
    let allowed = false;
    if (dto.action === 'submit') allowed = owner || await this.authorization.canDeposit(actorId, record.institution_id);
    if (['start_cataloging', 'request_review'].includes(dto.action)) allowed = await this.authorization.canCatalog(actorId, record.institution_id);
    if (['approve', 'return_changes'].includes(dto.action)) allowed = await this.authorization.canReview(actorId, record.institution_id);
    if (['publish', 'unpublish'].includes(dto.action)) allowed = await this.authorization.canApprove(actorId, record.institution_id);
    this.authorization.assert(allowed, 'لا تملك الدور المطلوب لهذا الانتقال');

    const now = new Date();
    const timestamps: Record<string, unknown> = {};
    if (rule.to === 'processing') timestamps.submitted_at = now;
    if (rule.to === 'in_review') timestamps.reviewed_at = now;
    if (rule.to === 'approved') Object.assign(timestamps, { approved_at: now, approved_by: actorId });
    if (rule.to === 'published') timestamps.published_at = now;
    if (rule.to === 'draft') Object.assign(timestamps, { submitted_at: null, reviewed_at: null, reviewed_by: null, approved_at: null, approved_by: null, published_at: null });

    const updated = await this.prisma.$transaction(async (tx) => {
      const archive = await tx.archiveRecord.update({ where: { id: archiveId }, data: { status: rule.to, ...timestamps } });
      await tx.archiveWorkflowEvent.create({ data: { archive_record_id: archiveId, actor_id: actorId, from_status: record.status, to_status: rule.to, note: dto.note } });
      return archive;
    });
    await this.audit.log({ userId: actorId, action: `archive.workflow.${dto.action}`, entityType: 'ArchiveRecord', entityId: archiveId, metadata: { from: record.status, to: rule.to } });
    return updated;
  }

  private transitionRule(status: string, action: string): { to: string } | null {
    const to = workflowTarget(status, action);
    return to ? { to } : null;
  }
}
