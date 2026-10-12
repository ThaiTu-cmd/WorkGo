"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR } from "@/lib/landing/fiverr-tokens";

export interface FiverrTrendingBarProps {
  locale: string;
  regionLabel: string;
}

/**
 * FiverrTrendingBar — horizontal "Trending 🔥" strip that appears under the
 * header. Measured: 16px / w400 links, `gap 12px`, `padding 8px 0`,
 * `transition: color .2s`. Hidden below `md` to protect the mobile viewport.
 */
export function FiverrTrendingBar({
  locale,
  regionLabel,
}: FiverrTrendingBarProps): React.JSX.Element {
  const content = getFiverrContent(locale);

  return (
    <>
      <div className="hidden bg-white md:block">
        <nav
          aria-label={regionLabel}
          className="mx-auto flex h-12 max-w-[1400px] items-center gap-3 overflow-x-auto px-8 fiverr-no-scrollbar"
        >
          <span className="flex shrink-0 items-center gap-1.5 text-base font-semibold text-[#222325]">
            <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
            {content.trending.label}
          </span>
          {content.trending.items.map((item) => (
            <Link
              key={item}
              href={`/${locale}/posts?q=${encodeURIComponent(item)}`}
              className="shrink-0 whitespace-nowrap text-base transition-colors duration-200 hover:text-[#222325] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
              style={{ color: FIVERR_COLOR.ink500 }}
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile trending chips (scroll-x) */}
      <div className="md:hidden bg-white border-b border-[#DADBDD]/50 px-4 py-2 flex items-center gap-2 overflow-x-auto fiverr-no-scrollbar">
        <Flame className="h-3.5 w-3.5 shrink-0 text-[#FF7640]" aria-hidden="true" />
        {content.trending.items.slice(0, 6).map((item) => (
          <Link
            key={item}
            href={`/${locale}/posts?q=${encodeURIComponent(item)}`}
            className="shrink-0 whitespace-nowrap rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-[#222325] hover:bg-black/10"
          >
            {item}
          </Link>
        ))}
      </div>
    </>
  );
}

export default FiverrTrendingBar;