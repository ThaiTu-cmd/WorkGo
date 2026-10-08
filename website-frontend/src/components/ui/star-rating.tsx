"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  count?: number;
}

export function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = "md",
  showValue = false,
  className,
  count,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const starSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-1"
        role={readOnly ? undefined : "radiogroup"}
        aria-label="Đánh giá chất lượng"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(activeValue);

          if (readOnly) {
            return (
              <Star
                key={star}
                className={cn(
                  starSizes[size],
                  filled ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"
                )}
                aria-hidden="true"
              />
            );
          }

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`Đánh giá ${star} trên 5 sao`}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="p-0.5 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  starSizes[size],
                  filled ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-fg ml-1">
          {value.toFixed(1)}
          {count !== undefined && (
            <span className="text-xs text-fg-secondary font-normal ml-1">
              ({count})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
