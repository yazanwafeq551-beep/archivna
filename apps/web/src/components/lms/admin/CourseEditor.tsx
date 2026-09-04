import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Plus, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LessonCard, type LessonDraft } from "./LessonCard";
import { MediaField } from "./MediaField";
import { lmsApi, type Course, type CreateCourseInput, type LessonInput } from "@/api/lms";
import { getApiErrorMessage } from "@/lib/apiError";
import { captureVideoStill, dataUrlToFile, generateCoverDataUrl } from "@/lib/videoPoster";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

const emptyLesson = (): LessonDraft => ({
  key: Math.random().toString(36).slice(2),
  titleAr: "",
  titleEn: "",
  contentAr: "",
  summaryAr: "",
  attachments: [],
});

interface CourseEditorProps {
  /** Editing an existing course when set. */
  courseId?: string;
  onDone: () => void;
  onCancel: () => void;
}

export function CourseEditor({ courseId, onDone, onCancel }: CourseEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(courseId);

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [shortDescAr, setShortDescAr] = useState("");
  const [fullDescAr, setFullDescAr] = useState("");
  const [difficulty, setDifficulty] = useState<string>("beginner");
  const [categoryId, setCategoryId] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [autoCover, setAutoCover] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [lessons, setLessons] = useState<LessonDraft[]>([emptyLesson()]);
  const [removedLessonIds, setRemovedLessonIds] = useState<string[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: ["courseCategories"],
    queryFn: () => lmsApi.getCategories(),
  });

  const { data: existing } = useQuery({
    queryKey: ["admin-course", courseId],
    queryFn: () => lmsApi.getAdminCourse(courseId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!existing) return;
    setTitleAr(existing.titleAr);
    setTitleEn(existing.titleEn || "");
    setInstructorName(existing.instructorName);
    setShortDescAr(existing.shortDescAr || "");
    setFullDescAr(existing.fullDescAr || "");
    setDifficulty(existing.difficulty || "beginner");
    setCategoryId(existing.categoryId || "");
    setThumbnailUrl(existing.thumbnailUrl || "");
    setStatus((existing.status as "draft" | "published") || "published");
    setLessons(
      (existing.lessons || []).map((lesson) => ({
        key: lesson.id,
        id: lesson.id,
        titleAr: lesson.titleAr,
        titleEn: lesson.titleEn || "",
        contentAr: lesson.contentAr || "",
        summaryAr: lesson.summaryAr || "",
        videoUrl: lesson.videoUrl || "",
        videoDuration: lesson.videoDuration || undefined,
        estimatedReadingTime: lesson.estimatedReadingTime || undefined,
        attachments: (lesson.attachments || []).map((attachment) => ({
          titleAr: attachment.titleAr,
          url: attachment.url,
          type: attachment.type,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
        })),
      }))
    );
  }, [existing]);

  const patchLesson = (index: number, patch: Partial<LessonDraft>) =>
    setLessons((current) =>
      current.map((lesson, position) =>
        position === index ? { ...lesson, ...patch } : lesson
      )
    );

  const moveLesson = (index: number, direction: -1 | 1) =>
    setLessons((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removeLesson = (index: number) =>
    setLessons((current) => {
      const lesson = current[index];
      if (lesson.id) setRemovedLessonIds((ids) => [...ids, lesson.id!]);
      return current.filter((_, position) => position !== index);
    });

  /**
   * A course with no cover of its own gets a frame from its first video, so
   * listings never show an empty box.
   */
  const suggestCoverFromVideo = async (file: File) => {
    if (thumbnailUrl) return;
    const still = await captureVideoStill(file);
    if (!still) return;

    try {
      const media = await lmsApi.uploadMedia(still.file);
      setThumbnailUrl(media.url);
      setAutoCover(true);
      toast.success(t("lms.admin.coverFromVideo"));
    } catch {
      // Not worth interrupting the admin: the cover stays optional.
    }
  };

  const buildGeneratedCover = async () => {
    const dataUrl = generateCoverDataUrl(titleAr || titleEn || "أرشيفنا");
    if (!dataUrl) return undefined;
    const file = await dataUrlToFile(dataUrl, "course-cover.jpg");
    const media = await lmsApi.uploadMedia(file);
    return media.url;
  };

  const toLessonInput = (lesson: LessonDraft): LessonInput => ({
    titleAr: lesson.titleAr,
    titleEn: lesson.titleEn || undefined,
    contentAr: lesson.contentAr || undefined,
    summaryAr: lesson.summaryAr || undefined,
    videoUrl: lesson.videoUrl || undefined,
    videoDuration: lesson.videoDuration,
    estimatedReadingTime: lesson.estimatedReadingTime,
    attachments: lesson.attachments?.length ? lesson.attachments : undefined,
  });

  const save = useMutation({
    mutationFn: async () => {
      // Every course ends up with a cover, even if nobody supplied one.
      const cover = thumbnailUrl || (await buildGeneratedCover()) || "";

      const base: Omit<CreateCourseInput, "lessons"> = {
        titleAr,
        titleEn: titleEn || undefined,
        instructorName,
        shortDescAr: shortDescAr || undefined,
        fullDescAr: fullDescAr || undefined,
        thumbnailUrl: cover || undefined,
        categoryId: categoryId || undefined,
        difficulty,
        status,
      };

      if (!isEditing) {
        return lmsApi.createAdminCourse({ ...base, lessons: lessons.map(toLessonInput) });
      }

      await lmsApi.updateAdminCourse(courseId!, base);
      for (const lessonId of removedLessonIds) {
        await lmsApi.deleteLesson(courseId!, lessonId);
      }

      const savedIds: string[] = [];
      for (const lesson of lessons) {
        if (lesson.id) {
          await lmsApi.updateLesson(courseId!, lesson.id, toLessonInput(lesson));
          savedIds.push(lesson.id);
        } else {
          const created = await lmsApi.addLesson(courseId!, toLessonInput(lesson));
          savedIds.push(created.id);
        }
      }

      // The list on screen is the intended order.
      return lmsApi.reorderLessons(courseId!, savedIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-course", courseId] });
      toast.success(isEditing ? t("lms.admin.updated") : t("lms.admin.created"));
      onDone();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!titleAr.trim() || !instructorName.trim()) {
      toast.error(t("lms.admin.missingCourseFields"));
      return;
    }
    if (lessons.some((lesson) => !lesson.titleAr.trim())) {
      toast.error(t("lms.admin.missingLessonTitle"));
      return;
    }
    save.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-gold" />
            {isEditing ? t("lms.admin.editCourse") : t("lms.admin.newCourse")}
          </CardTitle>
          <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label={t("common.cancel")}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={`${t("lms.admin.courseTitleAr")} *`}
              value={titleAr}
              onChange={(event) => setTitleAr(event.target.value)}
              required
            />
            <Input
              label={t("lms.admin.courseTitleEn")}
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              dir="ltr"
            />
            <Input
              label={`${t("lms.admin.instructor")} *`}
              value={instructorName}
              onChange={(event) => setInstructorName(event.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("lms.admin.difficulty")}
              </label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((level) => (
                    <SelectItem key={level} value={level}>
                      {t(`lms.difficulty.${level}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("lms.admin.category")}
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("lms.admin.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Textarea
            label={t("lms.admin.shortDescription")}
            value={shortDescAr}
            onChange={(event) => setShortDescAr(event.target.value)}
          />
          <Textarea
            label={t("lms.admin.fullDescription")}
            className="min-h-28"
            value={fullDescAr}
            onChange={(event) => setFullDescAr(event.target.value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <MediaField
                label={t("lms.admin.cover")}
                hint={t("lms.admin.coverHint")}
                accept="image/jpeg,image/png,image/webp"
                kind="image"
                value={thumbnailUrl}
                onUploaded={(media) => {
                  setThumbnailUrl(media.url);
                  setAutoCover(false);
                }}
                onCleared={() => {
                  setThumbnailUrl("");
                  setAutoCover(false);
                }}
              />
              {autoCover && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                  <Sparkles className="h-3 w-3" />
                  {t("lms.admin.coverFromVideo")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("lms.admin.status")}
              </label>
              <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">{t("lms.admin.statusPublished")}</SelectItem>
                  <SelectItem value="draft">{t("lms.admin.statusDraft")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted">{t("lms.admin.statusHint")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {t("lms.admin.lessons")} ({lessons.length})
          </h3>
          <Button type="button" variant="outline" onClick={() => setLessons((c) => [...c, emptyLesson()])}>
            <Plus className="me-1 h-4 w-4" />
            {t("lms.admin.addLesson")}
          </Button>
        </div>

        {lessons.map((lesson, index) => (
          <LessonCard
            key={lesson.key}
            lesson={lesson}
            index={index}
            total={lessons.length}
            onChange={(patch) => patchLesson(index, patch)}
            onRemove={() => removeLesson(index)}
            onMove={(direction) => moveLesson(index, direction)}
            onVideoPicked={index === 0 ? (file) => suggestCoverFromVideo(file) : undefined}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={save.isPending}>
          <Save className="me-1 h-4 w-4" />
          {isEditing ? t("lms.admin.saveChanges") : t("lms.admin.publishCourse")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
