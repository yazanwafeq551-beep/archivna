import { Fragment, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";

const PILLARS = ["past", "present", "future"] as const;

/** Fades the photograph out towards the page centre and towards the fold. */
const frameMask = (inner: "right" | "left") => ({
  maskImage: `linear-gradient(to ${inner}, #000 45%, transparent 100%), linear-gradient(to bottom, #000 62%, transparent 100%)`,
  WebkitMaskImage: `linear-gradient(to ${inner}, #000 45%, transparent 100%), linear-gradient(to bottom, #000 62%, transparent 100%)`,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
});

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
    <section className="relative isolate overflow-hidden bg-background pb-12 pt-12 dark:bg-primary-dark md:pb-16 md:pt-14">
      <img
        src="/images/hero-frame-start.jpg"
        alt=""
        width={540}
        height={390}
        decoding="async"
        className="pointer-events-none absolute left-0 top-0 -z-10 h-[22rem] w-16 object-cover object-left opacity-90 dark:opacity-40 sm:w-40 sm:h-[28rem] lg:h-[40rem] lg:w-[22rem] xl:w-[27rem]"
        style={frameMask("right")}
      />
      <img
        src="/images/hero-frame-end.jpg"
        alt=""
        width={536}
        height={390}
        decoding="async"
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[22rem] w-16 object-cover object-right opacity-90 dark:opacity-40 sm:w-40 sm:h-[28rem] lg:h-[40rem] lg:w-[22rem] xl:w-[27rem]"
        style={frameMask("left")}
      />

      {/* Keeps the masthead legible over the collage at every width, without
          flattening the artwork at the edges. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(58%_46%_at_50%_34%,rgb(var(--color-background))_42%,transparent_100%)] dark:bg-[radial-gradient(58%_46%_at_50%_34%,rgb(var(--color-primary-dark))_42%,transparent_100%)]"
      />

      <div className="container-app relative z-10">
        <div className="animate-fade-in mx-auto max-w-3xl text-center">
          <img
            src="/images/acp-emblem.png"
            alt={t("home.hero.logoAlt")}
            width={168}
            height={168}
            className="mx-auto h-24 w-24 rounded-full md:h-28 md:w-28"
          />

          <h1 className="mt-5">
            <span className="block font-brand text-5xl font-bold leading-[1.05] text-primary md:text-7xl lg:text-8xl">
              {t("app.name")}
            </span>
            <span className="mt-4 block font-heading text-lg font-bold text-primary md:text-2xl">
              {t("app.slogan")}
            </span>
          </h1>

          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold text-gold-deep dark:text-gold md:text-base">
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

          <SectionDecoration className="mt-5" />

          <form onSubmit={handleSearch} className="mx-auto mt-5 max-w-xl">
            <div className="relative rounded-full border border-gold/40 bg-surface/95 p-1.5 shadow-[var(--card-shadow)] backdrop-blur-sm">
              <Input
                type="search"
                placeholder={t("home.hero.searchPlaceholder")}
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

