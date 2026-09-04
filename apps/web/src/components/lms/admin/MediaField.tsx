import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { lmsApi, type UploadedMedia } from "@/api/lms";
import { getApiErrorMessage } from "@/lib/apiError";
import { resolveMediaUrl } from "@/api/files";
import { toast } from "sonner";

interface MediaFieldProps {
  label: string;
  hint?: string;
  accept: string;
  kind: "image" | "video" | "file";
  value?: string;
  fileName?: string;
  onUploaded: (media: UploadedMedia, file: File) => void;
  onCleared: () => void;
  disabled?: boolean;
}

/** A file picker that uploads straight away and previews what it stored. */
export function MediaField({
  label,
  hint,
  accept,
  kind,
  value,
  fileName,
  onUploaded,
  onCleared,
  disabled,
}: MediaFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setProgress(0);
    try {
      const media = await lmsApi.uploadMedia(file, setProgress);
      onUploaded(media, file);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProgress(null);
    }
  };

  const preview = resolveMediaUrl(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {value && !disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={onCleared} className="text-destructive">
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </Button>
        )}
      </div>

      {preview && kind === "image" && (
        <img src={preview} alt="" className="h-36 w-full rounded-xl border border-border object-cover" />
      )}
      {preview && kind === "video" && (
        <video src={preview} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" />
      )}
      {preview && kind === "file" && (
        <p className="truncate rounded-lg border border-border bg-muted-bg/50 px-3 py-2 text-sm text-muted">
          {fileName || preview}
        </p>
      )}

      {progress !== null ? (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("lms.admin.uploading", { percent: progress })}
          </p>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="me-1 h-4 w-4" />
            {value ? t("lms.admin.replaceFile") : t("lms.admin.chooseFile")}
          </Button>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}
