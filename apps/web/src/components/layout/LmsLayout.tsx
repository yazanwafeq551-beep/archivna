import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen, GraduationCap, Menu, LayoutDashboard, BookMarked, Award, Bell, User,
  LogOut, Settings, ChevronRight, Globe
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LMS_SIDEBAR_ITEMS } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { changeLanguage as switchLanguage } from "@/i18n";

const lmsSidebarLabels: Record<string, string> = {
  overview: "lms.sidebar.overview",
  courses: "lms.sidebar.myCourses",
  saved: "lms.sidebar.saved",
  achievements: "lms.sidebar.achievements",
};

interface LmsLayoutProps {
  dashboard?: boolean;
}

export function LmsLayout({ dashboard }: LmsLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "ar";

  // Goes through the shared helper so the choice persists and the document
  // direction flips with it.
  const toggleLanguage = () => switchLanguage(isRtl ? "en" : "ar");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isSidebarActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  if (dashboard) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-s border-gold-light/30 bg-white shadow-sm lg:block">
          <div className="flex h-16 items-center border-b border-gold-light/30 px-6">
            <Link to="/lms/dashboard" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-gold" />
              <span className="text-sm font-bold text-primary">{t("lms.nav.capacityBuilding")}</span>
            </Link>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {LMS_SIDEBAR_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isSidebarActive(item.path)
                        ? "bg-gradient-to-r from-gold-light/40 to-gold-light/10 text-primary shadow-sm"
                        : "text-muted hover:bg-gold-light/20 hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md",
                      isSidebarActive(item.path) ? "bg-primary text-white" : "bg-gold-light/30 text-muted"
                    )}>
                      {item.key === "overview" && <LayoutDashboard className="h-3.5 w-3.5" />}
                      {item.key === "courses" && <BookOpen className="h-3.5 w-3.5" />}
                      {item.key === "saved" && <BookMarked className="h-3.5 w-3.5" />}
                      {item.key === "achievements" && <Award className="h-3.5 w-3.5" />}
                    </span>
                    <span>{t(lmsSidebarLabels[item.key])}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User area at bottom */}
          {isAuthenticated && user && (
            <div className="border-t border-gold-light/30 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback>{getInitials(user.fullName || "")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Bar */}
          <header className="flex h-16 items-center justify-between border-b border-gold-light/30 bg-white/95 px-4 backdrop-blur-md lg:px-6">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-muted">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="end" className="w-[280px] border-gold-light/30 bg-[#FDFCF9] p-0">
                  <SheetHeader className="border-b border-gold-light/30 p-4">
                    <SheetTitle>
                      <Link to="/lms/dashboard" className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-gold" />
                        <span className="text-sm font-bold text-primary">{t("lms.nav.capacityBuilding")}</span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="p-4">
                    <ul className="space-y-1">
                      {LMS_SIDEBAR_ITEMS.map((item) => (
                        <li key={item.key}>
                          <Link
                            to={item.path}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                              isSidebarActive(item.path)
                                ? "bg-gold-light/40 text-primary"
                                : "text-muted hover:bg-gold-light/20"
                            )}
                          >
                            {t(lmsSidebarLabels[item.key])}
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
              <h1 className="hidden text-lg font-semibold text-foreground sm:block">
                {t("lms.nav.myLearning")}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-muted hover:text-primary">
                <Globe className="h-5 w-5" />
              </Button>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                        <AvatarFallback>{getInitials(user?.fullName || "")}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-gold-light/30">
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
                      <Link to="/lms/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        {t("lms.nav.dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="text-muted hover:text-primary">
                    <Link to="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button variant="gold" size="sm" asChild>
                    <Link to="/register">{t("nav.register")}</Link>
                  </Button>
                </div>
              )}
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

  // Non-dashboard layout (public LMS pages)
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-gold-light/30 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden text-muted hover:text-primary">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="end" className="w-[280px] border-gold-light/30 bg-[#FDFCF9] p-0">
                <SheetHeader className="border-b border-gold-light/30 p-4">
                  <SheetTitle>
                    <Link to="/lms" className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-gold" />
                      <span className="text-sm font-bold text-primary">{t("lms.nav.capacityBuilding")}</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4">
                  <ul className="space-y-1">
                    <li>
                      <Link to="/lms" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-gold-light/20">
                        <BookOpen className="h-4 w-4" />
                        {t("lms.nav.courses")}
                      </Link>
                    </li>
                    {isAuthenticated && (
                      <li>
                        <Link to="/lms/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-gold-light/20">
                          <GraduationCap className="h-4 w-4" />
                          {t("lms.nav.myLearning")}
                        </Link>
                      </li>
                    )}
                    <li className="border-t border-gold-light/30 my-2" />
                    <li>
                      <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-gold-light/20">
                        <Globe className="h-4 w-4" />
                        {t("nav.home")}
                      </Link>
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="full" size="sm" />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" asChild className="text-muted hover:text-primary">
                <Link to="/lms">
                  <BookOpen className="me-1.5 h-4 w-4" />
                  {t("lms.nav.courses")}
                </Link>
              </Button>
              {isAuthenticated && (
                <Button variant="ghost" size="sm" asChild className="text-muted hover:text-primary">
                  <Link to="/lms/dashboard">
                    <GraduationCap className="me-1.5 h-4 w-4" />
                    {t("lms.nav.myLearning")}
                  </Link>
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-muted hover:text-primary">
              <Globe className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                      <AvatarFallback>{getInitials(user?.fullName || "")}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-gold-light/30">
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
                    <Link to="/lms/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      {t("lms.nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-muted hover:text-primary">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button variant="gold" size="sm" asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gold-light/30 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="h-5 w-5 text-gold" />
            <span className="text-sm font-semibold text-primary">{t("lms.nav.capacityBuilding")}</span>
          </div>
          <p className="text-xs text-muted">{t("lms.footer.description")}</p>
        </div>
      </footer>
    </div>
  );
}
