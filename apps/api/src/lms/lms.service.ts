import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCourseDto } from './dto/query-course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { LessonInputDto, UpdateLessonDto } from './dto/lesson.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { StorageService } from '../files/storage/storage.service';

@Injectable()
export class LmsService {
  private readonly logger = new Logger(LmsService.name);
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // === Course Categories ===
  async findAllCategories() {
    return this.prisma.courseCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
  }

  // === Courses ===
  async findAllCourses(query: QueryCourseDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = { status: 'published', visibility: 'public' };
    const andClauses: Prisma.CourseWhereInput[] = [];

    if (query.q) {
      andClauses.push({
        OR: [
          { titleAr: { contains: query.q, mode: 'insensitive' } },
          { titleEn: { contains: query.q, mode: 'insensitive' } },
          { shortDescAr: { contains: query.q, mode: 'insensitive' } },
          { shortDescEn: { contains: query.q, mode: 'insensitive' } },
          { instructorName: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }

    if (query.category) {
      andClauses.push({ category: { slug: query.category } });
    }

    if (query.difficulty) {
      andClauses.push({ difficulty: query.difficulty });
    }

    if (query.instructor) {
      andClauses.push({ instructorName: { contains: query.instructor, mode: 'insensitive' } });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: 'desc' };
    switch (query.sort) {
      case 'popular':
        orderBy = { enrollments: { _count: 'desc' } };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const includes = {
      category: true,
      tags: { include: { tag: true } },
      _count: { select: { lessons: true, enrollments: true, reviews: true } },
      reviews: { take: 1, orderBy: { createdAt: 'desc' as const }, select: { rating: true } },
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({ where, include: includes, orderBy, skip, take: limit }),
      this.prisma.course.count({ where }),
    ]);

    const data = courses.map((course) => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;
      const { reviews, ...rest } = course as any;
      return { ...rest, avgRating: Math.round(avgRating * 10) / 10 };
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findCourseBySlug(slug: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
        lessons: { where: { status: 'published' }, orderBy: { lessonNumber: 'asc' } },
        _count: { select: { lessons: true, enrollments: true, reviews: true } },
        reviews: { include: { user: { select: { id: true, full_name: true, avatar_url: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!course || course.status !== 'published') {
      throw new NotFoundException('Course not found');
    }

    let enrollment = null;
    let userProgress = null;

    if (userId) {
      enrollment = await this.prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });

      userProgress = await this.prisma.lessonProgress.findMany({
        where: { userId, courseId: course.id },
      });
    }

    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : 0;

    const lessons = course.lessons.map((lesson) => ({
      ...lesson,
      userProgress: userProgress?.find((p) => p.lessonId === lesson.id) ?? null,
    }));

    return {
      ...course,
      lessons,
      avgRating: Math.round(avgRating * 10) / 10,
      enrollment,
      userProgress,
    };
  }

  // === Enrollment ===
  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    return this.prisma.courseEnrollment.create({
      data: { userId, courseId },
    });
  }

  async getUserEnrollments(userId: string) {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { lastActivityAt: { sort: 'desc', nulls: 'last' } },
    });

    const uncompleted = enrollments.filter((e) => !e.isCompleted);
    const completed = enrollments.filter((e) => e.isCompleted);

    let totalWatchTime = 0;
    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId },
      select: { totalWatchTime: true },
    });
    progress.forEach((p) => { totalWatchTime += p.totalWatchTime; });

    return { enrollments, uncompleted, completed, totalLearningHours: Math.round(totalWatchTime / 3600) };
  }

  // === Lesson Progress ===
  async getLesson(lessonId: string, courseId: string, userId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { attachments: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    let progress = null;
    if (userId) {
      progress = await this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
    }

    return { ...lesson, userProgress: progress };
  }

  async updateProgress(userId: string, lessonId: string, courseId: string, dto: UpdateProgressDto) {
    const [lesson, enrollment, existingProgress] = await Promise.all([
      this.prisma.lesson.findUnique({ where: { id: lessonId } }),
      this.prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
      this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      }),
    ]);
    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled to track lesson progress');
    }
    if (lesson.lessonNumber > enrollment.currentLessonNumber) {
      throw new ForbiddenException('Complete the previous lesson to unlock this lesson');
    }

