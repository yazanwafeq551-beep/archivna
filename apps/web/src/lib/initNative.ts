import { isNative, platformName } from "./platform";

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

  await Promise.allSettled([styleStatusBar(), dismissSplash()]);
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
