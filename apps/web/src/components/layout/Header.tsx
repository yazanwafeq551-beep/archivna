import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { changeLanguage } from "@/i18n";
import { PLATFORM_SECTIONS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSectionActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-border/80 bg-ivory/95 shadow-[0_10px_30px_rgba(15,76,69,.08)] backdrop-blur-xl"
          : "border-border/60 bg-ivory"
      }`}
    >
      <div className="container-app">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="shrink-0">
            <Logo variant="full" size="sm" />
          </Link>

          <nav
            className="hidden xl:flex items-center gap-0.5"
            aria-label={t("common.mainMenu")}
          >
            {PLATFORM_SECTIONS.map((section) => (
              <Link
                key={section.key}
                to={section.path}
                title={t(`sections.${section.key}.title`)}
                className={`relative rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                  isSectionActive(section.path)
                    ? "bg-primary/10 text-primary after:absolute after:inset-x-2.5 after:-bottom-[17px] after:h-0.5 after:bg-gold"
                    : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {t(`sections.${section.key}.short`)}
              </Link>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLanguageToggle}
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </Button>

            <ThemeToggle />

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
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
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
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex xl:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLanguageToggle}
              className="text-sm"
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </Button>

            <ThemeToggle />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("common.openMenu", "فتح القائمة")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="end" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>
                    <Logo variant="icon" size="sm" />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <nav className="flex flex-col gap-1">
                    <Link
                      to="/"
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        location.pathname === "/"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted-bg"
                      }`}
                    >
                      {t("nav.home")}
                    </Link>
                    {PLATFORM_SECTIONS.map((section) => (
                      <Link
                        key={section.key}
                        to={section.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isSectionActive(section.path)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted-bg"
                        }`}
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted-bg text-[11px] font-bold text-muted">
                          {section.number}
                        </span>
                        {t(`sections.${section.key}.title`)}
                      </Link>
                    ))}
                  </nav>

                  <div className="border-t border-border pt-4">
                    {isAuthenticated ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                            <AvatarFallback>{getInitials(user?.fullName || "")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{user?.fullName}</div>
                            <div className="text-xs text-muted">{user?.email}</div>
                          </div>
                        </div>
                        <Link
                          to="/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-muted-bg"
                        >
                          {t("nav.dashboard")}
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileOpen(false);
                          }}
                          className="rounded-md px-3 py-2 text-sm text-destructive hover:bg-red-50 text-start"
                        >
                          {t("nav.logout")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                          <Link to="/login" onClick={() => setMobileOpen(false)}>
                            {t("nav.login")}
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/register" onClick={() => setMobileOpen(false)}>
                            {t("nav.register")}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