    const watchedSeconds = Math.max(existingProgress?.watchedSeconds ?? 0, dto.watched_seconds);
    const watchPercentage = Math.max(existingProgress?.watchPercentage ?? 0, dto.watch_percentage);
    const totalWatchTime = Math.max(existingProgress?.totalWatchTime ?? 0, dto.total_watch_time);
    const maxPosition = lesson.videoDuration ? lesson.videoDuration : Number.MAX_SAFE_INTEGER;
    const lastPosition = Math.min(Math.max(0, dto.last_position), maxPosition);
    const isCompleted = Boolean(existingProgress?.isCompleted) || watchPercentage >= (lesson.completionThreshold * 100);

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        courseId,
        lessonId,
        watchedSeconds,
        watchPercentage,
        lastPosition,
        totalWatchTime,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        watchedSeconds,
        watchPercentage,
        lastPosition,
        totalWatchTime,
        isCompleted,
        ...(isCompleted && !existingProgress?.completedAt ? { completedAt: new Date() } : {}),
      },
    });

    if (isCompleted) {
      await this.updateCourseProgress(userId, courseId);
      await this.checkAchievements(userId);
    }

    return progress;
  }


  /**
   * Marks a lesson finished without a video to watch. Reading lessons had no
   * way to complete at all, which left the course - and its certificate -
   * permanently stuck.
   */
  async completeLesson(userId: string, courseId: string, lessonId: string) {
    const [lesson, enrollment] = await Promise.all([
      this.prisma.lesson.findUnique({ where: { id: lessonId } }),
      this.prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
    ]);

    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('الدرس غير موجود');
    }
    if (!enrollment) {
      throw new ForbiddenException('يجب التسجيل في الدورة أولاً');
    }
    if (lesson.lessonNumber > enrollment.currentLessonNumber) {
      throw new ForbiddenException('أكمل الدرس السابق أولاً');
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        courseId,
        lessonId,
        watchPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: {
        watchPercentage: 100,
        isCompleted: true,
        ...(existing?.completedAt ? {} : { completedAt: new Date() }),
      },
    });

    await this.updateCourseProgress(userId, courseId);
    await this.checkAchievements(userId);

    return progress;
  }
  private async updateCourseProgress(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: { where: { status: 'published' }, select: { id: true } } },
    });
    if (!course) return;

    const totalLessons = course.lessons.length;
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { userId, courseId, isCompleted: true },
    });

    const courseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isCompleted = courseProgress >= 100;

    const lastLesson = await this.prisma.lessonProgress.findFirst({
      where: { userId, courseId, isCompleted: true },
      orderBy: { updatedAt: 'desc' },
      include: { lesson: true },
    });

    await this.prisma.courseEnrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        courseProgress,
        lessonsCompleted: completedLessons,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastActivityAt: new Date(),
        currentLessonNumber: lastLesson
          ? Math.min(lastLesson.lesson.lessonNumber + 1, totalLessons)
          : 1,
      },
    });

    if (isCompleted) {
      await this.checkAchievements(userId);
      // Finishing the last lesson is what earns the certificate.
      await this.issueCertificate(userId, courseId);
    }
  }

  async getLessonProgress(userId: string, courseId: string) {
    return this.prisma.lessonProgress.findMany({
      where: { userId, courseId },
      include: { lesson: { select: { id: true, lessonNumber: true, titleAr: true, titleEn: true, slug: true } } },
    });
  }

  // === Dashboard ===
  async getUserDashboard(userId: string) {
    const [enrollments, completedCount, progress, savedCourses, achievements, recentActivity] =
      await Promise.all([
        this.prisma.courseEnrollment.findMany({
          where: { userId },
          include: {
            course: {
              include: {
                category: true,
                _count: { select: { lessons: true } },
              },
            },
          },
          orderBy: { lastActivityAt: { sort: 'desc', nulls: 'last' } },
        }),
        this.prisma.courseEnrollment.count({ where: { userId, isCompleted: true } }),
        this.prisma.lessonProgress.aggregate({
          where: { userId },
          _sum: { totalWatchTime: true },
        }),
        this.prisma.savedCourse.findMany({
          where: { userId },
          include: {
            course: {
              include: {
                category: true,
                _count: { select: { lessons: true } },
              },
            },
          },
          orderBy: { savedAt: 'desc' },
        }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: true },
          orderBy: { earnedAt: 'desc' },
        }),
        this.prisma.lessonProgress.findMany({
          where: { userId },
          include: {
            lesson: { select: { id: true, titleAr: true, titleEn: true, slug: true } },
            course: { select: { id: true, slug: true, titleAr: true, titleEn: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
      ]);

    const totalLearningHours = Math.round((progress._sum.totalWatchTime || 0) / 3600);
    const activeEnrollment = enrollments.find((e) => !e.isCompleted);

    let continueCourse = null;
    let currentLesson = null;
    if (activeEnrollment) {
      continueCourse = activeEnrollment.course;
      const lesson = await this.prisma.lesson.findFirst({
        where: { courseId: activeEnrollment.courseId, lessonNumber: activeEnrollment.currentLessonNumber, status: 'published' },
        orderBy: { lessonNumber: 'asc' },
      });
      if (lesson) {
        const lessonProgress = await this.prisma.lessonProgress.findUnique({
          where: { userId_lessonId: { userId, lessonId: lesson.id } },
        });
        currentLesson = { ...lesson, userProgress: lessonProgress };
      }
    }

    const recommendedCourses = await this.prisma.course.findMany({
      where: { status: 'published', visibility: 'public', id: { notIn: enrollments.map((e) => e.courseId) } },
      take: 4,
      include: {
        category: true,
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      enrollments,
      continueCourse,
      currentLesson,
      completedCourses: completedCount,
      totalLearningHours,
      recentActivity,
      savedCourses,
      achievements,
      recommendedCourses,
      activeCourse: activeEnrollment
        ? { ...activeEnrollment }
        : null,
    };
  }

  // === Saved Courses ===
  async saveCourse(userId: string, courseId: string) {
    return this.prisma.savedCourse.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });
  }

  async unsaveCourse(userId: string, courseId: string) {
    try {
      await this.prisma.savedCourse.delete({
        where: { userId_courseId: { userId, courseId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      throw error;
    }
  }

  async getSavedCourses(userId: string) {
    return this.prisma.savedCourse.findMany({
      where: { userId },
      include: {
        course: {
          include: { category: true, _count: { select: { lessons: true, enrollments: true } } },
        },
      },
      orderBy: { savedAt: 'desc' },
    });
  }

  // === Reviews ===
  async createReview(userId: string, courseId: string, dto: CreateReviewDto) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled to review');
    }

    return this.prisma.courseReview.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, rating: dto.rating, comment: dto.comment },
      update: { rating: dto.rating, comment: dto.comment },
    });
  }

  // === Achievements ===
  private async checkAchievements(userId: string) {
    const allAchievements = await this.prisma.achievement.findMany();
    for (const achievement of allAchievements) {
      const alreadyEarned = await this.prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      });
      if (alreadyEarned) continue;

      let earned = false;
      switch (achievement.criteriaType) {
        case 'first_lesson': {
          const count = await this.prisma.lessonProgress.count({ where: { userId, isCompleted: true } });
          earned = count >= 1;
          break;
        }
        case 'first_course': {
          const count = await this.prisma.courseEnrollment.count({ where: { userId, isCompleted: true } });
          earned = count >= 1;
          break;
        }
        case 'lessons_completed': {
          const count = await this.prisma.lessonProgress.count({ where: { userId, isCompleted: true } });
          earned = count >= (achievement.criteriaValue || 10);
          break;
        }
        case 'watch_time': {
          const result = await this.prisma.lessonProgress.aggregate({ where: { userId }, _sum: { totalWatchTime: true } });
          earned = (result._sum.totalWatchTime || 0) >= (achievement.criteriaValue || 3600);
          break;
        }
      }

      if (earned) {
        await this.prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        this.logger.log(`User ${userId} earned achievement: ${achievement.titleAr}`);
      }
    }
  }

  async getUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  // === Stats ===
  async getLmsStats() {
    const [totalCourses, totalEnrollments, totalLessons, totalCompleted, totalReviews] =
      await Promise.all([
        this.prisma.course.count({ where: { status: 'published' } }),
        this.prisma.courseEnrollment.count(),
        this.prisma.lesson.count({ where: { status: 'published' } }),
        this.prisma.courseEnrollment.count({ where: { isCompleted: true } }),
        this.prisma.courseReview.count(),
      ]);

    const totalHours = await this.prisma.lessonProgress.aggregate({
      _sum: { totalWatchTime: true },
    });

    return {
      totalCourses,
      totalEnrollments,
      totalLessons,
      totalCompleted,
      totalReviews,
      totalLearningHours: Math.round((totalHours._sum.totalWatchTime || 0) / 3600),
    };
  }


  // === Course administration ===
  async findAdminCourses() {
    return this.prisma.course.findMany({
      include: {
        category: true,
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAdminCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        lessons: {
          orderBy: { lessonNumber: 'asc' },
          include: { attachments: { orderBy: { sortOrder: 'asc' } } },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });

    if (!course) throw new NotFoundException('الدورة غير موجودة');
    return course;
  }

  async createAdminCourse(dto: CreateCourseDto) {
    const slug = this.buildSlug(dto.title_en || dto.title_ar, 'course');
    const status = dto.status || 'published';
    const thumbnailUrl =
      dto.thumbnail_url || this.posterFromVideo(dto.lessons[0]?.video_url);

    return this.prisma.course.create({
      data: {
        titleAr: dto.title_ar,
        titleEn: dto.title_en,
        slug,
        instructorName: dto.instructor_name,
        instructorBio: dto.instructor_bio,
        shortDescAr: dto.short_desc_ar,
        shortDescEn: dto.short_desc_en,
        fullDescAr: dto.full_desc_ar,
        fullDescEn: dto.full_desc_en,
        thumbnailUrl,
        categoryId: dto.category_id || null,
        difficulty: dto.difficulty || 'beginner',
        duration: dto.duration ?? this.estimateDuration(dto.lessons),
        language: 'ar',
        status,
        visibility: 'public',
        isFeatured: dto.is_featured ?? false,
        isFree: true,
        publishedAt: status === 'published' ? new Date() : null,
        lessons: {
          create: dto.lessons.map((lesson, index) =>
            this.lessonCreateData(lesson, index + 1),
          ),
        },
      },
      include: {
        lessons: {
          orderBy: { lessonNumber: 'asc' },
          include: { attachments: true },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  async updateAdminCourse(courseId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: { orderBy: { lessonNumber: 'asc' }, take: 1 } },
    });
    if (!course) throw new NotFoundException('الدورة غير موجودة');

    const publishing = dto.status === 'published' && course.status !== 'published';

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(dto.title_ar !== undefined && { titleAr: dto.title_ar }),
        ...(dto.title_en !== undefined && { titleEn: dto.title_en }),
        ...(dto.instructor_name !== undefined && {
          instructorName: dto.instructor_name,
        }),
        ...(dto.instructor_bio !== undefined && { instructorBio: dto.instructor_bio }),
        ...(dto.short_desc_ar !== undefined && { shortDescAr: dto.short_desc_ar }),
        ...(dto.short_desc_en !== undefined && { shortDescEn: dto.short_desc_en }),
        ...(dto.full_desc_ar !== undefined && { fullDescAr: dto.full_desc_ar }),
        ...(dto.full_desc_en !== undefined && { fullDescEn: dto.full_desc_en }),
        ...(dto.thumbnail_url !== undefined && {
          thumbnailUrl:
            dto.thumbnail_url ||
            this.posterFromVideo(course.lessons[0]?.videoUrl) ||
            null,
        }),
        ...(dto.category_id !== undefined && { categoryId: dto.category_id || null }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.is_featured !== undefined && { isFeatured: dto.is_featured }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(publishing && { publishedAt: new Date() }),
      },
      include: {
        lessons: {
          orderBy: { lessonNumber: 'asc' },
          include: { attachments: true },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  async deleteAdminCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('الدورة غير موجودة');
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  async addLesson(courseId: string, dto: LessonInputDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { lessons: true } } },
    });
    if (!course) throw new NotFoundException('الدورة غير موجودة');

    const lesson = await this.prisma.lesson.create({
      data: {
        courseId,
        ...this.lessonCreateData(dto, course._count.lessons + 1),
      },
      include: { attachments: true },
    });

    await this.syncCourseDuration(courseId);
    return lesson;
  }

  async updateLesson(courseId: string, lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });
    if (!lesson) throw new NotFoundException('الدرس غير موجود');

    // The editor always sends the attachment list it wants to keep.
    if (dto.attachments) {
      await this.prisma.lessonAttachment.deleteMany({ where: { lessonId } });
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title_ar !== undefined && { titleAr: dto.title_ar }),
        ...(dto.title_en !== undefined && { titleEn: dto.title_en }),
        ...(dto.content_ar !== undefined && { contentAr: dto.content_ar }),
        ...(dto.content_en !== undefined && { contentEn: dto.content_en }),
        ...(dto.summary_ar !== undefined && { summaryAr: dto.summary_ar }),
        ...(dto.summary_en !== undefined && { summaryEn: dto.summary_en }),
        ...(dto.video_url !== undefined && { videoUrl: dto.video_url || null }),
        ...(dto.video_duration !== undefined && { videoDuration: dto.video_duration }),
        ...(dto.estimated_reading_time !== undefined && {
          estimatedReadingTime: dto.estimated_reading_time,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.attachments && {
          attachments: {
            create: dto.attachments.map((attachment, index) => ({
              type: attachment.type || 'file',
              titleAr: attachment.title_ar,
              titleEn: attachment.title_en,
              url: attachment.url,
              mimeType: attachment.mime_type,
              fileSize: attachment.file_size,
              sortOrder: index,
            })),
          },
        }),
      },
      include: { attachments: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.syncCourseDuration(courseId);
    return updated;
  }

  async deleteLesson(courseId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });
    if (!lesson) throw new NotFoundException('الدرس غير موجود');

    await this.prisma.lesson.delete({ where: { id: lessonId } });
    await this.renumberLessons(courseId);
    await this.syncCourseDuration(courseId);

    return { message: 'تم حذف الدرس' };
  }

  /** Reorders the lessons of a course to match the given list of ids. */
  async reorderLessons(courseId: string, lessonIds: string[]) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      select: { id: true },
    });
    const known = new Set(lessons.map((lesson) => lesson.id));

    if (lessonIds.length !== lessons.length || lessonIds.some((id) => !known.has(id))) {
      throw new ConflictException('قائمة الدروس لا تطابق دروس الدورة');
    }

    await this.applyLessonOrder(lessonIds);
    return this.findAdminCourse(courseId);
  }

  private lessonCreateData(dto: LessonInputDto, lessonNumber: number) {
    return {
      lessonNumber,
      sortOrder: lessonNumber,
      titleAr: dto.title_ar,
      titleEn: dto.title_en,
      slug: this.buildSlug(dto.title_en || dto.title_ar, `lesson-${lessonNumber}`),
      contentAr: dto.content_ar,
      contentEn: dto.content_en,
      summaryAr: dto.summary_ar,
      summaryEn: dto.summary_en,
      videoUrl: dto.video_url,
      videoDuration: dto.video_duration,
      estimatedReadingTime: dto.estimated_reading_time,
      status: dto.status || 'published',
      ...(dto.attachments?.length
        ? {
            attachments: {
              create: dto.attachments.map((attachment, index) => ({
                type: attachment.type || 'file',
                titleAr: attachment.title_ar,
                titleEn: attachment.title_en,
                url: attachment.url,
                mimeType: attachment.mime_type,
                fileSize: attachment.file_size,
                sortOrder: index,
              })),
            },
          }
        : {}),
    };
  }

  private buildSlug(source: string, fallback: string) {
    const base =
      source
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '') || fallback;
    return `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  /**
   * Cloudinary renders a frame of an uploaded video as an image, which gives a
   * course with no cover of its own something better than an empty box.
   */
  private posterFromVideo(videoUrl?: string | null): string | undefined {
    if (!videoUrl || !videoUrl.includes('/video/upload/')) return undefined;
    return videoUrl
      .replace('/video/upload/', '/video/upload/so_2,w_640,h_360,c_fill,q_auto/')
      .replace(/\.[a-zA-Z0-9]+$/, '.jpg');
  }

  private estimateDuration(lessons: LessonInputDto[]): number | undefined {
    const videoMinutes = Math.round(
      lessons.reduce((total, lesson) => total + (lesson.video_duration || 0), 0) / 60,
    );
    const readingMinutes = lessons.reduce(
      (total, lesson) => total + (lesson.estimated_reading_time || 0),
      0,
    );
    const minutes = videoMinutes + readingMinutes;
    return minutes > 0 ? minutes : undefined;
  }

  /** Keeps the advertised course length in step with its lessons. */
  private async syncCourseDuration(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId, status: 'published' },
      select: { videoDuration: true, estimatedReadingTime: true },
    });

    const minutes =
      Math.round(
        lessons.reduce((total, lesson) => total + (lesson.videoDuration || 0), 0) / 60,
      ) +
      lessons.reduce((total, lesson) => total + (lesson.estimatedReadingTime || 0), 0);

    if (minutes > 0) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { duration: minutes },
      });
    }
  }

  private async renumberLessons(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { lessonNumber: 'asc' },
      select: { id: true },
    });

    await this.applyLessonOrder(lessons.map((lesson) => lesson.id));
  }

  /**
   * Lesson numbers are unique per course, so they are parked on negatives
   * first and written in their final order afterwards.
   */
  private async applyLessonOrder(lessonIds: string[]) {
    await this.prisma.$transaction(
      lessonIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { lessonNumber: -(index + 1), sortOrder: index + 1 },
        }),
      ),
    );
    await this.prisma.$transaction(
      lessonIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { lessonNumber: index + 1 },
        }),
      ),
    );
  }


  /**
   * Course media (lesson videos, covers, handouts) goes through the same
   * storage service as archival files, under its own folder.
   */
  async uploadMedia(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    const limits: Record<string, number> = {
      video: Number(process.env.MAX_VIDEO_SIZE || 1073741824),
      image: Number(process.env.MAX_IMAGE_SIZE || 20971520),
      audio: Number(process.env.MAX_AUDIO_SIZE || 262144000),
    };
    const kind = file.mimetype.split('/')[0];
    const limit = limits[kind] ?? Number(process.env.MAX_DOCUMENT_SIZE || 104857600);

    if (file.size > limit) {
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد الأقصى (${Math.round(limit / (1024 * 1024))} ميغابايت)`,
      );
    }

    const result = await this.storage.upload(file, 'lms', userId);

    return {
      url: result.secureUrl,
      publicId: result.publicId,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      originalFilename: result.originalFileName,
      /** Present for videos on Cloudinary, so a cover can be offered right away. */
      posterUrl: this.posterFromVideo(result.secureUrl) || null,
    };
  }
  // === Certificates ===
  /**
   * Issued once per learner and course, with the details copied in so a printed
   * certificate keeps saying what it said the day it was earned.
   */
  private async issueCertificate(userId: string, courseId: string) {
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    const [user, course, watched] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true },
      }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          _count: { select: { lessons: true } },
        },
      }),
      this.prisma.lessonProgress.aggregate({
        where: { userId, courseId },
        _sum: { totalWatchTime: true },
      }),
    ]);

    if (!user || !course) return null;

    const watchedHours = (watched._sum.totalWatchTime || 0) / 3600;
    const learningHours = Math.max(
      Math.round(((course.duration || 0) / 60 || watchedHours) * 10) / 10,
      Math.round(watchedHours * 10) / 10,
    );

    try {
      return await this.prisma.certificate.create({
        data: {
          serial: this.buildCertificateSerial(),
          userId,
          courseId,
          recipientName: user.full_name,
          courseTitleAr: course.titleAr,
          courseTitleEn: course.titleEn,
          instructorName: course.instructorName,
          lessonsCount: course._count.lessons,
          learningHours,
        },
      });
    } catch (error) {
      // Two lessons finishing at once can race here; the unique pair wins.
      this.logger.warn(`Certificate already issued for ${userId}/${courseId}`);
      return this.prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
    }
  }

  private buildCertificateSerial() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).toUpperCase().slice(2, 8);
    return `ARS-${year}-${random}`;
  }

  async getMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: {
        course: {
          select: { id: true, slug: true, titleAr: true, titleEn: true, thumbnailUrl: true },
        },
      },
    });
  }

  /** Public: anyone holding a printed copy can check the serial. */
  async getCertificateBySerial(serial: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { serial },
      include: {
        course: {
          select: { id: true, slug: true, titleAr: true, titleEn: true, thumbnailUrl: true },
        },
      },
    });

    if (!certificate) throw new NotFoundException('الشهادة غير موجودة');
    return certificate;
  }

  async getCourseCertificate(userId: string, courseId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: {
          select: { id: true, slug: true, titleAr: true, titleEn: true, thumbnailUrl: true },
        },
      },
    });

    if (!certificate) throw new NotFoundException('لم تكتمل الدورة بعد');
    return certificate;
  }
}
