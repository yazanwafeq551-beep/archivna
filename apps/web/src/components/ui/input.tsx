import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-muted">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
            icon && "ps-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          dir="auto"
          {...props}
        />
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
