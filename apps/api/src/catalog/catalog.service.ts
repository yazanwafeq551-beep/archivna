import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { CreateArchivalUnitDto } from './dto/create-archival-unit.dto';
import { UpdateArchivalUnitDto } from './dto/update-archival-unit.dto';
import { CreateAgentDto, CreateControlledTermDto, LinkAgentDto, LinkTermDto } from './dto/authority.dto';
import { ROOT_LEVEL, levelDepth, parentLevelOf } from './archival-levels';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async hierarchy(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true, name_ar: true, name_en: true, slug: true },
    });
    if (!institution) throw new NotFoundException('المؤسسة غير موجودة');

    const units = await this.prisma.archivalUnit.findMany({
      where: { institution_id: institutionId },
      include: { _count: { select: { records: true, children: true } } },
      orderBy: [{ sort_order: 'asc' }, { title_ar: 'asc' }],
    });
    const children = new Map<string | null, any[]>();
    for (const unit of units) {
      const key = unit.parent_id || null;
      children.set(key, [...(children.get(key) || []), unit]);
    }
    const build = (parentId: string | null): any[] =>
      (children.get(parentId) || []).map((unit) => ({
        ...unit,
        children: build(unit.id),
      }));
    return { institution, units: build(null) };
  }

  async create(dto: CreateArchivalUnitDto, userId: string) {
    this.authorization.assert(
      await this.authorization.canCatalog(userId, dto.institution_id),
      'يتطلب إنشاء الوحدات دور المفهرس أو مدير المؤسسة',
    );
    await this.validateParent(dto.institution_id, dto.parent_id, dto.level);
    return this.prisma.archivalUnit.create({
      data: { ...dto, created_by: userId },
    });
  }

  async update(id: string, dto: UpdateArchivalUnitDto, userId: string) {
    const unit = await this.prisma.archivalUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('الوحدة الأرشيفية غير موجودة');
    const institutionId = dto.institution_id || unit.institution_id;
    this.authorization.assert(
      await this.authorization.canCatalog(userId, institutionId),
      'يتطلب تعديل الوحدات دور المفهرس أو مدير المؤسسة',
    );
    await this.validateParent(institutionId, dto.parent_id ?? unit.parent_id, dto.level || unit.level, id);
    return this.prisma.archivalUnit.update({ where: { id }, data: dto });
  }

  async path(id: string) {
    const unit = await this.prisma.archivalUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('الوحدة الأرشيفية غير موجودة');
    const path: any[] = [];
    let current: any = unit;
    while (current) {
      path.unshift(current);
      current = current.parent_id
        ? await this.prisma.archivalUnit.findUnique({ where: { id: current.parent_id } })
        : null;
    }
    return path;
  }

  async exportMetadata(recordId: string, format: 'dc' | 'ric' | 'ead', userId?: string) {
    const record = await this.prisma.archiveRecord.findUnique({
      where: { id: recordId },
      include: { institution: true, archival_unit: true, subjects: true, files: true, agents: { include: { agent: true } }, controlled_terms: { include: { term: true } } },
    });
    if (!record || record.status !== 'published') throw new NotFoundException('السجل الأرشيفي غير موجود');
    if (record.access_level === 'sovereign' && !(await this.authorization.canAdministerSovereign(userId))) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    const common = {
      identifier: record.reference_number || record.id,
      title: { ar: record.title_ar, en: record.title_en },
      description: { ar: record.description_ar, en: record.description_en },
      date: record.date_text,
      language: record.language,
      rights: record.rights_statement,
      institution: record.institution?.name_en || record.institution?.name_ar || record.institution_name,
      subjects: record.subjects.map((item) => item.subject),
      digitalObjects: record.files.map((file) => ({ mimeType: file.mime_type, checksum: file.checksum })),
      agents: record.agents.map((link) => ({ role: link.role, name: link.agent.name_en || link.agent.name_ar, type: link.agent.agent_type })),
      controlledTerms: record.controlled_terms.map((link) => ({ scheme: link.term.scheme, label: link.term.label_en || link.term.label_ar, code: link.term.code })),
    };
    if (format === 'dc') return { standard: 'Dublin Core', ...common, type: record.material_type, coverage: record.place };
    if (format === 'ric') return { standard: 'RiC 1.0 compatible', recordResource: common, level: 'item', isOrWasIncludedIn: record.archival_unit?.reference_code };
    return { standard: 'EAD 2002 compatible', unitid: common.identifier, unittitle: common.title, unitdate: common.date, repository: common.institution, scopecontent: common.description };
  }

  agents(q?: string) {
    return this.prisma.agent.findMany({
      where: q ? { OR: [{ name_ar: { contains: q, mode: 'insensitive' } }, { name_en: { contains: q, mode: 'insensitive' } }] } : {},
      orderBy: { name_ar: 'asc' },
      take: 100,
    });
  }

  terms(scheme?: string, q?: string) {
    return this.prisma.controlledTerm.findMany({
      where: {
        ...(scheme ? { scheme } : {}),
        ...(q ? { OR: [{ label_ar: { contains: q, mode: 'insensitive' } }, { label_en: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { label_ar: 'asc' },
      take: 200,
    });
  }

  async createAgent(dto: CreateAgentDto, userId: string) {
    this.authorization.assert(await this.authorization.hasRole(userId, ['system_admin', 'institution_admin', 'cataloger']), 'إنشاء ملفات الاستناد متاح للمفهرسين');
    return this.prisma.agent.create({ data: dto });
  }

  async createTerm(dto: CreateControlledTermDto, userId: string) {
    this.authorization.assert(await this.authorization.hasRole(userId, ['system_admin', 'institution_admin', 'cataloger']), 'إنشاء المصطلحات متاح للمفهرسين');
    return this.prisma.controlledTerm.create({ data: dto });
  }

  async linkAgent(recordId: string, dto: LinkAgentDto, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('السجل الأرشيفي غير موجود');
    this.authorization.assert(await this.authorization.canCatalog(userId, record.institution_id), 'ربط الجهات متاح للمفهرسين');
    return this.prisma.archiveAgent.upsert({
      where: { archive_record_id_agent_id_role: { archive_record_id: recordId, agent_id: dto.agent_id, role: dto.role } },
      create: { archive_record_id: recordId, agent_id: dto.agent_id, role: dto.role },
      update: {},
    });
  }

  async linkTerm(recordId: string, dto: LinkTermDto, userId: string) {
    const record = await this.prisma.archiveRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('السجل الأرشيفي غير موجود');
    this.authorization.assert(await this.authorization.canCatalog(userId, record.institution_id), 'ربط المصطلحات متاح للمفهرسين');
    return this.prisma.archiveRecordTerm.upsert({
      where: { archive_record_id_term_id: { archive_record_id: recordId, term_id: dto.term_id } },
      create: { archive_record_id: recordId, term_id: dto.term_id },
      update: {},
    });
  }

  private async validateParent(institutionId: string, parentId: string | undefined | null, level: string, currentId?: string) {
    const expectedParent = parentLevelOf(level);
    if (!parentId) {
      if (expectedParent) throw new BadRequestException('اختر الوحدة الأب لهذا المستوى');
      return;
    }
    if (!expectedParent) throw new BadRequestException(`${ROOT_LEVEL} لا يكون تابعاً لوحدة أخرى`);
    if (parentId === currentId) throw new BadRequestException('لا يمكن جعل الوحدة أباً لنفسها');
    const parent = await this.prisma.archivalUnit.findUnique({ where: { id: parentId } });
    if (!parent || parent.institution_id !== institutionId) throw new BadRequestException('الوحدة الأب غير صالحة لهذه المؤسسة');
    // Exactly one step, not merely deeper: a file belongs to a sub-series, not
    // straight to a fonds.
    if (levelDepth(level) !== levelDepth(parent.level) + 1) {
      throw new BadRequestException('ترتيب المستوى الأرشيفي غير صحيح');
    }
  }
}
