"use client";

import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "dark" | "light" | "ghost";
type Size = "md" | "lg";

export interface FiverrButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  asChild?: boolean;
}

const styles: Record<Variant, string> = {
  dark: "bg-[#222325] text-white hover:bg-black",
  light: "bg-white text-[#222325] hover:bg-white/90",
  ghost: "bg-white/10 text-white border border-white hover:bg-white/20",
};

export function FiverrButton({
  variant = "dark",
  size = "md",
  href = "#",
  className,
  children,
  asChild,
  ...rest
}: FiverrButtonProps) {
  const cls = cn(
    "fiverr-press inline-flex items-center justify-center gap-2 rounded-lg text-base font-semibold transition-transform duration-150",
    size === "md" ? "h-[42px] px-4" : "h-[48px] px-5",
    styles[variant],
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#222325]",
    className
  );

  if (asChild) {
    return (
      <Slot className={cls} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
