import { ReactNode } from "react";

interface SectionHeroProps {
  /** The section's number in the platform map, as the owner set them out. */
  number: number;
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

/** The shared banner every service section opens with. */
export function SectionHero({ number, icon, title, description, children }: SectionHeroProps) {
  return (
    <section className="relative overflow-hidden bg-primary-dark py-10 text-white md:py-14">
      <div
        className="absolute inset-0 opacity-[.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.9) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="container-app relative">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-gold/40 bg-white/10 text-gold backdrop-blur-sm">
            {icon}
            <span className="absolute -bottom-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-primary-dark">
              {number}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75 md:text-base">{description}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gold/40" />
    </section>
  );
}
