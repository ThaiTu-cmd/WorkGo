"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FiverrCarouselProps {
  children: React.ReactNode;
  label: string;
  className?: string;
  itemGapClass?: string;
  prevLabel?: string;
  nextLabel?: string;
}

/** Sub-pixel slack so fractional layout widths never leave a control stuck on. */
const EDGE_SLOP = 4;

interface ScrollState {
  canPrev: boolean;
  canNext: boolean;
  overflows: boolean;
}

const IDLE: ScrollState = { canPrev: false, canNext: false, overflows: false };

/**
 * FiverrCarousel — horizontally scrollable primitive with round arrow controls.
 *
 * Edge cases handled (see `.team/PLAN.md` §4.2):
 *  - E4: each arrow disables once its boundary is reached (4px slop).
 *  - E5: when the track does not overflow, *both* arrows unmount entirely so
 *         the row never renders dead controls.
 *  - E6: ResizeObserver is feature-detected; a window resize listener covers
 *         SSR / JSDOM environments where it is unavailable.
 */
export function FiverrCarousel({
  children,
  label,
  className,
  itemGapClass = "gap-4",
  prevLabel = "Previous",
  nextLabel = "Next",
}: FiverrCarouselProps): React.JSX.Element {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<ScrollState>(IDLE);

  const sync = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const overflows = el.scrollWidth - el.clientWidth > EDGE_SLOP;
    setState((prev) => {
      const next: ScrollState = {
        canPrev: el.scrollLeft > EDGE_SLOP,
        canNext: overflows && el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE_SLOP,
        overflows,
      };
      return prev.canPrev === next.canPrev &&
        prev.canNext === next.canNext &&
        prev.overflows === next.overflows
        ? prev
        : next;
    });
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(sync);
      ro.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, [sync, children]);

  const nudge = React.useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  }, []);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudge(1);
      }
    },
    [nudge]
  );

  const arrow =
    "h-10 w-10 rounded-full bg-white border border-[#DADBDD] shadow-[0_3px_10px_rgba(0,0,0,0.13)] flex items-center justify-center text-[#222325] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325] disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "flex overflow-x-auto scroll-smooth snap-x snap-mandatory fiverr-no-scrollbar",
          itemGapClass
        )}
      >
        {children}
      </div>

      {state.overflows && (
        <>
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={!state.canPrev}
            aria-hidden={!state.canPrev}
            aria-label={prevLabel}
            title={prevLabel}
            className={cn(arrow, "absolute left-2 top-1/2 hidden -translate-y-1/2 md:flex z-10")}
          >
            <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={!state.canNext}
            aria-hidden={!state.canNext}
            aria-label={nextLabel}
            title={nextLabel}
            className={cn(arrow, "absolute right-2 top-1/2 hidden -translate-y-1/2 md:flex z-10")}
          >
            <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>

          {/* Mobile pagination dots (decorative affordance) */}
          <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                !state.canPrev ? "w-4 bg-[#222325]" : "w-1.5 bg-[#222325]/20"
              )}
            />
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                state.canPrev && state.canNext ? "w-4 bg-[#222325]" : "w-1.5 bg-[#222325]/20"
              )}
            />
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                !state.canNext ? "w-4 bg-[#222325]" : "w-1.5 bg-[#222325]/20"
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default FiverrCarousel;