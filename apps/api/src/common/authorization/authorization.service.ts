import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const PLATFORM_ROLES = [
  'researcher',
  'depositor',
  'cataloger',
  'reviewer',
  'institution_admin',
  'system_admin',
  'sovereignty_custodian',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async rolesFor(userId?: string) {
    if (!userId) return [];
    return this.prisma.roleAssignment.findMany({
      where: { user_id: userId, is_active: true },
      select: { role: true, institution_id: true },
    });
  }

  async hasRole(userId: string | undefined, roles: PlatformRole[], institutionId?: string | null) {
    if (!userId) return false;
    const assignments = await this.rolesFor(userId);
    return assignments.some((assignment) =>
      roles.includes(assignment.role as PlatformRole) &&
      (!institutionId || !assignment.institution_id || assignment.institution_id === institutionId),
    );
  }

  async isSystemAdmin(userId?: string) {
    return this.hasRole(userId, ['system_admin']);
  }

  async canManageInstitution(userId: string, institutionId: string) {
    return this.hasRole(userId, ['system_admin', 'institution_admin'], institutionId);
  }

  async canDeposit(userId: string, institutionId?: string | null) {
    return this.hasRole(
      userId,
      ['system_admin', 'institution_admin', 'depositor', 'cataloger'],
      institutionId,
    );
  }

  async canCatalog(userId: string, institutionId?: string | null) {
    return this.hasRole(userId, ['system_admin', 'institution_admin', 'cataloger'], institutionId);
  }

  async canReview(userId: string, institutionId?: string | null) {
    return this.hasRole(userId, ['system_admin', 'institution_admin', 'reviewer'], institutionId);
  }

  async canApprove(userId: string, institutionId?: string | null) {
    return this.hasRole(userId, ['system_admin', 'institution_admin'], institutionId);
  }

  async canAdministerSovereign(userId?: string) {
    return this.hasRole(userId, ['system_admin', 'sovereignty_custodian']);
  }

  async canEditArchive(record: { owner_id: string; institution_id?: string | null }, userId: string) {
    if (record.owner_id === userId) return true;
    return this.canCatalog(userId, record.institution_id);
  }

  async canReadFile(
    record: { id: string; owner_id: string; institution_id?: string | null; status: string; access_level: string },
    userId?: string,
  ) {
    if (userId && record.owner_id === userId) return true;
    if (record.status !== 'published') {
      return userId ? this.canReview(userId, record.institution_id) : false;
    }
    if (record.access_level === 'public') return true;
    if (!userId) return false;
    if (record.access_level === 'sovereign') {
      return this.canAdministerSovereign(userId);
    }
    if (await this.canManageInstitution(userId, record.institution_id || '')) return true;
    const grant = await this.prisma.accessRequest.findFirst({
      where: {
        archive_record_id: record.id,
        requester_id: userId,
        status: 'approved',
        expires_at: { gt: new Date() },
      },
      select: { id: true },
    });
    return Boolean(grant);
  }

  assert(condition: boolean, message = 'ليس لديك الصلاحية اللازمة') {
    if (!condition) throw new ForbiddenException(message);
  }
}
