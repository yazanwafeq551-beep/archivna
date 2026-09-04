import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookMarked } from "lucide-react";
import { useSavedCourses } from "@/hooks/useLms";
import { CourseCard } from "@/components/lms/CourseCard";
import { CourseGridSkeleton } from "@/components/lms/CourseGridSkeleton";
import { ErrorState, EmptyState } from "@/components/shared";

export function SavedCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useSavedCourses();

  if (isLoading) return <CourseGridSkeleton count={3} />;

  if (isError) {
    return (
      <ErrorState
        title={t("lms.dashboard.errorTitle")}
        message={t("lms.dashboard.errorMessage")}
        onRetry={() => refetch()}
      />
    );
  }

  const saved = (data ?? []).filter((item) => item.course);

  if (saved.length === 0) {
    return (
      <EmptyState
        title={t("lms.dashboard.noSavedCourses")}
        description={t("lms.dashboard.emptyDescription")}
        icon={<BookMarked className="h-9 w-9" strokeWidth={1.5} />}
        action={{
          label: t("lms.dashboard.browseCourses"),
          onClick: () => navigate("/lms"),
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("lms.dashboard.savedCourses")}</h1>
        <p className="text-sm text-muted">{t("lms.dashboard.welcomeMessage")}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((item) => (
          <CourseCard key={item.courseId} course={item.course} />
        ))}
      </div>
    </div>
  );
}
