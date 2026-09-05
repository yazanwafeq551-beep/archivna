import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { useEnrollments } from "@/hooks/useLms";
import { CourseCard } from "@/components/lms/CourseCard";
import { ErrorState, EmptyState } from "@/components/shared";
import { CourseGridSkeleton } from "@/components/lms/CourseGridSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, primaryText } from "@/lib/utils";
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
  const hours = data?.totalLearningHours ?? 0;

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

  const summary = [
    {
      icon: PlayCircle,
      value: inProgress.length,
      label: t("lms.progress.inProgress"),
      tint: "bg-primary/10 text-primary",
    },
    {
      icon: CheckCircle2,
      value: completed.length,
      label: t("lms.dashboard.completedCourses"),
      tint: "bg-success/10 text-success",
    },
    {
      icon: Clock,
      value: hours,
      label: t("lms.dashboard.learningHours"),
      tint: "bg-gold-light/30 text-gold-deep",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("lms.sidebar.myCourses")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("lms.dashboard.welcomeMessage")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-4">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl", item.tint)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted">{item.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <PlayCircle className="h-5 w-5 text-gold" />
            {t("lms.progress.inProgress")}
          </h2>

          {/* One row per course: the point here is picking up where you left off. */}
          <div className="space-y-3">
            {inProgress.map((enrollment) => {
              const course = enrollment.course!;
              const progress = Math.round(enrollment.courseProgress);
              return (
                <Card key={enrollment.id}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted-bg">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-primary/40">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {primaryText(course.titleAr, course.titleEn)}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">
                        {enrollment.lessonsCompleted} / {course._count?.lessons ?? 0}{" "}
                        {t("lms.courseDetail.lessonsCompleted")}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted-bg">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-gold to-primary"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-primary">{progress}%</span>
                      </div>
                    </div>

                    <Button size="sm" variant="gold" asChild>
                      <Link to={`/lms/courses/${course.slug}`}>
                        <PlayCircle className="me-1 h-4 w-4" />
                        {t("lms.dashboard.resume")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <CheckCircle2 className="h-5 w-5 text-success" />
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
