import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PUBLIC_WEB_ORIGIN } from "@/lib/constants";
import { Heart, Link2, Download, Edit, Calendar, Building, User, Tag, MapPin, Globe, Lock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingSpinner, PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { FilePreview } from "@/components/archive/FilePreview";
import { AccessBadge } from "@/components/archive/AccessBadge";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { useArchive, useRelatedArchives } from "@/hooks/useArchive";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "@/api/favorites";
import { filesApi } from "@/api/files";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatFileSize, primaryText, secondaryText } from "@/lib/utils";
import { canEditArchive } from "@/lib/permissions";
import { toast } from "sonner";
import { governanceApi } from "@/api/governance";
import { Textarea } from "@/components/ui/textarea";

export function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [accessReason, setAccessReason] = useState("");

  const { data: archive, isLoading, error, refetch } = useArchive(id!);
  const { data: relatedArchives } = useRelatedArchives(id!, 4);

  const { data: favData } = useQuery({
    queryKey: ["favorite", id],
    queryFn: () => favoritesApi.check(id!),
    enabled: isAuthenticated && !!id,
  });

  const toggleFavorite = useMutation({
    mutationFn: () => favoritesApi.toggle(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(["favorite", id], { isFavorite: data.isFavorite });
      toast.success(data.isFavorite ? t("archive.addFavorite") : t("archive.removeFavorite"));
    },
  });

  const requestAccess = useMutation({
    mutationFn: () => governanceApi.requestAccess(id!, { reason: accessReason }),
    onSuccess: () => {
      setAccessReason("");
      toast.success(t("archive.accessRequestSent"));
    },
    onError: () => toast.error(t("archive.accessRequestError")),
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${PUBLIC_WEB_ORIGIN}${window.location.pathname}`);
    toast.success(t("common.copied"));
  };

  const handleDownload = async (fileId: string, filename: string) => {
    await filesApi.download(fileId, filename);
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (!archive) return <ErrorState title={t("archive.notFound")} />;

  const canAccessFile = archive.accessGranted ?? (archive.accessLevel === "public" || user?.id === archive.ownerId);
  const canEdit = canEditArchive(user, archive);
  const allowDownload = archive.accessLevel === "public" || canEdit;

  return (
    <div className="container-app py-8">
      <Breadcrumbs
        items={[
          { label: t("nav.search"), href: "/search" },
          { label: primaryText(archive.titleAr, archive.titleEn) },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Preview */}
        <div className="lg:col-span-2 space-y-6">
          {archive.files && archive.files.length > 0 ? (
            <FilePreview file={archive.files[0]} canAccess={canAccessFile} allowDownload={allowDownload} protectedAccess={archive.accessLevel !== "public"} watermarkLabel={canAccessFile && archive.accessPolicy?.watermarkEnabled && !canEdit ? `ARSHEEFNA · ${user?.email || "ACCESS COPY"}` : undefined} />
          ) : (
            <Card className="flex items-center justify-center h-64 bg-muted-bg">
              <p className="text-muted">{t("archive.noFiles")}</p>
            </Card>
          )}

          {archive.files && archive.files.length > 1 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("archive.allFiles")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {archive.files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleDownload(file.id, file.originalFilename)}
                    className="rounded-lg border border-border p-3 text-start hover:bg-muted-bg transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{file.originalFilename}</p>
                    <p className="text-xs text-muted">{formatFileSize(file.fileSize)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {primaryText(archive.descriptionAr, archive.descriptionEn) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 font-semibold text-foreground">{t("archive.detail.description")}</h3>
                <p className="text-muted leading-relaxed">
                  {primaryText(archive.descriptionAr, archive.descriptionEn)}
                </p>
              </CardContent>
            </Card>
          )}

          {!canAccessFile && archive.accessLevel === "sensitive" && (
            <Card className="border-gold/30 bg-gold-light/10">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-gold-dark" />
                  <div>
                    <h3 className="font-semibold">{t("archive.requestAccessTitle")}</h3>
                    <p className="mt-1 text-sm text-muted">{t("archive.requestAccessDescription")}</p>
                  </div>
                </div>
                {isAuthenticated ? (
                  <>
                    <Textarea value={accessReason} onChange={(event) => setAccessReason(event.target.value)} placeholder={t("archive.accessReasonPlaceholder")} rows={3} />
                    <Button onClick={() => requestAccess.mutate()} disabled={accessReason.trim().length < 10 || requestAccess.isPending}>
                      {t("archive.sendAccessRequest")}
                    </Button>
                  </>
                ) : (
                  <Button asChild><Link to="/login">{t("archive.loginToRequest")}</Link></Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          {/* Title & Actions */}
          <div>
            <h1 className="mb-2 text-2xl font-heading font-bold text-foreground">
              {primaryText(archive.titleAr, archive.titleEn)}
            </h1>
            {secondaryText(archive.titleAr, archive.titleEn) && (
              <p className="text-lg text-muted">
                {secondaryText(archive.titleAr, archive.titleEn)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AccessBadge level={archive.accessLevel} />
              <Badge variant="secondary">{t("materialTypes." + archive.materialType)}</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isAuthenticated && (
              <Button
                variant={favData?.isFavorite ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFavorite.mutate()}
                disabled={toggleFavorite.isPending}
              >
                <Heart className={`ms-1 h-4 w-4 ${favData?.isFavorite ? "fill-current" : ""}`} />
                {favData?.isFavorite ? t("archive.detail.unfavorite") : t("archive.detail.favorite")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Link2 className="ms-1 h-4 w-4" />
              {t("archive.detail.copyLink")}
            </Button>
            {canAccessFile && allowDownload && archive.files?.[0] && (
              <Button variant="outline" size="sm" onClick={() => handleDownload(archive.files[0].id, archive.files[0].originalFilename)}>
                <Download className="ms-1 h-4 w-4" />
                {t("archive.detail.download")}
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/dashboard/archives/${archive.id}/edit`}>
                  <Edit className="ms-1 h-4 w-4" />
                  {t("archive.detail.edit")}
                </Link>
              </Button>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {archive.referenceNumber && (
                <div>
                  <span className="text-xs text-muted">{t("archive.detail.reference")}</span>
                  <p className="text-sm font-medium ltr">{archive.referenceNumber}</p>
                </div>
              )}
              {archive.creatorName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <span className="text-xs text-muted">{t("archive.detail.creator")}</span>
                    <p className="text-sm font-medium">{archive.creatorName}</p>
                  </div>
                </div>
              )}
              {(archive.institution?.nameAr || archive.institutionName) && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <span className="text-xs text-muted">{t("archive.detail.institution")}</span>
                    <p className="text-sm font-medium">{archive.institution?.nameAr || archive.institutionName}</p>
                  </div>
                </div>
              )}
              {archive.archivalUnit && (
                <div>
                  <span className="text-xs text-muted">{t("archive.archivalContext")}</span>
                  <p className="text-sm font-medium">{archive.archivalUnit.titleAr}{archive.archivalUnit.referenceCode ? ` · ${archive.archivalUnit.referenceCode}` : ""}</p>
                </div>
              )}
              {archive.collectionName && (
                <div>
                  <span className="text-xs text-muted">{t("archive.detail.collection")}</span>
                  <p className="text-sm font-medium">{archive.collectionName}</p>
                </div>
              )}
              {archive.dateText && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <span className="text-xs text-muted">{t("archive.detail.date")}</span>
                    <p className="text-sm font-medium">{formatDate(archive.dateText)}</p>
                  </div>
                </div>
              )}
              {archive.place && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <span className="text-xs text-muted">{t("archive.detail.place")}</span>
                    <p className="text-sm font-medium">{archive.place}</p>
                  </div>
                </div>
              )}
              {archive.language && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <span className="text-xs text-muted">{t("archive.detail.language")}</span>
                    <p className="text-sm font-medium">{archive.language}</p>
                  </div>
                </div>
              )}
              {archive.subjects && archive.subjects.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted">{t("archive.detail.subjects")}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {archive.subjects.map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">
                          {s.subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {archive.rightsStatement && (
                <div>
                  <span className="text-xs text-muted">{t("archive.detail.rights")}</span>
                  <p className="text-sm font-medium">{archive.rightsStatement}</p>
                </div>
              )}
              <Separator />
              <div>
                <span className="text-xs text-muted">{t("archive.detail.owner")}</span>
                <p className="text-sm font-medium">{archive.owner?.fullName || "-"}</p>
              </div>
              <div>
                <span className="text-xs text-muted">{t("archive.detail.created")}</span>
                <p className="text-sm font-medium">{formatDate(archive.createdAt)}</p>
              </div>
              {archive.publishedAt && (
                <div>
                  <span className="text-xs text-muted">{t("archive.detail.published")}</span>
                  <p className="text-sm font-medium">{formatDate(archive.publishedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Archives */}
      {Array.isArray(relatedArchives) && relatedArchives.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-heading font-bold text-foreground">
            {t("archive.detail.related")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedArchives.map((archive) => (
              <ArchiveCard key={archive.id} archive={archive} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
