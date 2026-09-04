import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  FileEdit,
  Globe,
  Heart,
  Bell,
  User,
  Settings,
  GraduationCap,
  BookOpen,
  Award,
  BookOpenCheck,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { visibleSidebarItems } from "@/lib/permissions";
import { SIDEBAR_LABEL_KEYS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  FolderOpen: <FolderOpen className="h-5 w-5" />,
  Plus: <Plus className="h-5 w-5" />,
  FileEdit: <FileEdit className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  User: <User className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  BookOpenCheck: <BookOpenCheck className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
};

interface SidebarProps {
  unreadCount?: number;
}

export function Sidebar({ unreadCount = 0 }: SidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const items = visibleSidebarItems(user);
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-s border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link to="/">
          <Logo variant="icon" size="sm" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4" aria-label={t("common.dashboardMenu")}>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-muted-bg hover:text-foreground"
                }`}
              >
                {iconMap[item.icon]}
                <span>{t(SIDEBAR_LABEL_KEYS[item.key])}</span>
                {item.key === "notifications" && unreadCount > 0 && (
                  <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
                {item.key === "new" && (
                  <Plus className="ms-auto h-4 w-4" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
