import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { AuthorizationService } from '../common/authorization/authorization.service';

@Injectable()
export class InstitutionsService {
  constructor(
    private prisma: PrismaService,
    private authorization: AuthorizationService,
  ) {}

  async findAll(q?: string) {
    const where = q
      ? {
          OR: [
            { name_ar: { contains: q, mode: 'insensitive' as const } },
            { name_en: { contains: q, mode: 'insensitive' as const } },
            { city: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.institution.findMany({
      where,
      include: { _count: { select: { archive_records: true, archival_units: true } } },
      orderBy: { name_ar: 'asc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('المؤسسة غير موجودة');
    return inst;
  }

  async create(dto: CreateInstitutionDto, userId: string) {
    this.authorization.assert(await this.authorization.isSystemAdmin(userId), 'إنشاء المؤسسات متاح لمدير النظام فقط');
    const slug = this.slugify(dto.name_ar);

    const existing = await this.prisma.institution.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('مؤسسة بهذا الاسم موجودة بالفعل');
    }

    return this.prisma.institution.create({
      data: {
        ...dto,
        slug,
        created_by: userId,
      },
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100) + '-' + Date.now().toString(36);
  }
}
