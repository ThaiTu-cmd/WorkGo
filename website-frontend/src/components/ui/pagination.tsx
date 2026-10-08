import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className={cn("flex items-center justify-center gap-1 select-none my-4", className)}
      aria-label="Phân trang"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Trước</span>
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((p) => {
          const isCurrent = p === currentPage;
          if (
            totalPages > 7 &&
            p !== 1 &&
            p !== totalPages &&
            Math.abs(p - currentPage) > 2
          ) {
            if (p === 2 || p === totalPages - 1) {
              return (
                <span key={p} className="px-2 text-fg-tertiary">
                  ...
                </span>
              );
            }
            return null;
          }

          return (
            <Button
              key={p}
              variant={isCurrent ? "primary" : "outline"}
              size="sm"
              onClick={() => onPageChange(p)}
              aria-current={isCurrent ? "page" : undefined}
              className={cn("w-8 h-8 p-0 font-medium", isCurrent && "font-bold")}
            >
              {p}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Trang sau"
      >
        <span className="hidden sm:inline">Sau</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
