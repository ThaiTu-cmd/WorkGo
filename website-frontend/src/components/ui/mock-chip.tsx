"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

export function MockChip({ className }: { className?: string }) {
  const t = useTranslations("common");

  return (
    <Badge
      variant="warning"
      className={cn("gap-1 font-semibold text-[11px] h-5", className)}
      title="Tính năng đang sử dụng Mock Adapter do Backend đang triển khai"
    >
      <Sparkles className="h-3 w-3" />
      {t("mockData")}
    </Badge>
  );
}
