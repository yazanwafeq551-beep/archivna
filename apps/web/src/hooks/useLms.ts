import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lmsApi, type Course, type Lesson, type DashboardData } from "@/api/lms";

export function useCourses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => lmsApi.getCourses(params as any),
  });
}

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: () => lmsApi.getCourseBySlug(slug),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["courseCategories"],
    queryFn: () => lmsApi.getCategories(),
  });
}

export function useLmsStats() {
  return useQuery({
    queryKey: ["lmsStats"],
    queryFn: () => lmsApi.getLmsStats(),
  });
}

export function useLesson(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => lmsApi.getLesson(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => lmsApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      data,
    }: {
      courseId: string;
      lessonId: string;
      data: {
        watchedSeconds: number;
        watchPercentage: number;
        lastPosition: number;
        totalWatchTime: number;
      };
    }) => lmsApi.updateProgress(courseId, lessonId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["courseProgress", variables.courseId] });
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => lmsApi.getDashboard(),
  });
}

export function useEnrollments() {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: () => lmsApi.getEnrollments(),
  });
}

export function useSaveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => lmsApi.saveCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCourses"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
    },
  });
}

export function useUnsaveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => lmsApi.unsaveCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCourses"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
    },
  });
}

export function useSavedCourses() {
  return useQuery({
    queryKey: ["savedCourses"],
    queryFn: () => lmsApi.getSavedCourses(),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: { rating: number; comment?: string };
    }) => lmsApi.createReview(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: () => lmsApi.getAchievements(),
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ["courseProgress", courseId],
    queryFn: () => lmsApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });
}
