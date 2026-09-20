/**
 * Where this build is running. Every native branch in the app hangs off this
 * one predicate, so the browser path stays exactly what it was: `isNative()`
 * is false in any browser, and the code behind it is never reached.
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/**
 * Capacitor injects its global before the bundle evaluates, so this is stable
 * for the lifetime of the page. Read through the global rather than importing
 * `@capacitor/core`: the web build must not pull a native runtime into its
 * bundle just to ask a question whose answer is always false.
 */
let cached: boolean | null = null;

export function isNative(): boolean {
  if (cached === null) {
    cached = capacitor()?.isNativePlatform?.() === true;
  }
  return cached;
}

/** "ios", "android", or "web" - for the handful of platform-specific quirks. */
export function platformName(): string {
  return capacitor()?.getPlatform?.() ?? "web";
}
