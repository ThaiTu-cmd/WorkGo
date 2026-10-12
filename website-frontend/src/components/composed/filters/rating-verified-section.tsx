"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Star, ShieldCheck } from "lucide-react";

export const RATING_OPTIONS = [
  { label: "Tất cả đánh giá", value: undefined },
  { label: "4.5 sao trở lên", value: 4.5 },
  { label: "4.9 sao trở lên", value: 4.9 },
];

export interface RatingVerifiedSectionProps {
  minRating?: number;
  onlyVerified?: boolean;
  onRatingChange: (minRating?: number) => void;
  onVerifiedChange: (onlyVerified?: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function RatingVerifiedSection({
  minRating,
  onlyVerified,
  onRatingChange,
  onVerifiedChange,
  isOpen,
  onToggle,
}: RatingVerifiedSectionProps) {
  return (
    <>
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-fg-tertiary" />
            Đánh giá đối tác
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
        {isOpen && (
          <div className="mt-2 space-y-1.5">
            {RATING_OPTIONS.map((opt) => (
              <label
                key={opt.label}
                className="flex items-center gap-2 text-xs text-fg-secondary cursor-pointer hover:text-fg"
              >
                <input
                  type="radio"
                  name="minRating"
                  checked={minRating === opt.value}
                  onChange={() => onRatingChange(opt.value)}
                  className="text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pt-1">
        <label className="flex items-center justify-between text-xs font-semibold text-fg cursor-pointer">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success dark:text-emerald-400" />
            Chỉ đối tác đã xác minh
          </span>
          <input
            type="checkbox"
            checked={Boolean(onlyVerified)}
            onChange={(e) =>
              onVerifiedChange(e.target.checked || undefined)
            }
            className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
          />
        </label>
      </div>
    </>
  );
}
