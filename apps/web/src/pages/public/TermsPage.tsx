import { useTranslation } from "react-i18next";

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="container-app py-8 max-w-4xl">
      <h1 className="mb-8 text-2xl md:text-3xl font-heading font-bold text-foreground">
        {t("terms.title")}
      </h1>
      <div className="prose prose-lg max-w-none text-muted">
        <h2 className="text-xl font-heading font-semibold text-foreground">{t("terms.sections.acceptance.title")}</h2>
        <p>{t("terms.sections.acceptance.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("terms.sections.accounts.title")}</h2>
        <p>{t("terms.sections.accounts.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("terms.sections.content.title")}</h2>
        <p>{t("terms.sections.content.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("terms.sections.acceptableUse.title")}</h2>
        <p>{t("terms.sections.acceptableUse.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("terms.sections.termination.title")}</h2>
        <p>{t("terms.sections.termination.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("terms.sections.disclaimer.title")}</h2>
        <p>{t("terms.sections.disclaimer.content")}</p>
      </div>
    </div>
  );
}
