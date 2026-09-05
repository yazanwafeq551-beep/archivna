import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  GraduationCap,
  Headphones,
  Landmark,
  Newspaper,
  Search,
  UploadCloud,
} from "lucide-react";
import { PLATFORM_SECTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const icons: Record<string, React.ReactNode> = {
  Search: <Search className="h-7 w-7" />,
  GraduationCap: <GraduationCap className="h-7 w-7" />,
  Headphones: <Headphones className="h-7 w-7" />,
  UploadCloud: <UploadCloud className="h-7 w-7" />,
  Newspaper: <Newspaper className="h-7 w-7" />,
  ClipboardList: <ClipboardList className="h-7 w-7" />,
  Landmark: <Landmark className="h-7 w-7" />,
};

/**
 * The platform map as the project owner drew it: seven numbered services,
 * alternating ink and paper cards, each opening its own section.
 */
export function PlatformServices() {
  const { t } = useTranslation();

  return (
    <section className="relative py-14 md:py-20">
      <div className="container-app">
        <div className="mb-10 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-light/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-deep">
            {t("app.slogan")}
          </p>
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            {t("sections.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">{t("sections.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_SECTIONS.map((section, index) => {
            const ink = index % 2 === 1;
            return (
              <Link
                key={section.key}
                to={section.path}
                className={cn(
                  "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1",
                  ink
                    ? "border-gold/25 bg-primary-dark text-white shadow-lg shadow-primary/10"
                    : "border-border bg-surface text-foreground shadow-sm hover:border-gold/50",
                  // The last card spans the row end so seven items still sit tidily.
                  section.number === 7 && "sm:col-span-2 lg:col-span-1"
                )}
              >
                <span
                  className={cn(
                    "absolute end-4 top-4 grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                    ink ? "bg-gold text-primary-dark" : "bg-primary/10 text-primary"
                  )}
                >
                  {section.number}
                </span>

                <span
                  className={cn(
                    "grid h-14 w-14 place-items-center rounded-2xl border transition-transform duration-300 group-hover:scale-105",
                    ink
                      ? "border-gold/40 bg-white/10 text-gold"
                      : "border-gold/30 bg-gold-light/25 text-primary"
                  )}
                >
                  {icons[section.icon]}
                </span>

                <h3 className="font-heading text-lg font-bold leading-snug">
                  {t(`sections.${section.key}.title`)}
                </h3>
                <p className={cn("text-sm leading-6", ink ? "text-white/70" : "text-muted")}>
                  {t(`sections.${section.key}.description`)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
