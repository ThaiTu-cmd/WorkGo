"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Code2,
  Languages,
  LifeBuoy,
  Megaphone,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getFiverrContent, type LucideIconName } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR, FIVERR_SHADOW } from "@/lib/landing/fiverr-tokens";
import { cn } from "@/lib/utils";
import { FiverrReveal } from "./fiverr-reveal";


/** Name → component registry so `fiverr-content.ts` stays React-free. */
export const FIVERR_ICONS: Record<LucideIconName, LucideIcon> = {
  Bot,
  Briefcase,
  Clapperboard,
  Code2,
  Languages,
  LifeBuoy,
  Megaphone,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
};

/** Mobile shows this many tiles before the "view N more" toggle (V13). */
const MOBILE_VISIBLE = 6;

export interface FiverrCategoryGridProps {
  locale: string;
  regionLabel: string;
  toggleMoreLabel: string;
}

/**
 * FiverrCategoryGrid — measured 129×129 tile, radius 16, 4-layer hairline shadow.
 * Desktop: horizontal flex row with a round `›` affordance.
 * Mobile: 3-column grid showing 6 tiles plus a "View N more ⌄" toggle.
 */
export function FiverrCategoryGrid({
  locale,
  regionLabel,
  toggleMoreLabel,
}: FiverrCategoryGridProps): React.JSX.Element {
  const content = getFiverrContent(locale);
  const [expanded, setExpanded] = React.useState(false);
  const railRef = React.useRef<HTMLUListElement>(null);

  const EDGE_SLOP = 4;
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(true);

  const updateEdges = React.useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > EDGE_SLOP);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE_SLOP);
  }, []);

  React.useEffect(() => {
    updateEdges();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollRail = (delta: number) => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    railRef.current?.scrollBy({ left: delta, behavior: prefersReduced ? "auto" : "smooth" });
  };

  const items = content.categories.items;
  const hiddenCount = Math.max(0, items.length - MOBILE_VISIBLE);
  const visible = expanded ? items : items.slice(0, MOBILE_VISIBLE);

  const tile =
    "fiverr-press group flex shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-[#DADBDD] bg-white p-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325] md:p-4";

  return (
    <section aria-label={regionLabel} className="bg-white px-6 py-8 md:px-8 md:py-10">
      <FiverrReveal className="relative">
        {/* Desktop: horizontal rail */}
        <div className="relative hidden md:block">
          <ul
            ref={railRef}
            className="flex items-stretch gap-4 overflow-x-auto scroll-smooth fiverr-no-scrollbar rail-momentum py-1"
          >
            {items.map((item) => {
              const Icon = FIVERR_ICONS[item.icon];
              return (
                <li key={item.key} className="flex">
                  <Link
                    href={`/${locale}/posts?q=${encodeURIComponent(item.label)}`}
                    aria-label={item.label}
                    className={cn(tile, "w-[129px] h-[129px] md:w-[129px] md:h-[129px]")}
                    style={{ boxShadow: FIVERR_SHADOW.card }}
                  >
                    <Icon
                      className="h-6 w-6 shrink-0"
                      style={{ color: FIVERR_COLOR.ink900 }}
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-[20px] text-[#222325] line-clamp-2">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="flex items-center gap-2">
              {canLeft && (
                <button
                  type="button"
                  onClick={() => scrollRail(-280)}
                  aria-label="Cuộn danh mục sang trái"
                  className="fiverr-press flex h-10 w-10 items-center justify-center rounded-full border border-[#DADBDD] bg-white text-[#222325] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
                  style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.13)" }}
                >
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                </button>
              )}
              {canRight && (
                <button
                  type="button"
                  onClick={() => scrollRail(280)}
                  aria-label="Cuộn xem thêm danh mục"
                  className="fiverr-press flex h-10 w-10 items-center justify-center rounded-full border border-[#DADBDD] bg-white text-[#222325] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
                  style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.13)" }}
                >
                  <ChevronRight className="h-5 w-5 shrink-0" />
                </button>
              )}
            </li>
          </ul>
        </div>

        {/* Mobile: 3-column grid + progressive disclosure */}
        <ul className="grid grid-cols-3 gap-3 md:hidden">
          {visible.map((item) => {
            const Icon = FIVERR_ICONS[item.icon];
            return (
              <li key={item.key} className="flex">
                <Link
                  href={`/${locale}/posts?q=${encodeURIComponent(item.label)}`}
                  aria-label={item.label}
                  className={cn(tile, "w-full aspect-square min-h-[88px]")}
                  style={{ boxShadow: FIVERR_SHADOW.card }}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    style={{ color: FIVERR_COLOR.ink900 }}
                    aria-hidden="true"
                  />
                  <span className="text-xs leading-[16px] text-[#222325] line-clamp-2">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={toggleMoreLabel}
            className="pressable mx-auto mt-4 flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-[#222325] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325] md:hidden"
          >
            {expanded ? content.categories.viewLess : content.categories.viewMore(hiddenCount)}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                expanded && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </FiverrReveal>
    </section>
  );
}

export default FiverrCategoryGrid;