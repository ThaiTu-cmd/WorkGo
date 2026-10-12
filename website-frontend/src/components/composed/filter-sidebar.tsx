"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Filter, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryItem } from "@/lib/adapters/catalog";
import { cn } from "@/lib/utils";
import { CategorySection } from "./filters/category-section";
import { ExecutionSection } from "./filters/execution-section";
import { BudgetSection } from "./filters/budget-section";
import { DeliverySection } from "./filters/delivery-section";
import { RatingVerifiedSection } from "./filters/rating-verified-section";
import { LocationSection } from "./filters/location-section";

export { ChevronDown, ChevronUp };

export const PRICE_PRESETS = [
  { label: "< 500.000₫", min: 0, max: 500000 },
  { label: "500k - 2 triệu", min: 500000, max: 2000000 },
  { label: "> 2 triệu", min: 2000000, max: undefined },
];

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
  location?: string;
}

export interface FilterSidebarProps {
  categories: CategoryItem[];
  values: FilterValues;
  onChange: (newValues: FilterValues) => void;
  onClear: () => void;
  className?: string;
}

export function FilterSidebar({
  categories,
  values,
  onChange,
  onClear,
  className,
}: FilterSidebarProps) {
  const tCommon = useTranslations("common");

  // Collapsible section states
  const [catOpen, setCatOpen] = React.useState(true);
  const [typeOpen, setTypeOpen] = React.useState(true);
  const [locOpen, setLocOpen] = React.useState(true);
  const [priceOpen, setPriceOpen] = React.useState(true);
  const [deliveryOpen, setDeliveryOpen] = React.useState(true);
  const [ratingOpen, setRatingOpen] = React.useState(true);

  const hasActiveFilters = Boolean(
    values.category ||
    values.executionType ||
    values.location ||
    values.budgetMin !== undefined ||
    values.budgetMax !== undefined ||
    values.deliveryTime !== undefined ||
    values.minRating !== undefined ||
    values.onlyVerified
  );

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
            onClick={onClear}
            className="text-xs text-danger hover:text-danger h-7 px-2 gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{tCommon("clearFilters")}</span>
          </Button>
        )}
      </div>

      {/* 1. Category Filter Section */}
      <CategorySection
        categories={categories}
        value={values.category}
        onChange={(category) => onChange({ ...values, category })}
        isOpen={catOpen}
        onToggle={() => setCatOpen(!catOpen)}
      />

      {/* 2. Execution Type Filter Section */}
      <ExecutionSection
        value={values.executionType}
        onChange={(executionType) => onChange({ ...values, executionType })}
        isOpen={typeOpen}
        onToggle={() => setTypeOpen(!typeOpen)}
      />

      {/* Location Filter Section (Visible when ONSITE or DELIVERY) */}
      <LocationSection
        value={values.location}
        visible={values.executionType === "ONSITE" || values.executionType === "DELIVERY"}
        onChange={(location) => onChange({ ...values, location })}
        isOpen={locOpen}
        onToggle={() => setLocOpen(!locOpen)}
      />

      {/* 3. Budget / Price Section */}
      <BudgetSection
        budgetMin={values.budgetMin}
        budgetMax={values.budgetMax}
        onChange={(budgetMin, budgetMax) =>
          onChange({ ...values, budgetMin, budgetMax })
        }
        isOpen={priceOpen}
        onToggle={() => setPriceOpen(!priceOpen)}
      />

      {/* 4. Delivery Time Section */}
      <DeliverySection
        value={values.deliveryTime}
        onChange={(deliveryTime) => onChange({ ...values, deliveryTime })}
        isOpen={deliveryOpen}
        onToggle={() => setDeliveryOpen(!deliveryOpen)}
      />

      {/* 5. Rating & Verified Provider Section */}
      <RatingVerifiedSection
        minRating={values.minRating}
        onlyVerified={values.onlyVerified}
        onRatingChange={(minRating) => onChange({ ...values, minRating })}
        onVerifiedChange={(onlyVerified) => onChange({ ...values, onlyVerified })}
        isOpen={ratingOpen}
        onToggle={() => setRatingOpen(!ratingOpen)}
      />
    </aside>
  );
}

export default FilterSidebar;
