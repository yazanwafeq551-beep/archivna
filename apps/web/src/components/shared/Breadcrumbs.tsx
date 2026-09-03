import { Link } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("common.breadcrumb")} className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <li>
          <Link
            to="/"
            className="flex items-center hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" />
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
