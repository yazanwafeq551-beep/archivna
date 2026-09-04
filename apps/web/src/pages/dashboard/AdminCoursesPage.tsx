import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { lmsApi, type Course } from "@/api/lms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { CourseEditor } from "@/components/lms/admin/CourseEditor";
import { getApiErrorMessage } from "@/lib/apiError";
import { resolveMediaUrl } from "@/api/files";
import { primaryText } from "@/lib/utils";

export function AdminCoursesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{ courseId?: string } | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: lmsApi.getAdminCourses,
  });

  const deleteCourse = useMutation({
    mutationFn: lmsApi.deleteAdminCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setCourseToDelete(null);
      toast.success(t("lms.admin.deleted"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (editing) {
    return (
      <div className="space-y-6">
        <CourseEditor
          courseId={editing.courseId}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            {t("lms.admin.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("lms.admin.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus className="me-1 h-4 w-4" />
          {t("lms.admin.newCourse")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-gold" />
            {t("lms.admin.allCourses")}
            <Badge variant="secondary">{courses.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-muted-bg/60" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              title={t("lms.admin.emptyTitle")}
              description={t("lms.admin.emptyDesc")}
              icon={<BookOpenCheck className="h-9 w-9" strokeWidth={1.5} />}
              action={{ label: t("lms.admin.newCourse"), onClick: () => setEditing({}) }}
            />
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                {course.thumbnailUrl ? (
                  <img
                    src={resolveMediaUrl(course.thumbnailUrl)}
                    alt=""
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-24 place-items-center rounded-lg bg-primary/10">
                    <BookOpenCheck className="h-6 w-6 text-primary" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {primaryText(course.titleAr, course.titleEn)}
                    </h3>
                    <Badge variant={course.status === "published" ? "success" : "warning"}>
                      {t(
                        course.status === "published"
                          ? "lms.admin.statusPublished"
                          : "lms.admin.statusDraft"
                      )}
                    </Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span>{course.instructorName}</span>
                    <span>
                      {t("lms.admin.lessonsCount", { count: course._count?.lessons ?? 0 })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course._count?.enrollments ?? 0}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/lms/courses/${course.slug}`}>{t("lms.admin.view")}</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ courseId: course.id })}
                    aria-label={t("lms.admin.editCourse")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setCourseToDelete(course)}
                    aria-label={t("lms.admin.deleteCourse")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!courseToDelete}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
        title={t("lms.admin.deleteCourse")}
        description={t("lms.admin.deleteWarning", {
          title: courseToDelete?.titleAr ?? "",
        })}
        confirmLabel={t("lms.admin.deleteCourse")}
        variant="destructive"
        isLoading={deleteCourse.isPending}
        onConfirm={() => courseToDelete && deleteCourse.mutate(courseToDelete.id)}
      />
    </div>
  );
}
