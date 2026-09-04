import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Image, Headphones, Video, Map, ScrollText, Calendar, Building } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessBadge } from "./AccessBadge";
import { filesApi, resolveMediaUrl } from "@/api/files";
import { formatDate, truncateText } from "@/lib/utils";
import type { Archive } from "@/api/archives";

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  audio: <Headphones className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  map: <Map className="h-5 w-5" />,
  manuscript: <ScrollText className="h-5 w-5" />,
};

interface ArchiveCardProps {
  archive: Archive;
  viewMode?: "grid" | "list";
}

export function ArchiveCard({ archive, viewMode = "grid" }: ArchiveCardProps) {
  const { t } = useTranslation();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const firstFile = archive.files?.[0];
  const playableFile = archive.files?.find((file) => {
    if (archive.materialType === "video") return file.mimeType?.startsWith("video/");
    if (archive.materialType === "audio") return file.mimeType?.startsWith("audio/");
    if (["image", "map"].includes(archive.materialType)) return file.mimeType?.startsWith("image/") && file.secureUrl?.includes("/real/");
    return false;
  });
  const playableUrl = resolveMediaUrl(playableFile?.secureUrl);
  const rawThumbnailUrl = playableFile?.mimeType?.startsWith("image/")
    ? playableFile.secureUrl
    : firstFile?.thumbnailPath || (firstFile as typeof firstFile & { thumbnailUrl?: string })?.thumbnailUrl || (firstFile?.mimeType?.startsWith("image/") ? firstFile.secureUrl : undefined);
  // Falling back to the download URL only makes sense for images; pointing an
  // <img> at an audio or video file just renders a broken-image icon.
  const canStreamFirstFile =
    !!firstFile &&
    firstFile.mimeType?.startsWith("image/") &&
    (archive.accessLevel === "public" || archive.accessGranted);
  const resolvedThumbnail =
    resolveMediaUrl(rawThumbnailUrl) ||
    (canStreamFirstFile ? filesApi.getDownloadUrl(firstFile.id) : undefined);
  const thumbnailUrl = thumbnailFailed ? undefined : resolvedThumbnail;

  const stopCardNavigation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const media = (compact = false) => {
    if (archive.materialType === "video" && playableUrl) {
      return <video src={playableUrl} controls preload="metadata" playsInline className="h-full w-full bg-black object-contain" onClick={stopCardNavigation} />;
    }
    if (archive.materialType === "audio" && playableUrl) {
      return (
        <div className="relative flex h-full w-full items-end overflow-hidden bg-primary/10 p-3">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              onError={() => setThumbnailFailed(true)}
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
          <audio src={playableUrl} controls preload="metadata" className="relative z-10 h-10 w-full" onClick={stopCardNavigation} />
        </div>
      );
    }
    if (thumbnailUrl) {
      return (
        <img
          src={thumbnailUrl}
          alt={archive.titleAr}
          loading="lazy"
          onError={() => setThumbnailFailed(true)}
          className={`h-full w-full object-cover ${compact ? "" : "transition-transform duration-700 group-hover:scale-105"}`}
        />
      );
    }
    return (
      <div className="paper-surface flex h-full items-center justify-center text-primary/45">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-gold/30 bg-surface/70">
          {typeIcons[archive.materialType] || <FileText className="h-12 w-12" />}
        </div>
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <Link to={`/archives/${archive.id}`} className="block">
        <Card className="hover-card overflow-hidden">
          <div className="flex">
            <div className="h-32 w-32 shrink-0 bg-muted-bg flex items-center justify-center">
              {media(true)}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground line-clamp-1">{archive.titleAr}</h3>
                  {archive.titleEn && (
                    <p className="text-sm text-muted line-clamp-1 ltr">{archive.titleEn}</p>
                  )}
                </div>
                <AccessBadge level={archive.accessLevel} />
              </div>
              {archive.descriptionAr && (
                <p className="mt-2 text-sm text-muted line-clamp-2">{truncateText(archive.descriptionAr, 120)}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                <Badge variant="secondary">{t("materialTypes." + archive.materialType)}</Badge>
                {archive.institutionName && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {archive.institutionName}
                  </span>
                )}
                {archive.dateText && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(archive.dateText)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/archives/${archive.id}`} className="block">
      <Card className="group hover-card overflow-hidden h-full">
        <div className="relative h-48 bg-muted-bg">
          {media()}
          <div className="absolute top-2 end-2">
            <AccessBadge level={archive.accessLevel} />
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-1">{archive.titleAr}</h3>
          {archive.titleEn && (
            <p className="text-sm text-muted line-clamp-1 ltr">{archive.titleEn}</p>
          )}
          {archive.descriptionAr && (
            <p className="mt-2 text-sm text-muted line-clamp-2">{truncateText(archive.descriptionAr, 100)}</p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <Badge variant="secondary">{t("materialTypes." + archive.materialType)}</Badge>
          {archive.dateText && (
            <span className="text-xs text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(archive.dateText)}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
