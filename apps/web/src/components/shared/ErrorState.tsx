import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  message,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title ?? t("common.error")}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted">{message ?? t("error.genericMessage")}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
