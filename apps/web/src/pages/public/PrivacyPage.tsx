import { useTranslation } from "react-i18next";

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="container-app py-8 max-w-4xl">
      <h1 className="mb-8 text-2xl md:text-3xl font-heading font-bold text-foreground">
        {t("privacy.title")}
      </h1>
      <div className="prose prose-lg max-w-none text-muted">
        <h2 className="text-xl font-heading font-semibold text-foreground">{t("privacy.sections.infoCollection.title")}</h2>
        <p>{t("privacy.sections.infoCollection.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("privacy.sections.infoUsage.title")}</h2>
        <p>{t("privacy.sections.infoUsage.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("privacy.sections.dataProtection.title")}</h2>
        <p>{t("privacy.sections.dataProtection.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("privacy.sections.cookies.title")}</h2>
        <p>{t("privacy.sections.cookies.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("privacy.sections.yourRights.title")}</h2>
        <p>{t("privacy.sections.yourRights.content")}</p>

        <h2 className="text-xl font-heading font-semibold text-foreground">{t("privacy.sections.contact.title")}</h2>
        <p>{t("privacy.sections.contact.content")}</p>
      </div>
    </div>
  );
}
