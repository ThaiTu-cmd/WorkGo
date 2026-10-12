"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export const EXECUTION_OPTIONS = [
  { value: "ALL", label: "Tất cả hình thức" },
  { value: "DIGITAL", label: "Trực tuyến (Digital)" },
  { value: "ONSITE", label: "Tại chỗ (Onsite)" },
  { value: "DELIVERY", label: "Giao nhận (Delivery)" },
  { value: "APPOINTMENT", label: "Theo lịch hẹn" },
  { value: "HOURLY", label: "Theo giờ" },
  { value: "PROJECT", label: "Trọn gói dự án" },
];

export interface ExecutionSectionProps {
  value?: string;
  onChange: (executionType?: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ExecutionSection({
  value,
  onChange,
  isOpen,
  onToggle,
}: ExecutionSectionProps) {
  const t = useTranslations("posts");

  return (
    <div className="border-b border-border/70 pb-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fg-tertiary" />
          {t("executionType")}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-fg-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-fg-tertiary" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2.5 space-y-1">
          <select
            value={value || ""}
            onChange={(e) =>
              onChange(
                e.target.value === "ALL" || !e.target.value
                  ? undefined
                  : e.target.value
              )
            }
            className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {EXECUTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
