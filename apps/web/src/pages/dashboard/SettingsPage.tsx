import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { changeLanguage } from "@/i18n";
import { settingsApi, type UserSettings } from "@/api/settings";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type SaveStatus = "idle" | "loading" | "saved" | "error";

const DEFAULT_THEME: "light" | "dark" | "system" = "light";
const DEFAULT_TEXT_SIZE: "small" | "medium" | "large" = "medium";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    (localStorage.getItem("archivna-theme") as "light" | "dark" | "system") || DEFAULT_THEME
  );
  const [textSize, setTextSize] = useState<"small" | "medium" | "large">(
    (localStorage.getItem("archivna-text-size") as "small" | "medium" | "large") || DEFAULT_TEXT_SIZE
  );
  const [reducedMotion, setReducedMotion] = useState(
    localStorage.getItem("archivna-reduced-motion") === "true"
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [initialized, setInitialized] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (patch: Partial<UserSettings>) => {
      if (!isAuthenticated) return;
      setSaveStatus("loading");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await settingsApi.updateSettings(patch);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        }
      }, 400);
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    settingsApi
      .getSettings()
      .then((settings) => {
        if (cancelled) return;
        const loadedTheme = ["light", "dark", "system"].includes(settings.theme)
          ? (settings.theme as "light" | "dark" | "system")
          : DEFAULT_THEME;
        const loadedTextSize = ["small", "medium", "large"].includes(settings.textSize)
          ? (settings.textSize as "small" | "medium" | "large")
          : DEFAULT_TEXT_SIZE;
        setTheme(loadedTheme);
        setTextSize(loadedTextSize);
        setReducedMotion(settings.reducedMotion);
        setEmailNotifications(settings.emailNotifications);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
    localStorage.setItem("archivna-theme", theme);
    if (initialized && isAuthenticated) persist({ theme });
  }, [theme, initialized, isAuthenticated, persist]);

  useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize);
    localStorage.setItem("archivna-text-size", textSize);
    if (initialized && isAuthenticated) persist({ textSize });
  }, [textSize, initialized, isAuthenticated, persist]);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
    localStorage.setItem("archivna-reduced-motion", String(reducedMotion));
    if (initialized && isAuthenticated) persist({ reducedMotion });
  }, [reducedMotion, initialized, isAuthenticated, persist]);

  useEffect(() => {
    if (initialized && isAuthenticated) persist({ emailNotifications });
  }, [emailNotifications, initialized, isAuthenticated, persist]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {t("dashboard.settings.title")}
        </h2>
        {saveStatus === "loading" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("dashboard.settings.saving")}
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {t("dashboard.settings.saved")}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {t("dashboard.settings.saveError")}
          </span>
        )}
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={i18n.language}
            onValueChange={(value) => {
              changeLanguage(value);
              if (initialized && isAuthenticated) persist({ language: value as "ar" | "en" });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">{t("common.arabic")}</SelectItem>
              <SelectItem value="en">{t("common.english")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.theme")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={theme}
            onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("dashboard.settings.light")}</SelectItem>
              <SelectItem value="dark">{t("dashboard.settings.dark")}</SelectItem>
              <SelectItem value="system">{t("dashboard.settings.system")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Text Size */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.textSize")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={textSize}
            onValueChange={(value: "small" | "medium" | "large") => setTextSize(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{t("dashboard.settings.small")}</SelectItem>
              <SelectItem value="medium">{t("dashboard.settings.medium")}</SelectItem>
              <SelectItem value="large">{t("dashboard.settings.large")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.accessibility")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion" className="cursor-pointer">
              {t("dashboard.settings.reducedMotion")}
            </Label>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.notifications")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="cursor-pointer">
              {t("dashboard.settings.emailNotifications")}
            </Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            {t("dashboard.settings.notificationsNote")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
