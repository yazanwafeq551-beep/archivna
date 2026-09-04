import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

/**
 * The learning section sits inside the site, not beside it: the main header
 * and footer stay put and this slim bar carries the section's own navigation.
 */
export function LmsSubNav() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/lms", label: t("lms.nav.courses"), icon: BookOpen, exact: true },
    ...(isAuthenticated
      ? [
          {
            to: "/dashboard/learning",
            label: t("lms.nav.myLearning"),
            icon: GraduationCap,
            exact: true,
          },
          {
            to: "/dashboard/learning/certificates",
            label: t("lms.certificate.myCertificates"),
            icon: Award,
            exact: false,
          },
        ]
      : []),
  ];

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="border-b border-border bg-surface/70 backdrop-blur-sm">
      <div className="container-app flex h-12 items-center gap-1 overflow-x-auto">
        <span className="me-3 hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">
          <GraduationCap className="h-4 w-4 text-gold" />
          {t("lms.nav.capacityBuilding")}
        </span>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive(link.to, link.exact)
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-muted-bg hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
