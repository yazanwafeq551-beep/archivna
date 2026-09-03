import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-red-50 p-6">
        <ShieldX className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="mb-2 text-6xl font-bold text-foreground">403</h1>
      <h2 className="mb-4 text-xl font-heading font-semibold text-foreground">
        {t("error.unauthorized")}
      </h2>
      <p className="mb-8 max-w-md text-muted">
        {t("error.unauthorizedMessage")}
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/login">{t("nav.login")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">{t("common.goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
