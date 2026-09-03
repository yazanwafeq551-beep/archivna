import { useTranslation } from "react-i18next";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
}

export function BrandMark({ className = "", ariaLabel }: { className?: string; ariaLabel?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <path d="M12 26 45 8v15L25 34v48H12V26Z" fill="#0F4C45" />
      <path d="M30 35 58 20v57L30 87V35Z" fill="#C6A15B" />
      <path d="M51 45c-10 2-16 8-17 21 8-2 14-8 17-21Zm-16 25c6-8 10-12 16-17" stroke="#0F4C45" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="65" y="34" width="9" height="9" rx="1" fill="#C6A15B" />
      <rect x="72" y="49" width="11" height="11" rx="1" fill="#C6A15B" />
      <rect x="64" y="64" width="8" height="8" rx="1" fill="#C6A15B" />
      <rect x="76" y="72" width="6" height="6" rx="1" fill="#C6A15B" />
    </svg>
  );
}

export function Logo({ className = "", variant = "full", size = "md" }: LogoProps) {
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
        className={`${s.wordmark} whitespace-nowrap font-bold leading-none text-primary ${isArabic ? "font-brand" : "font-display tracking-[-0.035em]"}`}
      >
        {isArabic ? "أرشيفنا" : "Arsheefna"}
      </span>
    </div>
  );
}
