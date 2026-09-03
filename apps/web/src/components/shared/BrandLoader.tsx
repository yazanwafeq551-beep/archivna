interface BrandLoaderProps {
  className?: string;
  label?: string;
}

export function BrandLoader({ className = "", label }: BrandLoaderProps) {
  return <img src="/loader-mark.svg" alt={label ?? ""} aria-hidden={label ? undefined : true} className={className} />;
}
