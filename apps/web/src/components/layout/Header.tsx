import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  FolderOpen,
  Globe,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MAIN_NAV, PLATFORM_SECTIONS } from "@/lib/constants";
import { cn, getInitials, isNavActive } from "@/lib/utils";

const navIcons: Record<string, React.ElementType> = {
  Home,
  FolderOpen,
  Bell,
  User,
};

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSectionActive = (path: string) => isNavActive(location.pathname, path);

  const handleLanguageToggle = () => {
    changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    searchToggleRef.current?.focus();
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-gold/25 text-white transition-all duration-300",
        scrolled
          ? "bg-primary-dark/95 shadow-[0_10px_30px_rgba(7,47,43,.35)] backdrop-blur-xl"
          : "bg-primary-dark"
      )}
    >
      <div className="container-app">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="shrink-0">
            <Logo variant="full" size="sm" tone="onDark" />
          </Link>

          {/* Four short items fit comfortably from lg up, now that the seven
              sections have moved to the home hub and the footer. */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("common.mainMenu")}>
            {MAIN_NAV.map((item) => {
              const Icon = navIcons[item.icon];
              const active = isSectionActive(item.path);
              const locked = item.protected && !isAuthenticated;

              return (
                <Link
                  key={item.key}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  title={locked ? t("nav.loginRequired") : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "text-gold after:absolute after:inset-x-3 after:-bottom-[15px] after:h-0.5 after:bg-gold"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  <span className="relative">
                    <Icon className="h-4 w-4" />
                    {/* Signed out, these three bounce through the login page.
                        Say so rather than letting the click be a surprise. */}
                    {locked && (
                      <Lock className="absolute -end-1.5 -top-1 h-2.5 w-2.5 text-gold/80" />
                    )}
                  </span>
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              ref={searchToggleRef}
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((open) => !open)}
              aria-expanded={searchOpen}
              aria-controls="header-search"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">{t("common.searchToggle")}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLanguageToggle}
              aria-label={t("common.language")}
              className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {i18n.language === "ar" ? t("common.english") : t("common.arabic")}
            </Button>

            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
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
                <Button variant="outlineOnDark" size="sm" asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button variant="gold" size="sm" asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLanguageToggle}
              aria-label={t("common.language")}
              className="text-sm text-white hover:bg-white/10 hover:text-white"
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </Button>

            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("common.openMenu")}</span>
                </Button>
              </SheetTrigger>
              {/* The drawer now carries the seven sections: the personal items
                  live in the bottom tab bar on these widths, so nothing here
                  duplicates them. */}
              <SheetContent side="end" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>
                    <Logo variant="icon" size="sm" />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <nav className="flex flex-col gap-1" aria-label={t("sections.title")}>
                    {PLATFORM_SECTIONS.map((section) => (
                      <Link
                        key={section.key}
                        to={section.path}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isSectionActive(section.path) ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isSectionActive(section.path)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted-bg"
                        )}
                      >
                        <span
                          dir="ltr"
                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted-bg text-[11px] font-bold text-muted"
                        >
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

      {/* A magnifier that only linked to /search would be a lie; it opens a
          field that actually searches. */}
      {searchOpen && (
        <div
          id="header-search"
          className="absolute inset-x-0 top-full border-b border-gold/25 bg-primary-dark p-3"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeSearch();
          }}
        >
          <form onSubmit={submitSearch} className="container-app">
            <Input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.hero.searchPlaceholder")}
              aria-label={t("nav.search")}
              icon={<Search className="h-5 w-5 text-muted" />}
            />
          </form>
        </div>
      )}
    </header>
  );
}
