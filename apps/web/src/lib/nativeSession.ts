import { isNative } from "./platform";

/**
 * A packaged app runs in a web view, where the API's `SameSite=None` refresh
 * cookie is a third-party cookie and gets dropped. Without somewhere to keep
 * the refresh token the app would open signed out after every restart, so
 * native builds hold the token themselves and send it back explicitly.
 *
 * Every operation is a no-op in a browser, where the cookie still does this
 * job and is unreadable by JavaScript - which device storage is not.
 */

const REFRESH_TOKEN_KEY = "archivna.refreshToken";

/**
 * Loaded on demand so the browser bundle never pulls in a native runtime it
 * can never reach. Vite splits it into its own chunk that a browser never
 * requests, because `isNative()` returns before this is called.
 */
async function preferences() {
  const { Preferences } = await import("@capacitor/preferences");
  return Preferences;
}

/**
 * Async from the start. The store behind it is device preferences today and
 * becomes encrypted storage before release; that swap changes this file only
 * if the callers already await.
 */
export async function getRefreshToken(): Promise<string | null> {
  if (!isNative()) return null;

  try {
    const { value } = await (await preferences()).get({ key: REFRESH_TOKEN_KEY });
    return value ?? null;
  } catch {
    // A web view with storage unavailable still has to run, just without a
    // session that survives a restart.
    return null;
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (!isNative()) return;

  try {
    const store = await preferences();
    if (token) {
      await store.set({ key: REFRESH_TOKEN_KEY, value: token });
    } else {
      await store.remove({ key: REFRESH_TOKEN_KEY });
    }
  } catch {
    // Nothing to recover: the session simply will not outlive the process.
  }
}

export async function clearRefreshToken(): Promise<void> {
  await setRefreshToken(null);
}
