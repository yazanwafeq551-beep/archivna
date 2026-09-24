import { isNative, withBridgeTimeout } from "./platform";

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
 * The web view's own storage: synchronous, no bridge, and therefore incapable
 * of hanging. This is the copy the app actually relies on.
 */
function readLocal(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeLocal(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage disabled. The session will not outlive the process, which is
    // a worse app, not a broken one.
  }
}

/**
 * Capacitor Preferences survives things the web view's storage does not -
 * a WebView data clear, most notably. It is a durable mirror, never the
 * source of truth, and every call to it is time-boxed.
 *
 * Loaded on demand so the browser bundle never pulls in a native runtime it
 * can never reach.
 */
async function mirror(token: string | null): Promise<void> {
  if (!isNative()) return;

  await withBridgeTimeout(
    (async () => {
      const { Preferences } = await import("@capacitor/preferences");
      if (token) await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
      else await Preferences.remove({ key: REFRESH_TOKEN_KEY });
    })()
  );
}

async function readMirror(): Promise<string | null> {
  if (!isNative()) return null;

  const value = await withBridgeTimeout(
    (async () => {
      const { Preferences } = await import("@capacitor/preferences");
      const result = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return result.value ?? null;
    })()
  );

  return value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  if (!isNative()) return null;

  // The local copy answers instantly and is right almost every time. The
  // mirror is only consulted when it is missing - after a storage clear, or
  // for a session saved by a build that wrote only to Preferences.
  const local = readLocal();
  if (local) return local;

  const mirrored = await readMirror();
  if (mirrored) writeLocal(mirrored);
  return mirrored;
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (!isNative()) return;

  // Synchronous, so the caller is never held up by storage.
  writeLocal(token);

  // Not awaited: the session is already usable, and the durable copy only
  // has to be there by the next launch.
  void mirror(token);
}

export async function clearRefreshToken(): Promise<void> {
  await setRefreshToken(null);
}
