import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCourseDto } from './dto/query-course.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class LmsService {
  private readonly logger = new Logger(LmsService.name);
  constructor(private prisma: PrismaService) {}

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
}
