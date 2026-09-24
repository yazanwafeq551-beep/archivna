import { API_ORIGIN } from "@/api/client";
import { isNative, platformName, withBridgeTimeout } from "./platform";

/**
 * Everything the app has to tell the device about itself at startup. Returns
 * immediately in a browser, and nothing it imports is loaded there either -
 * the native plugins are behind dynamic imports that Vite splits into chunks
 * a browser never requests.
 */
export async function initNative(): Promise<void> {
  if (!isNative()) return;

  /*
   * Marks the document rather than branching in components: the safe-area
   * padding, and anything else that only applies inside a web view, keys off
   * this attribute in index.css and is inert everywhere else.
   */
  document.documentElement.setAttribute("data-native", platformName());

  /*
   * env(safe-area-inset-*) reports zero until the viewport is allowed to
   * extend under the notch. Set here rather than in index.html so the
   * deployed site keeps its current layout in mobile Safari.
   */
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute("content") ?? "";
    if (!content.includes("viewport-fit")) {
      viewport.setAttribute("content", `${content}, viewport-fit=cover`);
    }
  }

  // Not awaited: the wake-up is the slow part and nothing on screen depends
  // on it.
  wakeApi();

  // allSettled is not enough here: it waits forever on a promise that never
  // settles, and launchAutoHide is off, so a silent bridge would leave the
  // splash screen up permanently with the app running behind it.
  await Promise.all([
    withBridgeTimeout(styleStatusBar()),
    withBridgeTimeout(dismissSplash()),
  ]);
}

async function styleStatusBar(): Promise<void> {
  const { StatusBar, Style } = await import("@capacitor/status-bar");

  // The header is the app's dark green; light glyphs are the only legible
  // choice against it, and the bar must not float over the header.
  await StatusBar.setStyle({ style: Style.Dark });
  if (platformName() === "android") {
    await StatusBar.setBackgroundColor({ color: "#072F2B" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  }
}

async function dismissSplash(): Promise<void> {
  const { SplashScreen } = await import("@capacitor/splash-screen");

  // launchAutoHide is off, so the splash stays up until this runs. Hiding on
  // a timer instead would show a blank shell whenever the first paint is slow.
  await SplashScreen.hide();
}

/**
 * The API sleeps when idle on its current hosting plan, and the first request
 * after that waits out a cold start - up to a minute with nothing coming back.
 * On the web that cost is spread over a page load; in the app it lands
 * squarely on whatever the user taps first, which is usually the login button.
 *
 * Starting the wake-up at launch means it happens while they are still typing.
 * Failure is the expected case offline and is deliberately ignored.
 */
function wakeApi(): void {
  if (!API_ORIGIN) return;

  void fetch(API_ORIGIN + "/api/v1/health").catch(() => undefined);
}
