import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ps.arsheefna.app",
  appName: "أرشيفنا",
  webDir: "dist",

  /**
   * Capacitor serves the bundle from a local http(s) origin, not from file://,
   * which is why `base` in vite.config.ts stays "/". It also means the API sees
   * a real Origin header and has to allow it - see FRONTEND_URL on the server.
   */
  server: {
    androidScheme: "https",
  },

  plugins: {
    /**
     * The splash screen hides on our signal instead of on a timer, so the app
     * never shows a blank shell between the splash and the first paint.
     */
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0B3B2E",
    },
  },

  /**
   * CapacitorHttp stays off. It would route XHR through native and sidestep
   * CORS, but it drops onUploadProgress, responseType "blob" and FormData -
   * all three of which this app depends on for uploads and downloads.
   */
};

export default config;
