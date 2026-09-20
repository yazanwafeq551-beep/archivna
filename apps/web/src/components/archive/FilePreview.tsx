import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFileSize, isImageFile, isPdfFile, isAudioFile, isVideoFile } from "@/lib/utils";
import { filesApi } from "@/api/files";
import type { ArchiveFile } from "@/api/archives";
import { isNative } from "@/lib/platform";

interface FilePreviewProps {
  file: ArchiveFile;
  canAccess?: boolean;
  allowDownload?: boolean;
  watermarkLabel?: string;
  protectedAccess?: boolean;
}

export function FilePreview({ file, canAccess = true, allowDownload = true, watermarkLabel, protectedAccess = false }: FilePreviewProps) {
  const { t } = useTranslation();
  const [protectedUrl, setProtectedUrl] = useState<string>();
  const directUrl = file.secureUrl || (file as ArchiveFile & { thumbnailUrl?: string }).thumbnailUrl || filesApi.getDownloadUrl(file.id);
  const fileUrl = protectedAccess ? protectedUrl : directUrl;

  useEffect(() => {
    if (!protectedAccess || !canAccess) return;
    let active = true;
    let objectUrl: string | undefined;
    filesApi.getContentBlob(file.id).then((url) => {
      objectUrl = url;
      if (active) setProtectedUrl(url);
      else URL.revokeObjectURL(url);
    }).catch(() => {
      if (active) setProtectedUrl(undefined);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [canAccess, file.id, protectedAccess]);

  const handleDownload = async () => {
    await filesApi.download(file.id, file.originalFilename);
  };

  const filename = file.originalFilename;
  const watermark = watermarkLabel ? (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-hidden" aria-hidden="true">
      <span className="-rotate-12 select-none rounded border border-white/40 bg-primary/45 px-5 py-2 text-sm font-semibold tracking-widest text-white shadow">{watermarkLabel}</span>
    </div>
  ) : null;

  if (!canAccess) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center bg-muted-bg">
        <div className="mb-4 rounded-full bg-surface p-4 shadow-sm">
          <svg className="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm text-muted">{t("archive.restrictedFile")}</p>
      </Card>
    );
  }

  if (protectedAccess && !fileUrl) {
    return (
      <Card className="flex min-h-64 items-center justify-center bg-muted-bg p-8 text-center">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </Card>
    );
  }

  if (isImageFile(filename)) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
        {watermark}
        <img
          src={fileUrl}
          alt={filename}
          className="w-full h-auto max-h-[600px] object-contain"
          loading="lazy"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white truncate">{filename}</span>
            {allowDownload && <Button size="sm" variant="secondary" onClick={handleDownload}>
              <Download className="ms-1 h-4 w-4" />
              {t("archive.detail.download")}
            </Button>}
          </div>
        </div>
      </div>
    );
  }

  if (isPdfFile(filename)) {
    // A web view renders an <iframe> of a PDF as a blank rectangle - no
    // viewer, no error, nothing to tap. The device has a document reader
    // already, so the app hands the file to it rather than pretending.
    if (isNative()) {
      return (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="rounded-full bg-primary/10 p-5">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <p className="truncate text-sm font-medium text-foreground">{filename}</p>
          <p className="text-xs text-muted">{t("archive.detail.openDocumentHint")}</p>
          <Button onClick={handleDownload}>
            <FileText className="me-1 h-4 w-4" />
            {t("archive.detail.openDocument")}
          </Button>
        </Card>
      );
    }

    return (
      <div className="relative rounded-lg border border-border overflow-hidden bg-surface">
        {watermark}
        <iframe
          src={fileUrl}
          className="w-full h-[600px]"
          title={filename}
        />
        <div className="flex items-center justify-between border-t border-border p-3">
          <span className="text-sm text-muted truncate">{filename}</span>
          {allowDownload && <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="ms-1 h-4 w-4" />
            {t("archive.detail.download")}
          </Button>}
        </div>
      </div>
    );
  }

  if (isAudioFile(filename)) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-6">
            <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="w-full max-w-md">
            <audio controls className="w-full" preload="metadata">
              <source src={fileUrl} />
              {t("archive.browserNoAudio")}
            </audio>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{filename}</p>
            <p className="text-xs text-muted">{formatFileSize(file.fileSize)}</p>
          </div>
          {allowDownload && <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="ms-1 h-4 w-4" />
            {t("archive.detail.download")}
          </Button>}
        </div>
      </Card>
    );
  }

  if (isVideoFile(filename)) {
    return (
      <div className="relative rounded-lg border border-border overflow-hidden bg-black">
        {watermark}
        <video controls className="w-full max-h-[600px]" preload="metadata">
          <source src={fileUrl} />
          {t("archive.browserNoVideo")}
        </video>
        <div className="flex items-center justify-between border-t border-border bg-surface p-3">
          <span className="text-sm text-muted truncate">{filename}</span>
          {allowDownload && <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="ms-1 h-4 w-4" />
            {t("archive.detail.download")}
          </Button>}
        </div>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted-bg p-4">
        <svg className="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="mb-1 text-sm font-medium">{filename}</p>
      <p className="mb-4 text-xs text-muted">{formatFileSize(file.fileSize)}</p>
      {allowDownload && <Button onClick={handleDownload}>
        <Download className="ms-1 h-4 w-4" />
        {t("archive.detail.download")}
      </Button>}
    </Card>
  );
}
