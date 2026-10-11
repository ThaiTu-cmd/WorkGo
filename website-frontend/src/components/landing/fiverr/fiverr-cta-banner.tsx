"use client";

import Link from "next/link";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR, FIVERR_RADIUS } from "@/lib/landing/fiverr-tokens";
import { FiverrReveal } from "./fiverr-reveal";

export interface FiverrCtaBannerProps {
  locale: string;
  regionLabel: string;
}

/**
 * FiverrCtaBanner — measured plum (#4D1727) block, radius 16, 64px heading
 * with the accent word set in the display serif at #FF7640.
 */
export function FiverrCtaBanner({
  locale,
  regionLabel,
}: FiverrCtaBannerProps): React.JSX.Element {
  const content = getFiverrContent(locale);

  return (
    <section aria-label={regionLabel} className="bg-white px-6 pb-16 md:px-8 md:pb-20">
      <FiverrReveal className="mx-auto max-w-[1400px]">
        <div
          className="flex flex-col items-center gap-8 rounded-2xl px-6 py-10 text-center md:gap-10 md:py-12 md:px-12"
          style={{ backgroundColor: FIVERR_COLOR.panelPlum, borderRadius: FIVERR_RADIUS.card }}
        >
          <h2 className="text-[40px] font-normal leading-[1.03] tracking-[-0.02em] text-white md:text-[64px]">
            {content.cta.titleLead}{" "}
            <em
              className="fiverr-display not-italic"
              style={{ color: FIVERR_COLOR.accent }}
            >
              {content.cta.titleAccent}
            </em>
          </h2>

          <Link
            href={`/${locale}/posts`}
            className="pressable fiverr-press inline-flex h-[42px] items-center rounded-lg px-5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ backgroundColor: "#FFFFFF", color: FIVERR_COLOR.ink900 }}
          >
            {content.cta.button}
          </Link>
        </div>
      </FiverrReveal>
    </section>
  );
}

export default FiverrCtaBanner;