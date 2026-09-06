import { useId } from "react";

/** Keep the complete skyline above a paper-and-embroidery canvas of any height. */
export function HomeBackdrop() {
  const patternId = `home-stitch-${useId().replace(/:/g, "")}`;

  return (
    <div aria-hidden="true" className="home-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="home-backdrop-paper absolute inset-0" />
      <img
        src="/images/hero-frame-start.jpg"
        alt=""
        width={540}
        height={390}
        decoding="async"
        className="home-backdrop-frame home-backdrop-frame-left absolute left-0 top-0 h-auto w-1/2 object-contain dark:opacity-40"
      />
      <img
        src="/images/hero-frame-end.jpg"
        alt=""
        width={536}
        height={390}
        decoding="async"
        className="home-backdrop-frame home-backdrop-frame-right absolute right-0 top-0 h-auto w-1/2 object-contain dark:opacity-40"
      />

      <svg className="home-backdrop-stitches absolute w-full text-gold" width="100%" height="100%" fill="none">
        <defs>
          <pattern id={patternId} width="32" height="64" patternUnits="userSpaceOnUse">
            <path d="m16 6 10 10-10 10L6 16Zm0 32 10 10-10 10L6 48Z" stroke="currentColor" strokeWidth="1" />
            <path d="m12 12 8 8m0-8-8 8m0 28 8 8m0-8-8 8M16 28v8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1 0v64M31 0v64" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="0" width="32" height="100%" fill={`url(#${patternId})`} />
        <svg x="100%" className="overflow-visible">
          <rect x="-32" width="32" height="100%" fill={`url(#${patternId})`} />
        </svg>
      </svg>

      {(["left", "right"] as const).map((side) => (
        <img
          key={side}
          src="/images/olive-branch-realistic.png"
          alt=""
          width={1254}
          height={1254}
          loading="lazy"
          decoding="async"
          className={`home-backdrop-olive home-backdrop-olive-${side} absolute bottom-0 h-auto w-28 object-contain sm:w-44 lg:w-56`}
        />
      ))}
    </div>
  );
}
