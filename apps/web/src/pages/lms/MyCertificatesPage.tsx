import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Award, Printer } from "lucide-react";
import { lmsApi } from "@/api/lms";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/shared";
import { formatDate, primaryText } from "@/lib/utils";

export function MyCertificatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => lmsApi.getMyCertificates(),
  });

  if (isLoading) {
    return (
      <div className="grid animate-pulse gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-32 rounded-xl bg-gold-light/30" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t("lms.dashboard.errorTitle")}
        message={t("lms.dashboard.errorMessage")}
        onRetry={() => refetch()}
      />
    );
  }

  const certificates = data ?? [];

  if (certificates.length === 0) {
    return (
      <EmptyState
        title={t("lms.certificate.empty")}
        description={t("lms.certificate.emptyDesc")}
        icon={<Award className="h-9 w-9" strokeWidth={1.5} />}
        action={{ label: t("lms.dashboard.browseCourses"), onClick: () => navigate("/lms") }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("lms.certificate.myCertificates")}
        </h1>
        <p className="text-sm text-muted">{t("lms.certificate.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {certificates.map((certificate) => (
          <Card key={certificate.id} className="overflow-hidden">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-light/40 text-gold-deep">
                <Award className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">
                  {primaryText(certificate.courseTitleAr, certificate.courseTitleEn)}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {t("lms.certificate.issuedOn")}: {formatDate(certificate.issuedAt)}
                </p>
                <p className="mt-1 font-mono text-xs text-muted" dir="ltr">
                  {certificate.serial}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link to={`/certificates/${certificate.serial}`}>
                      <Printer className="me-1 h-4 w-4" />
                      {t("lms.certificate.view")}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
