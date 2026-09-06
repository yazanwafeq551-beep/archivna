import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Lock, UploadCloud, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * The two doors under the service map.
 *
 * The design only draws the visitor's pair. "Sign in / create an account" is
 * meaningless once you are signed in, so a reader who already has an account
 * gets the two doors they would actually use instead.
 */
export function AccessCta() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const doors = user
    ? ([
        { key: "dashboard", to: "/dashboard", icon: LayoutDashboard, tone: "ink" },
        { key: "deposit", to: "/deposit", icon: UploadCloud, tone: "gold" },
      ] as const)
    : ([
        { key: "login", to: "/login", icon: Lock, tone: "ink" },
        { key: "register", to: "/register", icon: UserPlus, tone: "gold" },
      ] as const);

  return (
    <section className="pt-10 md:pt-12">
      <div className="container-app">
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          {doors.map((door, index) => (
            <div key={door.key} className="contents">
              {index > 0 && (
                <span aria-hidden="true" className="hidden text-gold sm:block">
                  ◆
                </span>
              )}
              <Link
                to={door.to}
                className={cn(
                  "hover-card flex flex-1 items-center justify-center gap-4 rounded-2xl border px-6 py-5",
                  door.tone === "ink"
                    ? "border-gold/25 bg-primary-dark text-white"
                    : "border-gold/40 bg-gold text-primary-dark"
                )}
              >
                <span
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-full",
                    door.tone === "ink" ? "bg-white/10 text-gold" : "bg-primary-dark/10 text-primary-dark"
                  )}
                >
                  <door.icon className="h-6 w-6" />
                </span>
                <span className="text-start">
                  <span className="block font-heading text-lg font-bold leading-tight">
                    {t(`home.cta.${door.key}.label`)}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      door.tone === "ink" ? "text-white/70" : "text-primary-dark/70"
                    )}
                  >
                    {t(`home.cta.${door.key}.sub`)}
                  </span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
