"use client";

import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CategoryItem } from "@/lib/adapters/catalog";

export interface FilterValues {
  q?: string;
  category?: string;
  executionType?: string;
  budgetMin?: number;
  budgetMax?: number;
  sort?: string;
}

export interface FilterSidebarProps {
  categories: CategoryItem[];
  values: FilterValues;
  onChange: (newValues: FilterValues) => void;
  onClear: () => void;
  className?: string;
}

const EXECUTION_OPTIONS = [
  { value: "DIGITAL", label: "Trực tuyến (Digital)" },
  { value: "ONSITE", label: "Tại chỗ (Onsite)" },
  { value: "DELIVERY", label: "Giao nhận (Delivery)" },
  { value: "APPOINTMENT", label: "Theo lịch hẹn" },
  { value: "HOURLY", label: "Theo giờ" },
  { value: "PROJECT", label: "Trọn gói dự án" },
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

  const hasActiveFilters = Boolean(
    values.category ||
    values.executionType ||
    values.budgetMin ||
    values.budgetMax
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-fg">
          <Filter className="h-4 w-4 text-primary" />
          <span>{tCommon("filter")}</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs text-danger hover:text-danger h-7 px-2"
          >
            {tCommon("clearFilters")}
          </Button>
        )}
      </div>

      <div className="space-y-5">
        {/* Category Filter */}
        <Field label={t("category")}>
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
        </Field>

        {/* Execution Type Filter */}
        <Field label={t("executionType")}>
          <select
            value={values.executionType || ""}
            onChange={(e) =>
              onChange({ ...values, executionType: e.target.value || undefined })
            }
            className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="">Tất cả hình thức</option>
            {EXECUTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Budget Range Filter */}
        <div>
          <label className="text-sm font-medium text-fg mb-1.5 block">
            {t("budget")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder={t("budgetMin")}
              value={values.budgetMin || ""}
              onChange={(e) =>
                onChange({
                  ...values,
                  budgetMin: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="text-xs"
            />
            <Input
              type="number"
              placeholder={t("budgetMax")}
              value={values.budgetMax || ""}
              onChange={(e) =>
                onChange({
                  ...values,
                  budgetMax: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
