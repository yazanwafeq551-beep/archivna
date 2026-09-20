import { useEffect } from "react";
import { router } from "@/routes";
import { isNative } from "./platform";

/**
 * Android's back button is a hardware gesture, not a browser control: with no
 * listener, Capacitor's default is to close the app from any screen. That
 * turns one stray swipe on a lesson page into a full exit.
 *
 * Does nothing in a browser, which has its own back button and its own
 * history semantics.
 */
export function useNativeBackButton(): void {
  useEffect(() => {
    if (!isNative()) return;

    let remove: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          void router.navigate(-1);
          return;
        }

        // Opened from a deep link, so there is no history to unwind. Home is
        // a better destination than an exit the user did not ask for.
        if (router.state.location.pathname !== "/") {
          void router.navigate("/");
          return;
        }

        void App.exitApp();
      });

      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}
