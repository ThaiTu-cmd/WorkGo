"use client";

import * as React from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

export const PROVINCE_OPTIONS = [
  { value: "ALL", label: "Tất cả địa điểm" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Hải Phòng", label: "Hải Phòng" },
  { value: "Cần Thơ", label: "Cần Thơ" },
] as const;

export interface LocationSectionProps {
  value?: string;
  visible?: boolean;
  onChange: (location?: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function LocationSection({
  value,
  visible = true,
  onChange,
  isOpen = true,
  onToggle,
}: LocationSectionProps) {
  if (!visible) return null;

  return (
    <div className="border-b border-border/70 pb-3">
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-fg-tertiary" />
            Khu vực làm việc
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 py-1 text-sm font-semibold text-fg">
          <MapPin className="h-4 w-4 text-fg-tertiary" />
          Khu vực làm việc
        </div>
      )}

      {isOpen && (
        <div className="mt-2.5 space-y-1">
          <select
            value={value || "ALL"}
            onChange={(e) =>
              onChange(
                e.target.value === "ALL" || !e.target.value
                  ? undefined
                  : e.target.value
              )
            }
            className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            aria-label="Chọn khu vực làm việc"
          >
            {PROVINCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-fg-tertiary mt-1">
            * Áp dụng khi chọn hình thức Tại chỗ (ONSITE) hoặc Giao nhận (DELIVERY)
          </p>
        </div>
      )}
    </div>
  );
}
