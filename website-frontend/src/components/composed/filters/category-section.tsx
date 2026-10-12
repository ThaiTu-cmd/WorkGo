"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Grid } from "lucide-react";
import type { CategoryItem } from "@/lib/adapters/catalog";

export interface CategorySectionProps {
  categories: CategoryItem[];
  value?: string;
  onChange: (categoryId?: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function CategorySection({
  categories,
  value,
  onChange,
  isOpen,
  onToggle,
}: CategorySectionProps) {
  const t = useTranslations("posts");

  return (
    <div className="border-b border-border/70 pb-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold text-fg cursor-pointer hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Grid className="h-4 w-4 text-fg-tertiary" />
          {t("category")}
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
            onChange={(e) => onChange(e.target.value || undefined)}
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
  );
}
