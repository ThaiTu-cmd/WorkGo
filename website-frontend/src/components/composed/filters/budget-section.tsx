"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PRICE_PRESETS = [
  { label: "< 500.000₫", min: 0, max: 500000 },
  { label: "500k - 2 triệu", min: 500000, max: 2000000 },
  { label: "> 2 triệu", min: 2000000, max: undefined },
];

export interface BudgetSectionProps {
  budgetMin?: number;
  budgetMax?: number;
  onChange: (min?: number, max?: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function BudgetSection({
  budgetMin,
  budgetMax,
  onChange,
  isOpen,
  onToggle,
}: BudgetSectionProps) {
  const t = useTranslations("posts");

  const [minInput, setMinInput] = React.useState<string | null>(null);
  const [maxInput, setMaxInput] = React.useState<string | null>(null);

  const displayMin =
    minInput !== null
      ? minInput
      : budgetMin !== undefined
      ? String(budgetMin)
      : "";
  const displayMax =
    maxInput !== null
      ? maxInput
      : budgetMax !== undefined
      ? String(budgetMax)
      : "";

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = displayMin ? Number(displayMin) : undefined;
    const maxVal = displayMax ? Number(displayMax) : undefined;
    setMinInput(null);
    setMaxInput(null);
    onChange(minVal, maxVal);
  };

  const handlePresetPrice = (min?: number, max?: number) => {
    setMinInput(null);
    setMaxInput(null);
    onChange(min, max);
  };

  return (
    <div className="border-b border-border/70 pb-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-fg-tertiary" />
          {t("budget")}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-fg-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-fg-tertiary" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2.5 space-y-3">
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset) => {
              const isSelected =
                budgetMin === preset.min && budgetMax === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    isSelected
                      ? handlePresetPrice(undefined, undefined)
                      : handlePresetPrice(preset.min, preset.max)
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border",
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : "bg-surface border-border text-fg-secondary hover:border-border-strong hover:text-fg"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Range Form */}
          <form onSubmit={handleApplyCustomPrice} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t("budgetMin")}
                value={displayMin}
                onChange={(e) => setMinInput(e.target.value)}
                className="text-xs h-9"
              />
              <Input
                type="number"
                placeholder={t("budgetMax")}
                value={displayMax}
                onChange={(e) => setMaxInput(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full text-xs h-8"
            >
              Áp dụng khoảng giá
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
