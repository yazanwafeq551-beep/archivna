import apiClient from "./client";

export interface CourseCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  _count?: { courses: number };
}

export interface CourseTag {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  titleAr: string;
  titleEn?: string;
  slug: string;
  shortDescAr?: string;
  shortDescEn?: string;
  fullDescAr?: string;
  fullDescEn?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
  category?: CourseCategory;
  categoryId?: string;
  difficulty: string;
  duration?: number;
  estimatedStudyTime?: number;
  language: string;
  prerequisites?: string;
  learningObjectives?: string[];
  archiveTopic?: string;
  region?: string;
  historicalPeriod?: string;
  targetAudience?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  version?: string;
  status: string;
  visibility: string;
  isFeatured: boolean;
  isPopular: boolean;
  isFree: boolean;
  tags?: { tag: CourseTag }[];
  lessons?: Lesson[];
  avgRating?: number;
  _count?: { lessons: number; enrollments: number; reviews: number };
  reviews?: CourseReview[];
  enrollment?: CourseEnrollment | null;
  userProgress?: LessonProgress[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  lessonNumber: number;
  titleAr: string;
  titleEn?: string;
  slug: string;
  videoUrl?: string;
  videoDuration?: number;
  contentAr?: string;
  contentEn?: string;
  summaryAr?: string;
  summaryEn?: string;
  transcript?: string;
  estimatedReadingTime?: number;
  completionThreshold: number;
  isAssessment: boolean;
  attachments?: LessonAttachment[];
  userProgress?: LessonProgress | null;
  status: string;
  sortOrder: number;
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  type: string;
  titleAr: string;
  titleEn?: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  lastActivityAt?: string;
  currentLessonNumber: number;
  courseProgress: number;
  lessonsCompleted: number;
  totalWatchTime: number;
  isCompleted: boolean;
  course?: Course;
}

export interface LessonProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  watchedSeconds: number;
  watchPercentage: number;
  lastPosition: number;
  totalWatchTime: number;
  isCompleted: boolean;
  completedAt?: string;
  startedAt: string;
  updatedAt: string;
  lesson?: { id: string; lessonNumber: number; titleAr: string; titleEn?: string; slug: string };
}

export interface Achievement {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  badgeColor?: string;
  criteriaType: string;
  criteriaValue?: number;
  users?: { earnedAt: string }[];
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  earnedAt: string;
  achievement: Achievement;
}

export interface CourseReview {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  user?: { id: string; fullName: string; avatarUrl?: string };
  createdAt: string;
}

export interface DashboardData {
  enrollments: CourseEnrollment[];
  continueCourse: Course | null;
  currentLesson: Lesson | null;
  completedCourses: number;
  totalLearningHours: number;
  recentActivity: LessonProgress[];
  savedCourses: SavedCourse[];
  achievements: UserAchievement[];
  recommendedCourses: Course[];
  activeCourse: CourseEnrollment | null;
}

export interface SavedCourse {
  userId: string;
  courseId: string;
  savedAt: string;
  course: Course;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface LmsStats {
  totalCourses: number;
  totalEnrollments: number;
  totalLessons: number;
  totalCompleted: number;
  totalReviews: number;
  totalLearningHours: number;
}

export interface CreateCourseInput {
  titleAr: string;
  titleEn?: string;
  instructorName: string;
  shortDescAr?: string;
  fullDescAr?: string;
  thumbnailUrl?: string;
  difficulty?: string;
  duration?: number;
  isFeatured?: boolean;
  lessonTitleAr: string;
  lessonTitleEn?: string;
  lessonContentAr?: string;
  lessonSummaryAr?: string;
  lessonVideoUrl?: string;
}

export const lmsApi = {
  getAdminCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get("/lms/admin/courses");
    return response.data;
  },

  createAdminCourse: async (data: CreateCourseInput): Promise<Course> => {
    const response = await apiClient.post("/lms/admin/courses", data);
    return response.data;
  },

  deleteAdminCourse: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/lms/admin/courses/${courseId}`);
  },

  getCategories: async (): Promise<CourseCategory[]> => {
    const response = await apiClient.get("/lms/categories");
    return response.data;
  },

  getCourses: async (params?: {
    q?: string;
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    instructor?: string;
    sort?: string;
  }): Promise<PaginatedResponse<Course>> => {
    const response = await apiClient.get("/lms/courses", { params });
    return response.data;
  },

  getCourseBySlug: async (slug: string): Promise<Course> => {
    const response = await apiClient.get(`/lms/courses/${slug}`);
    return response.data;
  },

  getLmsStats: async (): Promise<LmsStats> => {
    const response = await apiClient.get("/lms/courses/stats");
    return response.data;
  },

  enroll: async (courseId: string): Promise<CourseEnrollment> => {
    const response = await apiClient.post(`/lms/courses/${courseId}/enroll`);
    return response.data;
  },

  getLesson: async (courseId: string, lessonId: string): Promise<Lesson> => {
    const response = await apiClient.get(`/lms/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  updateProgress: async (
    courseId: string,
    lessonId: string,
    data: {
      watchedSeconds: number;
      watchPercentage: number;
      lastPosition: number;
      totalWatchTime: number;
    }
  ): Promise<LessonProgress> => {
    const response = await apiClient.patch(`/lms/courses/${courseId}/lessons/${lessonId}/progress`, data);
    return response.data;
  },

  getCourseProgress: async (courseId: string): Promise<LessonProgress[]> => {
    const response = await apiClient.get(`/lms/courses/${courseId}/progress`);
    return response.data;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get("/lms/dashboard");
    return response.data;
  },

  getEnrollments: async (): Promise<{ enrollments: CourseEnrollment[]; uncompleted: CourseEnrollment[]; completed: CourseEnrollment[]; totalLearningHours: number }> => {
    const response = await apiClient.get("/lms/enrollments");
    return response.data;
  },

  saveCourse: async (courseId: string): Promise<void> => {
    await apiClient.post(`/lms/courses/${courseId}/save`);
  },

  unsaveCourse: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/lms/courses/${courseId}/save`);
  },

  getSavedCourses: async (): Promise<SavedCourse[]> => {
    const response = await apiClient.get("/lms/saved");
    return response.data;
  },

  createReview: async (courseId: string, data: { rating: number; comment?: string }): Promise<CourseReview> => {
    const response = await apiClient.post(`/lms/courses/${courseId}/reviews`, data);
    return response.data;
  },

  getAchievements: async (): Promise<UserAchievement[]> => {
    const response = await apiClient.get("/lms/achievements");
    return response.data;
  },
};
