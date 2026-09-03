import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Clock, Users, Star, BookOpen, ChevronRight, ChevronDown,
  CheckCircle2, Lock, PlayCircle, BarChart3, Award,
  User, MessageSquare, ThumbsUp, FileText, GraduationCap, BookMarked
} from "lucide-react";
import { useCourseBySlug, useEnroll, useCreateReview } from "@/hooks/useLms";
import { useAuth } from "@/hooks/useAuth";
import { GuestModal } from "@/components/lms/GuestModal";
import { LessonSidebar } from "@/components/lms/LessonSidebar";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-amber-100 text-amber-800",
  advanced: "bg-red-100 text-red-800",
};

export function CourseDetailPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: course, isLoading, isError, refetch } = useCourseBySlug(slug ?? "");
  const enrollMutation = useEnroll();
  const createReviewMutation = useCreateReview();

  const isEnrolled = !!course?.enrollment;
  const progress = course?.enrollment?.courseProgress ?? 0;
  const lessons = course?.lessons ?? [];
  const reviews = course?.reviews ?? [];
  const isRtl = i18n.language === "ar";
  const ChevronIcon = isRtl ? ChevronRight : ChevronRight;

  const title = isRtl ? course?.titleAr : (course?.titleEn || course?.titleAr || "");
  const shortDesc = isRtl ? course?.shortDescAr : (course?.shortDescEn || course?.shortDescAr || "");
  const fullDesc = isRtl ? course?.fullDescAr : (course?.fullDescEn || course?.fullDescAr || "");
  const instructorBio = isRtl ? course?.instructorBio : course?.instructorBio;
  const objectives = course?.learningObjectives ?? [];
  const prerequisites = course?.prerequisites;
  const lessonCount = course?._count?.lessons ?? lessons.length;
  const studentCount = course?._count?.enrollments ?? 0;
  const rating = course?.avgRating ?? 0;
  const duration = course?.duration ?? course?.estimatedStudyTime;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }
    if (!course) return;
    try {
      await enrollMutation.mutateAsync(course.id);
      refetch();
    } catch {
      // handled by toast
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    try {
      await createReviewMutation.mutateAsync({
        courseId: course.id,
        data: { rating: reviewRating, comment: reviewComment },
      });
      setReviewComment("");
      setReviewRating(5);
    } catch {
      // handled by toast
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 rounded bg-gold-light/30" />
            <div className="h-64 rounded-2xl bg-gold-light/30" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 w-3/4 rounded bg-gold-light/30" />
                <div className="h-4 w-full rounded bg-gold-light/20" />
                <div className="h-4 w-2/3 rounded bg-gold-light/20" />
              </div>
              <div className="h-96 rounded-xl bg-gold-light/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <ErrorState
            title={t("lms.courseDetail.errorTitle")}
            message={t("lms.courseDetail.errorMessage")}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-gold-light/30 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm text-muted sm:px-6 lg:px-8">
          <Link to="/lms" className="hover:text-primary transition-colors">{t("lms.nav.courses")}</Link>
          <ChevronIcon className="h-3 w-3" />
          <span className="text-foreground truncate">{title}</span>
        </div>
      </div>

      {/* Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary-dark">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 30L30 55L5 30Z' fill='none' stroke='%23C6A15B' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {course.isFeatured && (
                  <Badge className="bg-gold text-white">{t("lms.courseDetail.featured")}</Badge>
                )}
                {course.isPopular && (
                  <Badge className="bg-purple-600 text-white">{t("lms.courseDetail.popular")}</Badge>
                )}
                {course.isFree && (
                  <Badge className="bg-emerald-600 text-white">{t("lms.courseDetail.free")}</Badge>
                )}
                {course.difficulty && (
                  <Badge className={difficultyColors[course.difficulty] || ""}>
                    {t(`lms.difficulty.${course.difficulty}`)}
                  </Badge>
                )}
              </div>

              <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
              <p className="mb-6 text-lg text-white/70">{shortDesc}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {course.instructorName}
                </span>
                {duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {duration} {t("lms.courseDetail.hours")}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {lessonCount} {t("lms.courseDetail.lessons")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {studentCount} {t("lms.courseDetail.students")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className={cn("h-4 w-4", rating > 0 ? "fill-gold text-gold" : "")} />
                  {rating > 0 ? rating.toFixed(1) : t("lms.courseDetail.noRating")}
                </span>
              </div>

              {isEnrolled && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{t("lms.courseDetail.progress")}</span>
                    <span className="font-medium text-gold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2.5 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-primary" />
                </div>
              )}
            </div>

            {/* CTA Card */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-gold-light/30 bg-white shadow-lg">
                <div className="aspect-video bg-gradient-to-br from-gold-light/30 to-primary/10 flex items-center justify-center">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={title} className="h-full w-full object-cover" />
                  ) : (
                    <GraduationCap className="h-16 w-16 text-primary/20" />
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-center gap-2 text-lg font-bold text-primary">
                    {t("lms.courseDetail.free")}
                  </div>
                  <Button
                    size="lg"
                    variant={isEnrolled ? "outline" : "gold"}
                    className="w-full text-base font-semibold"
                    onClick={isEnrolled ? () => {
                      const firstLesson = lessons[0];
                      if (firstLesson) {
                        navigate(`/lms/courses/${course.slug}/lessons/${firstLesson.id}`);
                      }
                    } : handleEnroll}
                    isLoading={enrollMutation.isPending}
                  >
                    {isEnrolled ? (
                      <>
                        <PlayCircle className="me-2 h-5 w-5" />
                        {t("lms.courseDetail.continueLearning")}
                      </>
                    ) : (
                      <>
                        <GraduationCap className="me-2 h-5 w-5" />
                        {t("lms.courseDetail.startLearning")}
                      </>
                    )}
                  </Button>
                  {isEnrolled && progress > 0 && progress < 100 && (
                    <p className="mt-2 text-center text-xs text-muted">
                      {Math.round(progress)}% {t("lms.courseDetail.completed")}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gold-light/30">
            <TabsTrigger value="overview">{t("lms.courseDetail.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="curriculum">
              {t("lms.courseDetail.tabs.curriculum")}
              {lessons.length > 0 && (
                <span className="ms-2 text-xs text-muted">({lessons.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews">
              {t("lms.courseDetail.tabs.reviews")}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                {fullDesc && (
                  <Card className="border-gold-light/30 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">
                      {t("lms.courseDetail.aboutCourse")}
                    </h2>
                    <div className="prose prose-sm max-w-none text-muted" dangerouslySetInnerHTML={{ __html: sanitizeHtml(fullDesc) }} />
                  </Card>
                )}

                {objectives.length > 0 && (
                  <Card className="border-gold-light/30 bg-white p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                      <Award className="h-5 w-5 text-gold" />
                      {t("lms.courseDetail.learningObjectives")}
                    </h2>
                    <ul className="space-y-3">
                      {objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                          <span className="text-sm text-muted">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {prerequisites && (
                  <Card className="border-gold-light/30 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">
                      {t("lms.courseDetail.prerequisites")}
                    </h2>
                    <p className="text-sm text-muted">{prerequisites}</p>
                  </Card>
                )}
              </div>

              {/* Instructor Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-gold-light/30 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    {t("lms.courseDetail.instructor")}
                  </h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {course.instructorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{course.instructorName}</p>
                    </div>
                  </div>
                  {instructorBio && (
                    <p className="text-sm text-muted leading-relaxed">{instructorBio}</p>
                  )}
                  <div className="mt-4 space-y-2 text-sm text-muted border-t border-gold-light/30 pt-4">
                    {course.language && (
                      <p>{t("lms.courseDetail.language")}: {course.language === "ar" ? t("common.arabic") : course.language === "en" ? t("common.english") : course.language}</p>
                    )}
                    {course.region && <p>{t("lms.courseDetail.region")}: {course.region}</p>}
                    {course.historicalPeriod && <p>{t("lms.courseDetail.period")}: {course.historicalPeriod}</p>}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Curriculum */}
          <TabsContent value="curriculum">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="border-gold-light/30 bg-white p-6">
                  <h2 className="mb-6 text-lg font-semibold text-foreground">
                    {lessonCount} {t("lms.courseDetail.lessons")}
                  </h2>
                  {lessons.length === 0 ? (
                    <EmptyState
                      title={t("lms.courseDetail.noLessons")}
                      icon={<BookOpen className="h-12 w-12 text-muted" />}
                    />
                  ) : (
                    <div className="space-y-2">
                      {lessons.map((lesson, index) => {
                        const isCompleted = lesson.userProgress?.isCompleted;
                        const isCurrent = course.enrollment?.currentLessonNumber === lesson.lessonNumber;
                        const titleL = isRtl ? lesson.titleAr : (lesson.titleEn || lesson.titleAr);
                        return (
                          <Link
                            key={lesson.id}
                            to={`/lms/courses/${course.slug}/lessons/${lesson.id}`}
                            className={cn(
                              "flex items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-sm",
                              isCurrent
                                ? "border-gold bg-gold-light/20"
                                : isCompleted
                                ? "border-green-200 bg-green-50/30"
                                : "border-gold-light/30 bg-white"
                            )}
                          >
                            <div className={cn(
                              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                              isCompleted
                                ? "bg-green-100 text-green-600"
                                : isCurrent
                                ? "bg-gold/20 text-gold"
                                : "bg-gold-light/30 text-muted"
                            )}>
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={cn(
                                "font-medium",
                                isCompleted ? "text-green-700" : "text-foreground"
                              )}>
                                {titleL}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                                {lesson.videoDuration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {Math.floor(lesson.videoDuration / 60)}:{lesson.videoDuration % 60}
                                  </span>
                                )}
                                {lesson.estimatedReadingTime && (
                                  <span>{lesson.estimatedReadingTime} {t("lms.courseDetail.min")}</span>
                                )}
                              </div>
                            </div>
                            <ChevronIcon className="h-4 w-4 text-muted flex-shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar progress */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-gold-light/30 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-foreground">{t("lms.courseDetail.yourProgress")}</h3>
                  {isEnrolled ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted">{t("lms.courseDetail.completed")}</span>
                          <span className="font-medium text-primary">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2.5 bg-gold-light/50" />
                      </div>
                      <p className="text-sm text-muted">
                        {course.enrollment?.lessonsCompleted ?? 0} / {lessonCount} {t("lms.courseDetail.lessonsCompleted")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">{t("lms.courseDetail.enrollToTrack")}</p>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {reviews.length === 0 ? (
                  <Card className="border-gold-light/30 bg-white p-6">
                    <EmptyState
                      title={t("lms.courseDetail.noReviews")}
                      icon={<MessageSquare className="h-12 w-12 text-muted" />}
                    />
                  </Card>
                ) : (
                  reviews.map((review: any) => (
                    <Card key={review.id} className="border-gold-light/30 bg-white p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {review.user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-foreground">{review.user?.fullName}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-gold text-gold" : "text-gray-300")} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted mb-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                          {review.comment && <p className="text-sm text-muted">{review.comment}</p>}
                        </div>
                      </div>
                    </Card>
                  ))
                )}

                {/* Review Form */}
                {isAuthenticated && (
                  <Card className="border-gold-light/30 bg-white p-6">
                    <h3 className="mb-4 font-semibold text-foreground">{t("lms.courseDetail.writeReview")}</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          {t("lms.courseDetail.yourRating")}
                        </label>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button key={i} type="button" onClick={() => setReviewRating(i + 1)}>
                              <Star className={cn("h-6 w-6 transition-colors", i < reviewRating ? "fill-gold text-gold" : "text-gray-300 hover:text-gold/50")} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          {t("lms.courseDetail.yourComment")}
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-gold-light/40 bg-white p-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[100px]"
                          placeholder={t("lms.courseDetail.commentPlaceholder")}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        />
                      </div>
                      <Button type="submit" variant="gold" isLoading={createReviewMutation.isPending}>
                        <MessageSquare className="me-2 h-4 w-4" />
                        {t("lms.courseDetail.submitReview")}
                      </Button>
                    </form>
                  </Card>
                )}
              </div>

              {/* Rating Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-gold-light/30 bg-white p-6 text-center">
                  <p className="text-5xl font-bold text-gold">{rating > 0 ? rating.toFixed(1) : "0.0"}</p>
                  <div className="my-2 flex items-center justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-5 w-5", i < Math.round(rating) ? "fill-gold text-gold" : "text-gray-300")} />
                    ))}
                  </div>
                  <p className="text-sm text-muted">
                    {course._count?.reviews ?? 0} {t("lms.courseDetail.reviews")}
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <GuestModal open={showGuestModal} onOpenChange={setShowGuestModal} />
    </div>
  );
}
