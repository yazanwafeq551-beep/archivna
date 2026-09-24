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

/**
 * A Capacitor plugin call crosses a bridge into native code, and if nothing
 * answers on the other side the promise does not reject - it simply never
 * settles. try/catch is no defence against that: there is nothing to catch,
 * and neither Promise.all nor allSettled will ever resolve.
 *
 * Every bridge call in this app goes through here. A plugin is allowed to
 * fail. It is not allowed to hang, because the code waiting on it is usually
 * the thing standing between the user and a working screen.
 */
export function withBridgeTimeout<T>(
  work: Promise<T>,
  ms = 3000
): Promise<T | undefined> {
  return Promise.race([
    work.catch(() => undefined),
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

/** "ios", "android", or "web" - for the handful of platform-specific quirks. */
export function platformName(): string {
  return capacitor()?.getPlatform?.() ?? "web";
}
