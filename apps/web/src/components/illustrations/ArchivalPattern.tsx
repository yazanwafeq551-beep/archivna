interface ArchivalPatternProps {
  className?: string;
  variant?: "dots" | "diamond" | "wave";
}

export function ArchivalPattern({ className = "", variant = "dots" }: ArchivalPatternProps) {
  if (variant === "diamond") {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="diamond-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="#C6A15B" opacity="0.04" />
            <path d="M20 5 L35 20 L20 35 L5 20 Z" fill="#0F4C45" opacity="0.03" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#diamond-pattern)" />
      </svg>
    );
  }

  if (variant === "wave") {
    return (
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          d="M0 60 C120 20 240 100 360 60 C480 20 600 100 720 60 C840 20 960 100 1080 60 C1200 20 1320 100 1440 60 L1440 120 L0 120 Z"
          fill="#0F4C45"
          opacity="0.03"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="dot-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1.5" fill="#C6A15B" opacity="0.06" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dot-pattern)" />
    </svg>
  );
}
