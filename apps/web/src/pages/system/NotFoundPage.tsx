import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-muted-bg p-6">
        <FileQuestion className="h-16 w-16 text-muted" />
      </div>
      <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
      <h2 className="mb-4 text-xl font-heading font-semibold text-foreground">
        {t("error.notFound")}
      </h2>
      <p className="mb-8 max-w-md text-muted">
        {t("error.notFoundMessage")}
      </p>
      <Button asChild>
        <Link to="/">{t("common.goHome")}</Link>
      </Button>
    </div>
  );
}
