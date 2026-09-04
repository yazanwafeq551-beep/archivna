import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { useEnrollments } from "@/hooks/useLms";
import { CourseCard } from "@/components/lms/CourseCard";
import { ErrorState, EmptyState } from "@/components/shared";
import { CourseGridSkeleton } from "@/components/lms/CourseGridSkeleton";
import type { CourseEnrollment } from "@/api/lms";

/** The card renders progress from `course.enrollment`, which the list omits. */
function withEnrollment(enrollment: CourseEnrollment) {
  return { ...enrollment.course!, enrollment };
}

export function MyCoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useEnrollments();

  if (isLoading) return <CourseGridSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title={t("lms.dashboard.errorTitle")}
        message={t("lms.dashboard.errorMessage")}
        onRetry={() => refetch()}
      />
    );
  }

  const inProgress = (data?.uncompleted ?? []).filter((item) => item.course);
  const completed = (data?.completed ?? []).filter((item) => item.course);

  if (inProgress.length === 0 && completed.length === 0) {
    return (
      <EmptyState
        title={t("lms.dashboard.noEnrollments")}
        description={t("lms.dashboard.emptyDescription")}
        icon={<BookOpen className="h-9 w-9" strokeWidth={1.5} />}
        action={{
          label: t("lms.dashboard.browseCourses"),
          onClick: () => navigate("/lms"),
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("lms.sidebar.myCourses")}</h1>
        <p className="text-sm text-muted">{t("lms.dashboard.welcomeMessage")}</p>
      </div>

      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen className="h-5 w-5 text-gold" />
            {t("lms.progress.inProgress")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((enrollment) => (
              <CourseCard key={enrollment.id} course={withEnrollment(enrollment)} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {t("lms.dashboard.completedCourses")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((enrollment) => (
              <CourseCard key={enrollment.id} course={withEnrollment(enrollment)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
