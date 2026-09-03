import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-3",
  lg: "h-4",
};

export function ProgressBar({ value, showLabel, size = "md", className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getBarColor = () => {
    if (clampedValue < 25) return "from-gold to-gold/70";
    if (clampedValue < 50) return "from-gold to-amber-500";
    if (clampedValue < 75) return "from-amber-500 to-emerald-600";
    return "from-emerald-600 to-primary";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative overflow-hidden rounded-full bg-gold-light/50">
        <div
          className={cn(
            "rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
            getBarColor(),
            sizeStyles[size]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-end">
          <span className="text-xs font-semibold text-primary">{Math.round(clampedValue)}%</span>
        </div>
      )}
    </div>
  );
}
