import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileCheck2, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHero } from "@/components/layout/SectionHero";
import { useAuth } from "@/hooks/useAuth";
import { canDeposit } from "@/lib/permissions";

/**
 * Section 4. Depositing needs a role, so this page explains the path and sends
 * each visitor to the step that is actually open to them.
 */
export function DepositPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const allowed = canDeposit(user);

  const steps = [
    { icon: <Users className="h-6 w-6" />, key: "account" },
    { icon: <UploadCloud className="h-6 w-6" />, key: "upload" },
    { icon: <FileCheck2 className="h-6 w-6" />, key: "review" },
    { icon: <ShieldCheck className="h-6 w-6" />, key: "publish" },
  ];

  return (
    <div>
      <SectionHero
        number={4}
        icon={<UploadCloud className="h-7 w-7" />}
        title={t("sections.deposit.title")}
        description={t("sections.deposit.description")}
      />

      <div className="container-app py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step.key}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-light/30 text-primary">
                    {step.icon}
                  </span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">
                  {t(`deposit.steps.${step.key}.title`)}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {t(`deposit.steps.${step.key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                {allowed
                  ? t("deposit.readyTitle")
                  : isAuthenticated
                  ? t("deposit.needRoleTitle")
                  : t("deposit.joinTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {allowed
                  ? t("deposit.readyDesc")
                  : isAuthenticated
                  ? t("deposit.needRoleDesc")
                  : t("deposit.joinDesc")}
              </p>
            </div>

            {allowed ? (
              <Button asChild size="lg">
                <Link to="/dashboard/archives/new">{t("deposit.start")}</Link>
              </Button>
            ) : isAuthenticated ? (
              <Button asChild size="lg">
                <Link to="/support">{t("deposit.requestRole")}</Link>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button asChild size="lg">
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
