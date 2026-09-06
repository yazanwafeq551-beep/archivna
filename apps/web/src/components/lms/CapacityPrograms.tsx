import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Library, MonitorPlay, Video } from "lucide-react";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";
import { cn } from "@/lib/utils";

/**
 * The three ways capacity building is delivered.
 *
 * Only the first is built: it opens onto the training material, which is the
 * course catalogue. The two scheduled tracks are named here so the section is
 * complete, and say plainly that they are not open yet rather than linking
 * somewhere that cannot serve them.
 */
const PROGRAMS = [
  { key: "materials", id: "programs-materials", to: "/lms/materials", icon: Library },
  { key: "live", id: "programs-live", to: null, icon: Video },
  { key: "interactive", id: "programs-interactive", to: null, icon: MonitorPlay },
] as const;

export function CapacityPrograms() {
  const { t } = useTranslation();

  return (
    <section id="programs" className="scroll-mt-32 py-12 md:py-16">
      <div className="container-app">
        <div className="mb-10 text-center">
          <SectionDecoration className="mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            {t("lms.programs.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">{t("lms.programs.subtitle")}</p>
        </div>

        <ul className="grid gap-5 md:grid-cols-3">
          {PROGRAMS.map((program, index) => {
            const body = (
              <>
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

                {program.to ? (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
                    {t(`lms.programs.${program.key}.cta`)}
                    <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold">
                    {t("lms.programs.comingSoon")}
                  </span>
                )}
              </>
            );

            const shell = cn(
              "flex h-full flex-col gap-4 rounded-2xl border border-gold/25 bg-primary-dark p-6 text-white",
              program.to ? "hover-card" : "opacity-90"
            );

            return (
              <li key={program.key} id={program.id} className="scroll-mt-32">
                {program.to ? (
                  <Link to={program.to} className={shell}>
                    {body}
                  </Link>
                ) : (
                  <div className={shell}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
