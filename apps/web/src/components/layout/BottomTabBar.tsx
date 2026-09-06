import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Bell, FolderOpen, Home, User } from "lucide-react";
import { MAIN_NAV } from "@/lib/constants";
import { notificationsApi } from "@/api/notifications";
import { useAuth } from "@/hooks/useAuth";
import { cn, isNavActive } from "@/lib/utils";

const navIcons: Record<string, React.ElementType> = {
  Home,
  FolderOpen,
  Bell,
  User,
};

/**
 * The reader's four places, always within thumb's reach. Only below lg - from
 * there up the top bar already carries the same four, and showing both would be
 * the same nav twice.
 */
export function BottomTabBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: notificationsApi.getUnreadCount,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  return (
    <nav
      aria-label={t("common.bottomNav")}
      // z-40 keeps it under the sheet and dialog overlays, which are z-50.
      // no-print hooks into the existing print rules so certificates come out clean.
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-primary-dark pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {MAIN_NAV.map((item) => {
          const Icon = navIcons[item.icon];
          const active = isNavActive(location.pathname, item.path);
          const showBadge = item.key === "notifications" && isAuthenticated && (unread?.count ?? 0) > 0;

          return (
            <li key={item.key} className="flex-1">
              <Link
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full min-h-[3rem] flex-col items-center justify-center gap-1 transition-colors",
                  active
                    ? "text-gold before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:bg-gold"
                    : "text-white/70 hover:text-white"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-primary-dark"
                      />
                      <span className="sr-only">{unread?.count}</span>
                    </>
                  )}
                </span>
                <span className="text-[11px] font-semibold">{t(`nav.${item.key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
