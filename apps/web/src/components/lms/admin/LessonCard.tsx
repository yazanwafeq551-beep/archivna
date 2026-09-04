import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, GripVertical, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaField } from "./MediaField";
import { readVideoDuration } from "@/lib/videoPoster";
import type { LessonInput, UploadedMedia } from "@/api/lms";

export interface LessonDraft extends LessonInput {
  /** Present once the lesson exists on the server. */
  id?: string;
  key: string;
  videoFileName?: string;
}

interface LessonCardProps {
  lesson: LessonDraft;
  index: number;
  total: number;
  onChange: (patch: Partial<LessonDraft>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onVideoPicked?: (file: File, media: UploadedMedia) => void;
}

export function LessonCard({
  lesson,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onVideoPicked,
}: LessonCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted" />
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
            {t("lms.admin.lessonNumber", { number: index + 1 })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={t("lms.admin.moveUp")}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label={t("lms.admin.moveDown")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            disabled={total === 1}
            onClick={onRemove}
            aria-label={t("lms.admin.removeLesson")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={`${t("lms.admin.lessonTitleAr")} *`}
          value={lesson.titleAr}
          onChange={(event) => onChange({ titleAr: event.target.value })}
          required
        />
        <Input
          label={t("lms.admin.lessonTitleEn")}
          value={lesson.titleEn || ""}
          onChange={(event) => onChange({ titleEn: event.target.value })}
          dir="ltr"
        />
      </div>

      <Textarea
        label={t("lms.admin.lessonContent")}
        className="mt-4 min-h-28"
        value={lesson.contentAr || ""}
        onChange={(event) => onChange({ contentAr: event.target.value })}
      />

      <Textarea
        label={t("lms.admin.lessonSummary")}
        className="mt-4"
        value={lesson.summaryAr || ""}
        onChange={(event) => onChange({ summaryAr: event.target.value })}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MediaField
          label={t("lms.admin.lessonVideo")}
          hint={t("lms.admin.lessonVideoHint")}
          accept="video/mp4,video/webm,video/quicktime"
          kind="video"
          value={lesson.videoUrl}
          onUploaded={async (media, file) => {
            const duration = await readVideoDuration(file);
            onChange({
              videoUrl: media.url,
              videoDuration: duration || undefined,
              videoFileName: file.name,
            });
            onVideoPicked?.(file, media);
          }}
          onCleared={() =>
            onChange({ videoUrl: "", videoDuration: undefined, videoFileName: undefined })
          }
        />

        <div className="space-y-4">
          <Input
            label={t("lms.admin.readingMinutes")}
            type="number"
            min={0}
            value={lesson.estimatedReadingTime ?? ""}
            onChange={(event) =>
              onChange({
                estimatedReadingTime: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />

          <MediaField
            label={t("lms.admin.lessonAttachment")}
            hint={t("lms.admin.lessonAttachmentHint")}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            kind="file"
            value={lesson.attachments?.[0]?.url}
            fileName={lesson.attachments?.[0]?.titleAr}
            onUploaded={(media, file) =>
              onChange({
                attachments: [
                  {
                    titleAr: file.name,
                    url: media.url,
                    type: "document",
                    mimeType: media.mimeType,
                    fileSize: media.fileSize,
                  },
                ],
              })
            }
            onCleared={() => onChange({ attachments: [] })}
          />
        </div>
      </div>

      {lesson.attachments && lesson.attachments.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Paperclip className="h-3 w-3" />
          {lesson.attachments[0].titleAr}
        </p>
      )}
    </div>
  );
}
