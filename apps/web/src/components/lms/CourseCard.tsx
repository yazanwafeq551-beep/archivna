import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, Clock, Users, BookOpen, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Course } from "@/api/lms";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  course: Course;
  className?: string;
}

const difficultyStyles: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 border-green-200",
  intermediate: "bg-amber-100 text-amber-800 border-amber-200",
  advanced: "bg-red-100 text-red-800 border-red-200",
};

const badgeStyles: Record<string, string> = {
  new: "bg-primary text-white",
  popular: "bg-gold text-white",
  featured: "bg-purple-600 text-white",
  free: "bg-emerald-600 text-white",
};

export function CourseCard({ course, className }: CourseCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const isEnrolled = !!course.enrollment;
  const progress = course.enrollment?.courseProgress ?? 0;

  const title = isRtl ? course.titleAr : (course.titleEn || course.titleAr);
  const shortDesc = isRtl ? course.shortDescAr : (course.shortDescEn || course.shortDescAr || "");
  const instructor = course.instructorName;
  const duration = course.duration ?? course.estimatedStudyTime;
  const lessonCount = course._count?.lessons ?? course.lessons?.length ?? 0;
  const studentCount = course._count?.enrollments ?? 0;
  const rating = course.avgRating ?? 0;

  const getBadge = () => {
    if (course.isFree) return { type: "free", label: t("lms.courseCard.free") };
    if (course.isFeatured) return { type: "featured", label: t("lms.courseCard.featured") };
    return null;
  };

  const badge = getBadge();

  return (
    <Link
      to={`/lms/courses/${course.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-gold-light/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gold/30",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/5 to-gold-light/30">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {badge && (
          <Badge
            className={cn(
              "absolute top-3 start-3 px-2.5 py-1 text-xs font-semibold shadow-md",
              badgeStyles[badge.type]
            )}
          >
            {badge.label}
          </Badge>
        )}

        {isEnrolled && (
          <div className="absolute end-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-sm">
            <PlayCircle className="me-1 inline h-3 w-3" />
            {t("lms.courseCard.continue")}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted">
          {shortDesc}
        </p>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {instructor.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{instructor}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              difficultyStyles[course.difficulty] || "bg-gray-100 text-gray-800"
            )}
          >
            {t(`lms.difficulty.${course.difficulty}`)}
          </Badge>

          {duration && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Clock className="h-3 w-3" />
              {duration} {t("lms.courseCard.hours")}
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-muted">
            <BookOpen className="h-3 w-3" />
            {lessonCount} {t("lms.courseCard.lessons")}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gold-light/30 pt-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(rating) ? "fill-gold text-gold" : "fill-none text-gray-300"
                )}
              />
            ))}
            {rating > 0 && (
              <span className="ms-1 text-xs font-medium text-muted">{rating.toFixed(1)}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Users className="h-3 w-3" />
            {studentCount}
          </span>
        </div>

        {isEnrolled && progress > 0 && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-2 bg-gold-light/50" />
            <p className="text-end text-xs font-medium text-primary">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </Link>
  );
}
