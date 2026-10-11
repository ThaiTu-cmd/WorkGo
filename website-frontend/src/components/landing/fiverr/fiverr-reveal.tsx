"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/motion";

export interface FiverrRevealProps {
  children: React.ReactNode;
  delay?: number; // 0, 80, 160, 240
  y?: number;     // default 18
  className?: string;
  as?: "div" | "section" | "li" | "span";
}

export function FiverrReveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
}: FiverrRevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Tag = as as "div";

  return (
    <Tag
      ref={ref as never}
      style={{
        transitionDelay: `${delay}ms`,
        ["--reveal-y" as string]: `${y}px`,
      }}
      className={cn("reveal", visible && "reveal-visible", className)}
    >
      {children}
    </Tag>
  );
}
