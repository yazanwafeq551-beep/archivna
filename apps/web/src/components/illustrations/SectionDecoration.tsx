interface SectionDecorationProps {
  className?: string;
}

export function SectionDecoration({ className = "" }: SectionDecorationProps) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden="true">
      <span className="block h-px w-12 bg-gradient-to-l from-gold to-transparent" />
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="currentColor" opacity="0.5" />
      </svg>
      <span className="block h-px w-12 bg-gradient-to-r from-gold to-transparent" />
    </div>
  );
}
