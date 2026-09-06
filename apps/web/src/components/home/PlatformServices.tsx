import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PLATFORM_SECTIONS, PLATFORM_SECTION_CHILDREN, type PlatformSectionKey } from "@/lib/constants";
import { ServiceCard } from "./ServiceCard";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";
import { cn } from "@/lib/utils";

/** Must match the card grid's `gap-3` and the panel's `p-5`. */
const GRID_GAP = "0.75rem";
const PANEL_PADDING = "1.25rem";

/**
 * Centre of column `index` in an `n`-column grid, as a CSS length from the
 * inline start. A plain (index + 0.5) / n percentage is wrong once the grid
 * has gaps - it drifts by half a gap per column - and the connector is a line
 * whose whole job is to land exactly on something.
 */
function columnCentre(index: number, n: number, padding = "0rem") {
  const column = `((100% - 2 * ${padding} - ${n - 1} * ${GRID_GAP}) / ${n})`;
  return `calc(${padding} + ${index} * (${column} + ${GRID_GAP}) + ${column} / 2)`;
}
/**
 * The platform map as the project owner drew it: seven numbered services in one
 * row, alternating ink and paper, two of which open onto services of their own.
 *
 * Seven is prime, so there is no four-column step - it would always orphan a
 * card. The ladder is 2 / 3 / 7, with the seventh centred at the three-column
 * width rather than stretched.
 */
export function PlatformServices() {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState<PlatformSectionKey | null>(null);
  const panelId = `services-panel-${useId().replace(/:/g, "")}`;
  const cardsRef = useRef<HTMLUListElement>(null);

  const openIndex = PLATFORM_SECTIONS.findIndex((s) => s.key === openKey);
  const openSection = PLATFORM_SECTIONS.find((s) => s.key === openKey);
  const openChildren = openKey ? PLATFORM_SECTION_CHILDREN[openKey] : undefined;

  const close = () => {
    setOpenKey(null);
    // Escape should hand focus back to the toggle that opened the panel, not
    // drop it at the top of the document.
    cardsRef.current
      ?.querySelector<HTMLButtonElement>(`button[aria-expanded="true"]`)
      ?.focus();
  };

  return (
    <section className="relative pt-10 md:pt-12">
      <div className="container-app">
        {/* The design runs the cards straight on from the masthead ornament.
            The heading stays for the document outline and for screen readers,
            which should not have to infer what this row of links is. */}
        <h2 className="sr-only">{t("sections.title")}</h2>

        <ul
          ref={cardsRef}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7"
          onKeyDown={(e) => {
            if (e.key === "Escape" && openKey) close();
          }}
        >
          {PLATFORM_SECTIONS.map((section, index) => {
            const children = PLATFORM_SECTION_CHILDREN[section.key];
            const isOpen = openKey === section.key;

            return (
              <ServiceCard
                key={section.key}
                section={section}
                // Card 1 sits at the row's start - the right, in Arabic - and
                // the design opens the run on ink.
                ink={index % 2 === 0}
                hasChildren={Boolean(children?.length)}
                isOpen={isOpen}
                onToggle={() => (isOpen ? close() : setOpenKey(section.key))}
                panelId={panelId}
                className={
                  // The seventh card has no partner: full width at two columns,
                  // centred at three, an ordinary cell in the row of seven.
                  section.number === 7
                    ? "col-span-2 sm:col-span-1 sm:col-start-2 xl:col-span-1 xl:col-start-auto"
                    : undefined
                }
              />
            );
          })}

          {openSection && openChildren && (
            // A full-width row rendered after all seven cards. Grid keeps DOM
            // order, so the panel lands directly beneath the row whichever card
            // is open, at every breakpoint.
            <li className="col-span-full animate-slide-up">
              <div
                id={panelId}
                role="region"
                aria-label={t(`sections.${openSection.key}.title`)}
                className="relative mt-8 rounded-2xl border border-gold/30 bg-muted-bg/40 p-5 dark:bg-white/[.04]"
              >
                {/* The elbow. It only means anything at the width where all
                    seven cards share one row - below that the open card sits
                    rows away and a line to it would point at a stranger.

                    The panel spans the same width as the card row, so the
                    card centres can be computed against it. The rail is
                    stretched to reach whichever is further out, the card or
                    the outermost child, so the stem always lands on it. All
                    of it is expressed as logical inline insets, which mirror
                    themselves in Arabic. */}
                <div aria-hidden="true" className="absolute inset-x-0 -top-4 hidden h-4 xl:block">
                  {(() => {
                    const card = columnCentre(openIndex, PLATFORM_SECTIONS.length);
                    const childEdge = columnCentre(0, openChildren.length, PANEL_PADDING);
                    return (
                      <>
                        <span
                          className="absolute top-0 h-px bg-gold/50"
                          style={{
                            insetInlineStart: `min(${card}, ${childEdge})`,
                            insetInlineEnd: `min(calc(100% - ${card}), ${childEdge})`,
                          }}
                        />
                        {/* A tick rising off the rail under the open card.
                            The rail already ends on that card's centre, so
                            this points at it without needing to know how far
                            away the row happens to be. */}
                        <span
                          className="absolute -top-3 h-3 w-px bg-gold/50"
                          style={{ insetInlineStart: card }}
                        />
                      </>
                    );
                  })()}
                  <div
                    className="grid h-full gap-3 px-5"
                    style={{ gridTemplateColumns: `repeat(${openChildren.length}, minmax(0, 1fr))` }}
                  >
                    {openChildren.map((child) => (
                      <span key={child.key} className="mx-auto h-full w-px bg-gold/50" />
                    ))}
                  </div>
                </div>

                <h3 className="mb-4 text-center font-heading text-lg font-bold text-foreground">
                  {t(`sections.${openSection.key}.title`)}
                </h3>

                <ul
                  className={cn(
                    "grid gap-3",
                    openChildren.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  )}
                >
                  {openChildren.map((child) => (
                    <li key={child.key}>
                      <Link
                        to={child.path}
                        className="hover-card flex h-full items-center gap-3 rounded-xl border border-gold/25 bg-primary-dark p-4 text-white"
                      >
                        <span
                          dir="ltr"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-primary-dark"
                        >
                          {child.code}
                        </span>
                        <span className="font-heading text-sm font-bold leading-snug">
                          {t(`sections.${openSection.key}.children.${child.key}`)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
