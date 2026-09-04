/**
 * Appearance preferences live in three places: the DOM (what the user sees),
 * localStorage (so a reload does not flash the wrong theme) and the account
 * settings on the server (so the choice follows the user). This module owns the
 * DOM + localStorage half and is applied once at startup.
 */

export type Theme = "light" | "dark" | "system";
export type TextSize = "small" | "medium" | "large";

export const THEME_KEY = "archivna-theme";
export const TEXT_SIZE_KEY = "archivna-text-size";
export const REDUCED_MOTION_KEY = "archivna-reduced-motion";
export const LANGUAGE_KEY = "archivna-lang";

const THEMES: Theme[] = ["light", "dark", "system"];
const TEXT_SIZES: TextSize[] = ["small", "medium", "large"];

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage - the DOM update still applies.
  }
}

export function normalizeTheme(value: unknown): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : "system";
}

/** The API also stores the legacy value "normal" for medium. */
export function normalizeTextSize(value: unknown): TextSize {
  if (value === "normal") return "medium";
  return TEXT_SIZES.includes(value as TextSize) ? (value as TextSize) : "medium";
}

export function getStoredTheme(): Theme {
  return normalizeTheme(readStorage(THEME_KEY));
}

export function getStoredTextSize(): TextSize {
  return normalizeTextSize(readStorage(TEXT_SIZE_KEY));
}

export function getStoredReducedMotion(): boolean {
  return readStorage(REDUCED_MOTION_KEY) === "true";
}

function prefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function applyTheme(theme: Theme, persist = true) {
  const resolved = theme === "system" ? (prefersDark() ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = theme;
  if (persist) writeStorage(THEME_KEY, theme);
}

export function applyTextSize(size: TextSize, persist = true) {
  document.documentElement.setAttribute("data-text-size", size);
  if (persist) writeStorage(TEXT_SIZE_KEY, size);
}

export function applyReducedMotion(enabled: boolean, persist = true) {
  document.documentElement.classList.toggle("reduce-motion", enabled);
  if (persist) writeStorage(REDUCED_MOTION_KEY, String(enabled));
}

/**
 * Applies the stored preferences before the first paint and keeps "system"
 * following the OS while the app is open.
 */
export function initAppearance() {
  applyTheme(getStoredTheme(), false);
  applyTextSize(getStoredTextSize(), false);
  applyReducedMotion(getStoredReducedMotion(), false);

  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getStoredTheme() === "system") applyTheme("system", false);
    });
}

/** Applies the preferences stored on the account after a session is restored. */
export function applyAccountAppearance(settings: {
  theme?: string | null;
  textSize?: string | null;
  reducedMotion?: boolean | null;
}) {
  if (settings.theme) applyTheme(normalizeTheme(settings.theme));
  if (settings.textSize) applyTextSize(normalizeTextSize(settings.textSize));
  if (typeof settings.reducedMotion === "boolean") {
    applyReducedMotion(settings.reducedMotion);
  }
}
