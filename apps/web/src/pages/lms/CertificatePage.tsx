import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Award, BadgeCheck, Printer } from "lucide-react";
import { lmsApi } from "@/api/lms";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { Logo } from "@/components/shared/Logo";
import { formatDate, primaryText } from "@/lib/utils";

/**
 * The printable certificate. Anyone holding the serial can open this page,
 * which is what makes it verifiable.
 */
export function CertificatePage() {
  const { serial } = useParams<{ serial: string }>();
  const { t, i18n } = useTranslation();

  const { data: certificate, isLoading, isError } = useQuery({
    queryKey: ["certificate", serial],
    queryFn: () => lmsApi.verifyCertificate(serial!),
    enabled: !!serial,
    retry: false,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !certificate) {
    return (
      <div className="container-app py-16">
        <ErrorState
          title={t("lms.certificate.notFound")}
          message={t("lms.certificate.notFoundDesc")}
        />
      </div>
    );
  }

  const courseTitle = primaryText(certificate.courseTitleAr, certificate.courseTitleEn);
  const verificationUrl = `${window.location.origin}/certificates/${certificate.serial}`;

  return (
    <div className="container-app py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-primary">
          <BadgeCheck className="h-5 w-5" />
          {t("lms.certificate.verified")}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="me-1 h-4 w-4" />
            {t("lms.certificate.print")}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/learning/certificates">
              {t("lms.certificate.backToLearning")}
            </Link>
          </Button>
        </div>
      </div>

      {/* The sheet keeps its light colours in dark mode and on paper. */}
      <article
        className="print-sheet mx-auto max-w-4xl rounded-3xl border-[6px] border-double p-8 text-center sm:p-14"
        style={{ borderColor: "#C6A15B", background: "#FBF8F1", color: "#1D2C29" }}
        dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}
      >
        <div className="mb-8 flex items-center justify-center">
          <Logo variant="full" size="md" />
        </div>

        <div
          className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(198,161,91,.18)" }}
        >
          <Award className="h-8 w-8" style={{ color: "#A9853F" }} />
        </div>

        <h1 className="font-heading text-3xl font-bold sm:text-4xl" style={{ color: "#0F4C45" }}>
          {t("lms.certificate.title")}
        </h1>

        <p className="mt-8 text-base" style={{ color: "#5B6764" }}>
          {t("lms.certificate.awardedTo")}
        </p>
        <p className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
          {certificate.recipientName}
        </p>

        <p className="mt-6 text-base" style={{ color: "#5B6764" }}>
          {t("lms.certificate.hasCompleted")}
        </p>
        <p className="mt-2 font-heading text-2xl font-semibold" style={{ color: "#0F4C45" }}>
          {courseTitle}
        </p>

        <div
          className="mx-auto mt-10 grid max-w-2xl gap-4 border-t pt-8 text-sm sm:grid-cols-3"
          style={{ borderColor: "rgba(198,161,91,.4)" }}
        >
          <div>
            <p style={{ color: "#5B6764" }}>{t("lms.certificate.lessons")}</p>
            <p className="mt-1 text-lg font-semibold">{certificate.lessonsCount}</p>
          </div>
          <div>
            <p style={{ color: "#5B6764" }}>{t("lms.certificate.hours")}</p>
            <p className="mt-1 text-lg font-semibold">{certificate.learningHours}</p>
          </div>
          <div>
            <p style={{ color: "#5B6764" }}>{t("lms.certificate.issuedOn")}</p>
            <p className="mt-1 text-lg font-semibold">{formatDate(certificate.issuedAt)}</p>
          </div>
        </div>

        {certificate.instructorName && (
          <p className="mt-8 text-sm" style={{ color: "#5B6764" }}>
            {t("lms.certificate.instructor")}: {certificate.instructorName}
          </p>
        )}

        <div className="mt-10 text-xs" style={{ color: "#7A837F" }}>
          <p>
            {t("lms.certificate.serial")}:{" "}
            <span className="font-mono tracking-wider" dir="ltr">
              {certificate.serial}
            </span>
          </p>
          <p className="mt-1" dir="ltr">
            {t("lms.certificate.verifyHint")} {verificationUrl}
          </p>
        </div>
      </article>
    </div>
  );
}
