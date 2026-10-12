"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Star,
  ShieldCheck,
  Clock,
  DollarSign,
  Grid,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryItem } from "@/lib/adapters/catalog";
import { cn } from "@/lib/utils";

export interface FilterValues {
  q?: string;
  category?: string;
  executionType?: string;
  budgetMin?: number;
  budgetMax?: number;
  sort?: string;
  deliveryTime?: number;
  minRating?: number;
  onlyVerified?: boolean;
}

export interface FilterSidebarProps {
  categories: CategoryItem[];
  values: FilterValues;
  onChange: (newValues: FilterValues) => void;
  onClear: () => void;
  className?: string;
}

const EXECUTION_OPTIONS = [
  { value: "ALL", label: "Tất cả hình thức" },
  { value: "DIGITAL", label: "Trực tuyến (Digital)" },
  { value: "ONSITE", label: "Tại chỗ (Onsite)" },
  { value: "DELIVERY", label: "Giao nhận (Delivery)" },
  { value: "APPOINTMENT", label: "Theo lịch hẹn" },
  { value: "HOURLY", label: "Theo giờ" },
  { value: "PROJECT", label: "Trọn gói dự án" },
];

const PRICE_PRESETS = [
  { label: "< 500.000₫", min: 0, max: 500000 },
  { label: "500k - 2 triệu", min: 500000, max: 2000000 },
  { label: "> 2 triệu", min: 2000000, max: undefined },
];

const DELIVERY_OPTIONS = [
  { label: "Bất kỳ lúc nào", value: undefined },
  { label: "Dưới 3 ngày", value: 3 },
  { label: "Dưới 7 ngày", value: 7 },
];

const RATING_OPTIONS = [
  { label: "Tất cả đánh giá", value: undefined },
  { label: "4.5 sao trở lên", value: 4.5 },
  { label: "4.9 sao trở lên", value: 4.9 },
];

export function FilterSidebar({
  categories,
  values,
  onChange,
  onClear,
  className,
}: FilterSidebarProps) {
  const t = useTranslations("posts");
  const tCommon = useTranslations("common");

  // Collapsible section states
  const [catOpen, setCatOpen] = React.useState(true);
  const [typeOpen, setTypeOpen] = React.useState(true);
  const [priceOpen, setPriceOpen] = React.useState(true);
  const [deliveryOpen, setDeliveryOpen] = React.useState(true);
  const [ratingOpen, setRatingOpen] = React.useState(true);

  // Local inputs for min / max price (overrides while typing)
  const [minInput, setMinInput] = React.useState<string | null>(null);
  const [maxInput, setMaxInput] = React.useState<string | null>(null);

  const displayMin =
    minInput !== null
      ? minInput
      : values.budgetMin !== undefined
      ? String(values.budgetMin)
      : "";
  const displayMax =
    maxInput !== null
      ? maxInput
      : values.budgetMax !== undefined
      ? String(values.budgetMax)
      : "";

  const hasActiveFilters = Boolean(
    values.category ||
    values.executionType ||
    values.budgetMin !== undefined ||
    values.budgetMax !== undefined ||
    values.deliveryTime !== undefined ||
    values.minRating !== undefined ||
    values.onlyVerified
  );

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = displayMin ? Number(displayMin) : undefined;
    const maxVal = displayMax ? Number(displayMax) : undefined;
    setMinInput(null);
    setMaxInput(null);
    onChange({
      ...values,
      budgetMin: minVal,
      budgetMax: maxVal,
    });
  };

  const handlePresetPrice = (min?: number, max?: number) => {
    setMinInput(null);
    setMaxInput(null);
    onChange({
      ...values,
      budgetMin: min,
      budgetMax: max,
    });
  };

  return (
    <aside className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2 font-semibold text-sm text-fg">
          <Filter className="h-4 w-4 text-primary" />
          <span>{tCommon("filter")}</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMinInput(null);
              setMaxInput(null);
              onClear();
            }}
            className="text-xs text-danger hover:text-danger h-7 px-2 gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{tCommon("clearFilters")}</span>
          </Button>
        )}
      </div>

      {/* 1. Category Filter Section */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setCatOpen(!catOpen)}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-fg-tertiary" />
            {t("category")}
          </span>
          {catOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
        {catOpen && (
          <div className="mt-2.5 space-y-1">
            <select
              value={values.category || ""}
              onChange={(e) =>
                onChange({ ...values, category: e.target.value || undefined })
              }
              className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">{t("allCategories")}</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Execution Type Filter Section */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setTypeOpen(!typeOpen)}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fg-tertiary" />
            {t("executionType")}
          </span>
          {typeOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
        {typeOpen && (
          <div className="mt-2.5 space-y-1">
            <select
              value={values.executionType || ""}
              onChange={(e) =>
                onChange({
                  ...values,
                  executionType:
                    e.target.value === "ALL" || !e.target.value
                      ? undefined
                      : e.target.value,
                })
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

      {/* 3. Budget / Price Section with Quick Presets */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-fg-tertiary" />
            {t("budget")}
          </span>
          {priceOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
        {priceOpen && (
          <div className="mt-2.5 space-y-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const isSelected =
                  values.budgetMin === preset.min &&
                  values.budgetMax === preset.max;
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

      {/* 4. Delivery Time Section */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setDeliveryOpen(!deliveryOpen)}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-fg-tertiary" />
            Thời gian hoàn thành
          </span>
          {deliveryOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
        {deliveryOpen && (
          <div className="mt-2 space-y-1.5">
            {DELIVERY_OPTIONS.map((opt) => (
              <label
                key={opt.label}
                className="flex items-center gap-2 text-xs text-fg-secondary cursor-pointer hover:text-fg"
              >
                <input
                  type="radio"
                  name="deliveryTime"
                  checked={values.deliveryTime === opt.value}
                  onChange={() => onChange({ ...values, deliveryTime: opt.value })}
                  className="text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 5. Rating Section */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setRatingOpen(!ratingOpen)}
          className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-fg-tertiary" />
            Đánh giá đối tác
          </span>
          {ratingOpen ? (
            <ChevronUp className="h-4 w-4 text-fg-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-tertiary" />
          )}
        </button>
        {ratingOpen && (
          <div className="mt-2 space-y-1.5">
            {RATING_OPTIONS.map((opt) => (
              <label
                key={opt.label}
                className="flex items-center gap-2 text-xs text-fg-secondary cursor-pointer hover:text-fg"
              >
                <input
                  type="radio"
                  name="minRating"
                  checked={values.minRating === opt.value}
                  onChange={() => onChange({ ...values, minRating: opt.value })}
                  className="text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 6. Verified Provider Toggle */}
      <div className="pt-1">
        <label className="flex items-center justify-between text-xs font-semibold text-fg cursor-pointer">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00732E]" />
            Chỉ đối tác đã xác minh
          </span>
          <input
            type="checkbox"
            checked={Boolean(values.onlyVerified)}
            onChange={(e) =>
              onChange({ ...values, onlyVerified: e.target.checked || undefined })
            }
            className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
          />
        </label>
      </div>
    </aside>
  );
}

export default FilterSidebar;
