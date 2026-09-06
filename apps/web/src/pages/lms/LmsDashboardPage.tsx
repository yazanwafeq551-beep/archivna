import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen, Clock, Award, TrendingUp, ChevronRight,
  CheckCircle2, PlayCircle, BarChart3, BookMarked,
  FileText, User, Sparkles, ArrowRight, GraduationCap, Library
} from "lucide-react";
import { useDashboard } from "@/hooks/useLms";
import { useAuth } from "@/hooks/useAuth";
import { CourseCard } from "@/components/lms/CourseCard";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

export function LmsDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, refetch } = useDashboard();

  const isRtl = i18n.language === "ar";

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gold-light/30" />
          <div className="h-4 w-96 rounded bg-gold-light/20" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gold-light/30" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gold-light/30" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-gold-light/30" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t("lms.dashboard.errorTitle")}
        message={t("lms.dashboard.errorMessage")}
        onRetry={() => refetch()}
      />
    );
  }

  const activeCourse = dashboard?.activeCourse;
  const continueCourse = dashboard?.continueCourse;
  const currentLesson = dashboard?.currentLesson;
  const recentActivity = dashboard?.recentActivity ?? [];
  const savedCourses = dashboard?.savedCourses ?? [];
  const recommendedCourses = dashboard?.recommendedCourses ?? [];
  const completedCourses = dashboard?.completedCourses ?? 0;
  const totalLearningHours = dashboard?.totalLearningHours ?? 0;

  return (
    <div className="space-y-10">
      {/* A banner that carries the learner's progress, not just their name. */}
      <section className="relative overflow-hidden rounded-3xl bg-primary-dark p-6 text-white md:p-8">
        <div
          className="absolute inset-0 opacity-[.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,.9) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-gold/40">
              <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
              <AvatarFallback className="bg-white/10 text-white">
                {getInitials(user?.fullName || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {t("lms.dashboard.welcome")}, {user?.fullName || t("lms.dashboard.learner")}
              </h1>
              <p className="mt-1 text-sm text-white/70">{t("lms.dashboard.welcomeMessage")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gold" asChild>
              <Link to="/lms">
                <BookOpen className="me-2 h-4 w-4" />
                {t("lms.dashboard.browseCourses")}
              </Link>
            </Button>
            {activeCourse && continueCourse && (
              <Button
                variant="outline"
                asChild
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link
                  to={`/lms/courses/${continueCourse.slug}/lessons/${currentLesson?.id || ""}`}
                >
                  <PlayCircle className="me-2 h-4 w-4" />
                  {t("lms.dashboard.resume")}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {activeCourse && (
          <div className="relative mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-white/70">{t("lms.dashboard.progress")}</span>
              <span className="font-semibold text-gold-light">
                {Math.round(activeCourse.courseProgress)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                style={{ width: `${Math.round(activeCourse.courseProgress)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Stats on the brand palette, so they hold up in both themes. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: CheckCircle2,
            value: completedCourses,
            label: "lms.dashboard.stats.completed",
            tint: "bg-success/10 text-success",
          },
          {
            icon: Clock,
            value: totalLearningHours,
            label: "lms.dashboard.stats.hours",
            tint: "bg-gold-light/30 text-gold-deep",
          },
          {
            icon: BarChart3,
            value: activeCourse ? `${Math.round(activeCourse.courseProgress)}%` : "—",
            label: "lms.dashboard.stats.progress",
            tint: "bg-primary/10 text-primary",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("grid h-12 w-12 place-items-center rounded-xl", stat.tint)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted">{t(stat.label)}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Continue Learning */}
      {activeCourse && continueCourse && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <PlayCircle className="h-5 w-5 text-gold" />
              {t("lms.dashboard.continueLearning")}
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-gold">
              <Link to={`/lms/courses/${continueCourse.slug}`}>
                {t("lms.dashboard.viewCourse")}
                <ChevronRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
              </Link>
            </Button>
          </div>
          <Card className="overflow-hidden border-gold-light/30 bg-surface shadow-sm">
            <div className="flex flex-col gap-6 p-6 sm:flex-row">
              <div className="h-32 w-full flex-shrink-0 overflow-hidden rounded-xl sm:w-48">
                {continueCourse.thumbnailUrl ? (
                  <img src={continueCourse.thumbnailUrl} alt={continueCourse.titleAr} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold-light/30 to-primary/10">
                    <GraduationCap className="h-10 w-10 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    {isRtl ? continueCourse.titleAr : (continueCourse.titleEn || continueCourse.titleAr)}
                  </h3>
                  <p className="mb-2 text-sm text-muted line-clamp-1">
                    {isRtl ? continueCourse.shortDescAr : (continueCourse.shortDescEn || continueCourse.shortDescAr || "")}
                  </p>
                  {currentLesson && (
                    <p className="text-sm text-gold">
                      {t("lms.dashboard.currentLesson")}: {isRtl ? currentLesson.titleAr : (currentLesson.titleEn || currentLesson.titleAr)}
                    </p>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t("lms.dashboard.progress")}</span>
                    <span className="font-medium text-primary">{Math.round(activeCourse.courseProgress)}%</span>
                  </div>
                  <Progress value={activeCourse.courseProgress} className="h-2.5 bg-gold-light/50 [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-primary" />
                </div>
                <div className="mt-4">
                  <Button asChild size="sm" variant="gold" className="shadow-md shadow-gold/20">
                    <Link to={`/lms/courses/${continueCourse.slug}/lessons/${currentLesson?.id || ""}`}>
                      <PlayCircle className="me-1 h-4 w-4" />
                      {t("lms.dashboard.resume")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Clock className="h-5 w-5 text-gold" />
          {t("lms.dashboard.recentActivity")}
        </h2>
        {recentActivity.length === 0 ? (
          <Card className="border-gold-light/30 bg-surface p-8">
            <EmptyState
              title={t("lms.dashboard.noActivity")}
              icon={<Clock className="h-12 w-12 text-muted" />}
              action={{
                label: t("lms.dashboard.startLearning"),
                onClick: () => navigate("/lms"),
              }}
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {recentActivity.slice(0, 5).map((activity) => (
              <Card key={activity.id} className="border-gold-light/30 bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    activity.isCompleted ? "bg-green-100 text-green-600" : "bg-gold-light/40 text-gold"
                  )}>
                    {activity.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.isCompleted ? t("lms.dashboard.completed") : t("lms.dashboard.watched")}: {isRtl ? activity.lesson?.titleAr : (activity.lesson?.titleEn || activity.lesson?.titleAr || "")}
                    </p>
                    <p className="text-xs text-muted">
                      {t("lms.dashboard.lesson")} {activity.lesson?.lessonNumber}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(activity.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Saved Courses */}
      {savedCourses.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <BookMarked className="h-5 w-5 text-gold" />
              {t("lms.dashboard.savedCourses")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedCourses.map((saved) => (
              <CourseCard key={saved.courseId} course={saved.course} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Courses */}
      {recommendedCourses.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-gold" />
              {t("lms.dashboard.recommended")}
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-gold">
              <Link to="/lms">
                {t("lms.dashboard.viewAll")}
                <ChevronRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Empty Dashboard */}
      {!activeCourse && recentActivity.length === 0 && savedCourses.length === 0 && recommendedCourses.length === 0 && (
        <Card className="border-gold-light/30 bg-surface p-12">
          <EmptyState
            title={t("lms.dashboard.emptyTitle")}
            description={t("lms.dashboard.emptyDescription")}
            icon={<GraduationCap className="h-16 w-16 text-muted" />}
            action={{
              label: t("lms.dashboard.browseCourses"),
              onClick: () => navigate("/lms"),
            }}
          />
        </Card>
      )}
    </div>
  );
}
