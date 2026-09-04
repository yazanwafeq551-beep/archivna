import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, Bell, LogOut, User, Settings } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { visibleSidebarItems } from "@/lib/permissions";
import { SIDEBAR_LABEL_KEYS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.count || 0;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return t("dashboard.overview.title");
    if (path.startsWith("/lms")) return t("lms.dashboard.title");
    if (path.includes("/archives/new")) return t("dashboard.newArchive.title");
    if (path.includes("/archives") && path.includes("/edit")) return t("dashboard.archives.title");
    if (path.includes("/archives")) return t("dashboard.archives.title");
    if (path.includes("/drafts")) return t("dashboard.archives.title");
    if (path.includes("/published")) return t("dashboard.archives.title");
    if (path.includes("/favorites")) return t("dashboard.favorites.title");
    if (path.includes("/notifications")) return t("dashboard.notifications.title");
    if (path.includes("/profile")) return t("dashboard.profile.title");
    if (path.includes("/courses")) return t("dashboard.coursesAdmin");
    if (path.includes("/settings")) return t("dashboard.settings.title");
    return t("dashboard.overview.title");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar unreadCount={unreadCount} />

      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("common.openMenu")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="end" className="w-[280px] p-0">
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle>
                    <Link to="/">
                      <Logo variant="icon" size="sm" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4">
                  <ul className="space-y-1">
                    {visibleSidebarItems(user).map((item) => (
                      <li key={item.key}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? "bg-primary/10 text-primary"
                              : "text-muted hover:bg-muted-bg"
                          }`}
                        >
                          <span>{t(SIDEBAR_LABEL_KEYS[item.key])}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="lg:hidden">
              <Logo variant="icon" size="sm" />
            </Link>

            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative"
            >
              <Link to="/dashboard/notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback>{getInitials(user?.fullName || "")}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback>{getInitials(user?.fullName || "")}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.fullName}</span>
                    <span className="text-xs text-muted">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    {t("dashboard.settings.title")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
