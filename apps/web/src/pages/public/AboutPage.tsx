import { useTranslation } from "react-i18next";
import { Target, Eye, Heart } from "lucide-react";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="container-app py-8 max-w-4xl">
      <h1 className="mb-8 text-2xl md:text-3xl font-heading font-bold text-foreground">
        {t("about.title")}
      </h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-muted leading-relaxed mb-8">
          {t("about.body1")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-lg border border-border bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">{t("about.mission")}</h3>
            <p className="text-sm text-muted">{t("about.missionText")}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Eye className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">{t("about.vision")}</h3>
            <p className="text-sm text-muted">{t("about.visionText")}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-burgundy">
              <Heart className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">{t("about.values")}</h3>
            <p className="text-sm text-muted">{t("about.valuesText")}</p>
          </div>
        </div>

        <h2 className="text-xl font-heading font-bold text-foreground mb-4">
          {t("about.howItWorks")}
        </h2>
        <div className="space-y-4 text-muted">
          <p>
            {t("about.body2")}
          </p>
          <p>
            {t("about.body3")}
          </p>
          <p>
            {t("about.body4")}
          </p>
        </div>
      </div>
    </div>
  );
}
