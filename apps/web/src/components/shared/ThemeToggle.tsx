import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, getStoredTheme, resolveTheme, type Theme } from "@/lib/appearance";
import { settingsApi } from "@/api/settings";
import { useAuth } from "@/hooks/useAuth";

/**
 * Flips between light and dark. A signed-in user's choice is also stored on the
 * account so it follows them to another device; "system" resolves to whatever
 * the OS currently asks for, and choosing here makes it explicit.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const isDark = resolveTheme(theme) === "dark";

  const toggle = () => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    if (isAuthenticated) {
      settingsApi.updateSettings({ theme: next }).catch(() => undefined);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={t(isDark ? "dashboard.settings.light" : "dashboard.settings.dark")}
      title={t(isDark ? "dashboard.settings.light" : "dashboard.settings.dark")}
      data-theme-state={theme}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
