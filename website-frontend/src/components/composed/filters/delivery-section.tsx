"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

export const DELIVERY_OPTIONS = [
  { label: "Bất kỳ lúc nào", value: undefined },
  { label: "Dưới 3 ngày", value: 3 },
  { label: "Dưới 7 ngày", value: 7 },
];

export interface DeliverySectionProps {
  value?: number;
  onChange: (deliveryTime?: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function DeliverySection({
  value,
  onChange,
  isOpen,
  onToggle,
}: DeliverySectionProps) {
  return (
    <div className="border-b border-border/70 pb-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-fg-tertiary" />
          Thời gian hoàn thành
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-fg-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-fg-tertiary" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-1.5">
          {DELIVERY_OPTIONS.map((opt) => (
            <label
              key={opt.label}
              className="flex items-center gap-2 text-xs text-fg-secondary cursor-pointer hover:text-fg"
            >
              <input
                type="radio"
                name="deliveryTime"
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
