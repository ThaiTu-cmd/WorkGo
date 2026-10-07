import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  locale?: string;
  className?: string;
}

export function Breadcrumb({ items, locale = "vi", className }: BreadcrumbProps) {
  return (
    <nav aria-label="Đường dẫn trang" className={cn("flex items-center text-xs text-fg-secondary mb-4", className)}>
      <ol className="flex items-center flex-wrap gap-1.5">
        <li>
          <Link
            href={`/${locale}/posts`}
            className="flex items-center gap-1 hover:text-primary transition-colors text-fg-tertiary"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Trang chủ</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-fg-tertiary shrink-0" />
              {isLast || !item.href ? (
                <span className="font-medium text-fg truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href.startsWith("http") ? item.href : `/${locale}${item.href}`}
                  className="hover:text-primary transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
