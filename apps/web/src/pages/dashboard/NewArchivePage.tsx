import { useTranslation } from "react-i18next";
import { ArchiveForm } from "@/components/archive/ArchiveForm";
import { useNavigate } from "react-router-dom";

export function NewArchivePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        {t("dashboard.newArchive.title")}
      </h2>
      <ArchiveForm onSuccess={() => navigate("/dashboard/archives")} />
    </div>
  );
}
