import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PLATFORM_SECTIONS } from "@/lib/constants";

interface ServiceCardProps {
  section: (typeof PLATFORM_SECTIONS)[number];
  /** Dark card, alternating with the paper ones down the row. */
  ink: boolean;
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  className?: string;
}

/**
 * One of the seven services: the medallion the designer drew for it, the short
 * name, and the owner's own number at the foot.
 *
 * The card navigates and the chevron discloses, and those are two different
 * jobs. A whole-card toggle would cost the section its link; a <button> nested
 * in the <a> would be invalid. So the link stretches itself over the card with
 * a pseudo-element and the chevron sits beside it, raised above that overlay.
 */
export function ServiceCard({
  section,
  ink,
  hasChildren,
  isOpen,
  onToggle,
  panelId,
  className,
}: ServiceCardProps) {
  const { t } = useTranslation();
  const description = t(`sections.${section.key}.description`);

  return (
    <li
      className={cn(
        "hover-card group relative flex min-w-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center sm:gap-3 sm:p-4",
        ink
          ? "border-gold/25 bg-primary-dark text-white"
          : "border-border bg-surface text-foreground",
        className
      )}
    >
      <Link
        to={section.path}
        title={description}
        className="flex min-w-0 flex-1 flex-col items-center gap-2 after:absolute after:inset-0 after:rounded-2xl sm:gap-3"
      >
        <span
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full ring-1 transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16",
            ink ? "ring-gold/40" : "ring-gold/30"
          )}
        >
          <img
            src={`/images/service-${section.number}.jpg`}
            alt=""
            width={140}
            height={140}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </span>

        <span className="flex min-h-12 items-center font-heading text-lg font-bold leading-snug sm:text-[1.20rem]">
          {t(`sections.${section.key}.title`)}
        </span>
        <span className="sr-only">{description}</span>
      </Link>

      <div className={cn("relative flex h-11 w-full shrink-0 items-center gap-2", hasChildren ? "justify-between" : "justify-center")}>
        <span
          dir="ltr"
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
            ink ? "bg-gold text-primary-dark" : "bg-primary text-white"
          )}
        >
          {section.number}
        </span>
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className={cn(
              "relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
              ink
                ? "bg-white/10 text-gold hover:bg-white/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            <span className="sr-only">
              {t(isOpen ? "sections.collapse" : "sections.expand", {
                name: t(`sections.${section.key}.title`),
              })}
            </span>
          </button>
        )}
      </div>
    </li>
  );
}

