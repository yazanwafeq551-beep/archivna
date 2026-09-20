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
 * Async from the start. The store behind it is `localStorage` today and
 * becomes encrypted device storage before release; that swap changes this
 * file only if the callers already await.
 */
export async function getRefreshToken(): Promise<string | null> {
  if (!isNative()) return null;

  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    // A web view with storage disabled still has to run, just without a
    // session that survives a restart.
    return null;
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (!isNative()) return;

  try {
    if (token) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Nothing to recover: the session simply will not outlive the process.
  }
}

export async function clearRefreshToken(): Promise<void> {
  await setRefreshToken(null);
}
