import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useArchive } from "@/hooks/useArchive";
import { ArchiveForm } from "@/components/archive/ArchiveForm";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";

export function EditArchivePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: archive, isLoading, error, refetch } = useArchive(id!);

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (!archive) return <ErrorState title={t("archive.notFound")} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        {t("dashboard.archives.edit")}
      </h2>
      <ArchiveForm
        archiveId={id}
        initialData={{
          titleAr: archive.titleAr,
          titleEn: archive.titleEn,
          referenceNumber: archive.referenceNumber,
          description: archive.descriptionAr,
          date: archive.dateText,
          institution: archive.institutionName,
          institutionId: archive.institutionId,
          archivalUnitId: archive.archivalUnitId,
          creator: archive.creatorName,
          collection: archive.collectionName,
          materialType: archive.materialType,
          accessLevel: archive.accessLevel,
          rights: archive.rightsStatement,
          place: archive.place,
          language: archive.language,
          subjects: archive.subjects?.map((s) => s.subject).join(", "),
        }}
        onSuccess={() => navigate("/dashboard/archives")}
      />
    </div>
  );
}
