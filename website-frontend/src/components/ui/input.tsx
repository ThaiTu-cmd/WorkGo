import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  suffix?: React.ReactNode;
  prefixIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, suffix, prefixIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {prefixIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-fg-tertiary">
            {prefixIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-control border bg-surface px-3 py-2 text-base md:text-sm text-fg placeholder:text-fg-tertiary transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-fg-tertiary",
            error
              ? "border-danger focus-visible:ring-danger"
              : "border-border-strong focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-primary/70 focus-visible:ring-primary/40 focus-visible:bg-surface",
            prefixIcon && "pl-9",
            suffix && "pr-10",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-sm text-fg-secondary">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
