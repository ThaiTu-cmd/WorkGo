"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/motion";

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "span";
}

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
}: RevealProps) {
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
