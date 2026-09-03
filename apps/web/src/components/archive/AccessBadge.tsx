import { Badge } from "@/components/ui/badge";
import { getAccessColor } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AccessBadgeProps {
  level: "public" | "sensitive" | "private";
}

export function AccessBadge({ level }: AccessBadgeProps) {
  const { t } = useTranslation();
  const colorClasses: Record<string, string> = {
    public: "bg-green-100 text-green-800 border-green-200",
    sensitive: "bg-amber-100 text-amber-800 border-amber-200",
    private: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Badge variant="outline" className={colorClasses[level]}>
      {t("accessLevels." + level)}
    </Badge>
  );
}
