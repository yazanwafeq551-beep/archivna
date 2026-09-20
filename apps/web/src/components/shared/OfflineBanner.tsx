import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { isNative } from "@/lib/platform";

/**
 * A packaged app starts from files on the device, so it opens and renders
 * with no connection at all - and then every request fails with nothing on
 * screen to explain why. A browser at least shows its own offline page.
 *
 * Rendered only inside the app, so the site keeps the layout it has.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!isNative() || !offline) return null;

  return (
    /* A floating pill, not a bar. The header is already sticky at top-0 and
       a second sticky element there would overlap it rather than stack; the
       bottom edge belongs to BottomTabBar below lg, so this clears its 4rem
       plus the home indicator. */
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-6"
    >
      <span className="flex items-center gap-2 rounded-full bg-gold-deep px-4 py-2 text-sm font-medium text-white shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0" />
        {t("common.offline")}
      </span>
    </div>
  );
}
