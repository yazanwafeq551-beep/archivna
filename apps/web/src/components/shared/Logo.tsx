import { useTranslation } from "react-i18next";

/**
 * "brand" is the wordmark on paper. "onDark" lifts it to ivory for the dark
 * green bar and footer. The emblem itself carries its own ring and ground, so
 * it needs no tone of its own.
 */
type LogoTone = "brand" | "onDark";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  tone?: LogoTone;
}

/**
 * The platform emblem, everywhere it appears: the header, the account pages,
 * the dashboard rail, the certificate. One file, so it can never drift between
 * places the way a hand-drawn copy would.
 */
export function BrandMark({
  className = "",
  ariaLabel,
}: {
  className?: string;
  ariaLabel?: string;
  /** Accepted for call-site symmetry with Logo; the emblem is self-contained. */
  tone?: LogoTone;
}) {
  return (
    <img
      src="/images/acp-emblem.png"
      width={152}
      height={152}
      alt={ariaLabel ?? ""}
      aria-hidden={ariaLabel ? undefined : true}
      className={`rounded-full object-cover ${className}`}
    />
  );
}

export function Logo({ className = "", variant = "full", size = "md", tone = "brand" }: LogoProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");
  const sizes = {
    sm: { iconClass: "h-9 w-9", wordmark: isArabic ? "text-[1.25rem]" : "text-[1.05rem]" },
    md: { iconClass: "h-11 w-11", wordmark: isArabic ? "text-[1.55rem]" : "text-[1.3rem]" },
    lg: { iconClass: "h-14 w-14", wordmark: isArabic ? "text-[1.95rem]" : "text-[1.65rem]" },
  };
  const s = sizes[size];

  if (variant === "icon") {
    return <BrandMark className={`${s.iconClass} shrink-0`} ariaLabel={t("app.name")} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} dir={isArabic ? "rtl" : "ltr"}>
      <BrandMark className={`${s.iconClass} shrink-0`} />
      <span
        className={`${s.wordmark} whitespace-nowrap font-bold leading-none ${
          tone === "onDark" ? "text-white" : "text-primary"
        } ${isArabic ? "font-brand" : "font-display tracking-[-0.035em]"}`}
      >
        {isArabic ? "أرشيفنا" : "Arsheefna"}
      </span>
    </div>
  );
}
