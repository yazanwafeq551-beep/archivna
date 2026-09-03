import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = { status: 'published' };

    const [articles, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        include: {
          category: {
            select: { id: true, name_ar: true, name_en: true, slug: true },
          },
        },
        orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findLatest(limit: number) {
    return this.prisma.newsArticle.findMany({
      where: { status: 'published' },
      include: {
        category: {
          select: { id: true, name_ar: true, name_en: true, slug: true },
        },
      },
      orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }],
      take: limit,
    });
  }

  async findCategories() {
    return this.prisma.newsCategory.findMany({
      include: {
        _count: {
          select: { articles: { where: { status: 'published' } } },
        },
      },
      orderBy: { name_ar: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name_ar: true, name_en: true, slug: true },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('المقال غير موجود');
    }

    return article;
  }
}
