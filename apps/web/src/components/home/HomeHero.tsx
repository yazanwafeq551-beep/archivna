import { Fragment, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";
import { HomeBackdrop } from "./HomeBackdrop";
import "./HomeHero.css";

const PILLARS = ["past", "present", "future"] as const;

/**
 * The masthead, and the canvas the service map and the two doors sit on: the
 * design draws all three as one composition over a single Jerusalem collage.
 *
 * The side frames are cut from that artwork - the keffiyeh selvedge, the olive
 * branches, the Old City. They are pinned to the physical left and right rather
 * than to inline start and end on purpose: the artwork is a picture, not text,
 * and mirroring it for English would move each keffiyeh to the wrong edge of
 * its own composition.
 */
export function HomeHero({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative isolate overflow-hidden bg-background pb-8 pt-8 dark:bg-primary-dark md:pb-12 md:pt-14">
      <HomeBackdrop />

      <div className="container-app relative z-10">
        <div className="animate-fade-in mx-auto max-w-3xl text-center">
          <img
            src="/images/acp-emblem.png"
            alt={t("home.hero.logoAlt")}
            width={168}
            height={168}
            className="mx-auto h-20 w-20 rounded-full sm:h-24 sm:w-24 md:h-28 md:w-28"
          />

          <h1 className="mt-3 md:mt-5">
            <span className="block font-brand text-4xl font-bold leading-[1.05] text-primary dark:text-foreground sm:text-5xl md:text-7xl lg:text-8xl">
              {t("app.name")}
            </span>
            <span className="mt-2 block font-heading text-lg font-bold text-primary dark:text-foreground md:mt-4 md:text-2xl">
              {t("app.slogan")}
            </span>
          </h1>

          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.6875rem] font-semibold text-gold-deep [text-shadow:0_1px_3px_rgb(var(--color-background)),0_0_8px_rgb(var(--color-background))] dark:text-gold sm:text-sm md:mt-3 md:gap-x-3 md:text-base">
            {PILLARS.map((pillar, index) => (
              <Fragment key={pillar}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-gold">
                    &#9670;
                  </span>
                )}
                <span>{t(`home.hero.pillars.${pillar}`)}</span>
              </Fragment>
            ))}
          </p>

          <SectionDecoration className="mt-3 md:mt-5" />

          <form onSubmit={handleSearch} className="mx-auto mt-3 max-w-xl md:mt-5" role="search">
            <div className="relative rounded-full border border-gold/40 bg-surface/95 p-1.5 shadow-[var(--card-shadow)] backdrop-blur-sm">
              <Input
                type="search"
                placeholder={t("home.hero.searchPlaceholderCompact")}
                aria-label={t("home.hero.searchPlaceholder")}
                title={t("home.hero.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 border-0 bg-transparent pe-14 text-base shadow-none focus-visible:ring-0"
                icon={<Search className="h-5 w-5 text-muted" />}
              />
              <button
                type="submit"
                className="absolute end-1.5 top-1.5 grid h-11 w-11 place-items-center rounded-full bg-gold text-primary-dark transition-colors hover:bg-gold-deep hover:text-white"
                aria-label={t("nav.search")}
              >
                <ArrowUpLeft className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* The service map and the two doors share this canvas. */}
      <div className="relative z-10">{children}</div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gold/40" />
    </section>
  );
}

