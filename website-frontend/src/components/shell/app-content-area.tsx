"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AppContentAreaProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppContentArea - Vùng hiển thị nội dung chính độc lập.
 * - Tách biệt hoàn toàn khỏi Sidebar.
 * - Cơ chế cuộn độc lập: overflow-y-auto, không làm ảnh hưởng đến Sidebar hay Header.
 * - Chiều cao cố định chuẩn h-[calc(100vh-4rem)].
 */
export function AppContentArea({
  children,
  className,
  ...props
}: AppContentAreaProps) {
  return (
    <main
      className={cn(
        "flex-1 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden min-w-0 relative pb-20 md:pb-8",
        "focus:outline-none scroll-smooth",
        className
      )}
      tabIndex={-1}
      {...props}
    >
      <div className="w-full relative z-10">{children}</div>
    </main>
  );
}
