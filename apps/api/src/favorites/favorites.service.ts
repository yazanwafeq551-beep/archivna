import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        user_id: userId,
        archive_record: {
          OR: [
            { status: 'published', access_level: 'public' },
            { owner_id: userId },
          ],
        },
      },
      include: {
        archive_record: {
          include: {
            owner: {
              select: { id: true, full_name: true, avatar_path: true },
            },
            subjects: true,
            _count: { select: { files: true, favorites: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      created_at: fav.created_at,
      archive_record: fav.archive_record,
    }));
  }

  async add(userId: string, archiveRecordId: string) {
    const archive = await this.prisma.archiveRecord.findUnique({
      where: { id: archiveRecordId },
    });

    if (!archive) {
      throw new NotFoundException('السجل الأرشيفي غير موجود');
    }

    if (archive.status !== 'published' || archive.access_level !== 'public') {
      if (archive.owner_id !== userId) {
        throw new NotFoundException('السجل الأرشيفي غير موجود');
      }
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        user_id_archive_record_id: {
          user_id: userId,
          archive_record_id: archiveRecordId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('تمت إضافة هذا السجل إلى المفضلة بالفعل');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        user_id: userId,
        archive_record_id: archiveRecordId,
      },
      include: {
        archive_record: {
          select: {
            id: true,
            title_ar: true,
            title_en: true,
            reference_number: true,
            material_type: true,
          },
        },
      },
    });

    return favorite;
  }

  async remove(userId: string, archiveRecordId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        user_id_archive_record_id: {
          user_id: userId,
          archive_record_id: archiveRecordId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('هذا السجل غير موجود في المفضلة');
    }

    await this.prisma.favorite.delete({
      where: {
        user_id_archive_record_id: {
          user_id: userId,
          archive_record_id: archiveRecordId,
        },
      },
    });

    return { message: 'تمت إزالة السجل من المفضلة بنجاح' };
  }
}
