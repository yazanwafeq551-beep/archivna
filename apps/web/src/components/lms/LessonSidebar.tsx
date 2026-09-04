import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Lock, Play, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Lesson } from "@/api/lms";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LessonSidebarProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessons: Lesson[];
  currentLessonId?: string;
  courseProgress: number;
  className?: string;
}

export function LessonSidebar({
  courseId,
  courseSlug,
  courseTitle,
  lessons,
  currentLessonId,
  courseProgress,
  className,
}: LessonSidebarProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const ChevronIcon = isRtl ? ChevronRight : ChevronLeft;

  const getLessonStatus = (lesson: Lesson) => {
    if (lesson.lessonNumber === 1) return "unlocked";
    const prevLesson = lessons.find((l) => l.lessonNumber === lesson.lessonNumber - 1);
    if (prevLesson?.userProgress?.isCompleted) return "unlocked";
    if (lesson.userProgress?.isCompleted) return "completed";
    if (lesson.userProgress && !lesson.userProgress.isCompleted) return "in-progress";
    return "locked";
  };

  const getStatusIcon = (status: string, lessonNumber?: number) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Play className="h-4 w-4 text-gold" />;
      case "locked":
        return <Lock className="h-4 w-4 text-gray-300" />;
      default:
        return <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] font-medium text-gray-400">{lessonNumber || "?"}</span>;
    }
  };

  return (
    <aside className={cn("flex flex-col rounded-xl border border-gold-light/40 bg-surface shadow-sm", className)}>
      <div className="border-b border-gold-light/30 p-4">
        <h3 className="mb-1 text-sm font-medium text-muted">{t("lms.lessonSidebar.course")}</h3>
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{courseTitle}</p>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mt-2 h-auto p-0 text-xs text-gold hover:text-gold/80"
        >
          <Link to={`/lms/courses/${courseSlug}`}>
            <ChevronIcon className="me-1 h-3 w-3" />
            {t("lms.lessonSidebar.backToCourse")}
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {t("lms.lessonSidebar.lessons")}
        </p>
        <ul className="space-y-1">
          {lessons.map((lesson) => {
            const status = getLessonStatus(lesson);
            const isCurrent = lesson.id === currentLessonId;
            const title = isRtl ? lesson.titleAr : (lesson.titleEn || lesson.titleAr);

            const content = (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  isCurrent
                    ? "bg-gold-light/40 font-medium text-foreground shadow-sm"
                    : status === "completed"
                    ? "text-muted hover:bg-green-50"
                    : status === "locked"
                    ? "cursor-not-allowed text-gray-300"
                    : "text-muted hover:bg-gold-light/20"
                )}
              >
                <span className="flex-shrink-0">{getStatusIcon(status, lesson.lessonNumber)}</span>
                <div className="flex-1 truncate">
                  <span className="text-xs text-muted/60">{(lesson.lessonNumber).toString().padStart(2, "0")}</span>
                  <p className="truncate">{title}</p>
                </div>
                {lesson.videoDuration && (
                  <span className="flex-shrink-0 text-xs text-muted">
                    {Math.floor(lesson.videoDuration / 60)}:{(lesson.videoDuration % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>
            );

            if (status === "locked") {
              return (
                <li key={lesson.id}>
                  {content}
                </li>
              );
            }

            return (
              <li key={lesson.id}>
                <Link to={`/lms/courses/${courseSlug}/lessons/${lesson.id}`}>
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-gold-light/30 p-4">
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span>{t("lms.lessonSidebar.courseProgress")}</span>
          <span className="font-medium text-primary">{Math.round(courseProgress)}%</span>
        </div>
        <Progress value={courseProgress} className="h-2 bg-gold-light/50" />
      </div>
    </aside>
  );
}
