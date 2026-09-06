import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Library, MonitorPlay, Video } from "lucide-react";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";

/**
 * The three ways capacity building is delivered.
 *
 * Nothing in the course data distinguishes them - there is no delivery-mode
 * field - so these are not filters pretending to be filters. Self-paced material
 * points at the course listing further down this page, which is real; the two
 * scheduled tracks point at support, because registering for them is a
 * conversation until there is scheduling data to link to.
 */
const PROGRAMS = [
  { key: "materials", id: "programs-materials", to: "#courses", icon: Library },
  { key: "live", id: "programs-live", to: "/support", icon: Video },
  { key: "interactive", id: "programs-interactive", to: "/support", icon: MonitorPlay },
] as const;

export function CapacityPrograms() {
  const { t } = useTranslation();

  return (
    // scroll-mt clears the sticky site header plus the section sub-nav when a
    // #programs-* link lands here.
    <section id="programs" className="scroll-mt-32 border-b border-gold-light/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <SectionDecoration className="mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            {t("lms.programs.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">{t("lms.programs.subtitle")}</p>
        </div>

        <ul className="grid gap-5 md:grid-cols-3">
          {PROGRAMS.map((program, index) => (
            <li
              key={program.key}
              id={program.id}
              className="hover-card scroll-mt-32 flex flex-col gap-4 rounded-2xl border border-gold/25 bg-primary-dark p-6 text-white"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-gold ring-1 ring-gold/40">
                  <program.icon className="h-6 w-6" />
                </span>
                <span
                  dir="ltr"
                  className="grid h-7 w-7 place-items-center rounded-full bg-gold text-xs font-bold text-primary-dark"
                >
                  {index + 1}
                </span>
              </div>

              <h3 className="font-heading text-lg font-bold">
                {t(`lms.programs.${program.key}.title`)}
              </h3>
              <p className="flex-1 text-sm leading-6 text-white/70">
                {t(`lms.programs.${program.key}.description`)}
              </p>

              {program.to.startsWith("#") ? (
                <a
                  href={program.to}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light"
                >
                  {t(`lms.programs.${program.key}.cta`)}
                  <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
                </a>
              ) : (
                <Link
                  to={program.to}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light"
                >
                  {t(`lms.programs.${program.key}.cta`)}
                  <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
