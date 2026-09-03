import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText, Image, Headphones, Video, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatFileSize, getFileExtension } from "@/lib/utils";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/constants";

interface FileItem {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  url?: string;
}

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  existingFiles?: FileItem[];
}

export function FileUploader({ onFilesChange, maxFiles = 10 }: FileUploaderProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <Image className="h-8 w-8" />;
    if (["mp3", "wav", "ogg"].includes(ext)) return <Headphones className="h-8 w-8" />;
    if (["mp4", "webm", "avi"].includes(ext)) return <Video className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return t("archive.fileTooLarge", { size: formatFileSize(MAX_FILE_SIZE) });
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return t("archive.fileTypeNotSupported");
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: FileItem[] = [];

      fileArray.forEach((file) => {
        if (files.length + validFiles.length >= maxFiles) return;

        const error = validateFile(file);
        validFiles.push({
          file,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          progress: 0,
          status: error ? "error" : "pending",
          error: error || undefined,
        });
      });

      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles.filter((f) => f.status !== "error").map((f) => f.file));
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((f) => f.id !== id);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles.filter((f) => f.status !== "error").map((f) => f.file));
    },
    [files, onFilesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted-bg"
        )}
      >
        <Upload className="mb-4 h-10 w-10 text-muted" />
        <p className="mb-2 text-sm font-medium text-foreground">
          {t("dashboard.newArchive.upload.dragDrop")}
        </p>
        <p className="mb-4 text-xs text-muted">
          {t("dashboard.newArchive.upload.maxSize")}
        </p>
        <Button type="button" variant="outline" size="sm">
          {t("dashboard.newArchive.upload.browse")}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(",")}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3",
                fileItem.status === "error" ? "border-destructive bg-red-50" : "border-border"
              )}
            >
              <div className="text-muted">{getFileIcon(fileItem.file.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                <p className="text-xs text-muted">{formatFileSize(fileItem.file.size)}</p>
                {fileItem.status === "uploading" && (
                  <Progress value={fileItem.progress} className="mt-2 h-1.5" />
                )}
                {fileItem.status === "error" && fileItem.error && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fileItem.error}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {fileItem.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(fileItem.id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { FileItem };
