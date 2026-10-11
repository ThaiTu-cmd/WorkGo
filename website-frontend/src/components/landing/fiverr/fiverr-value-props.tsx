"use client";

import Link from "next/link";
import { FIVERR_ICONS } from "./fiverr-category-grid";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR } from "@/lib/landing/fiverr-tokens";
import { FiverrReveal } from "./fiverr-reveal";

export interface FiverrValuePropsProps {
  locale: string;
  regionLabel: string;
}

/**
 * FiverrValueProps — measured 40px heading + right-aligned "Join now" button,
 * hairline top border, four even columns of thin-stroke icons.
 */
export function FiverrValueProps({
  locale,
  regionLabel,
}: FiverrValuePropsProps): React.JSX.Element {
  const content = getFiverrContent(locale);

  return (
    <section aria-label={regionLabel} className="bg-white px-6 pb-12 md:px-8 md:pb-16">
      <FiverrReveal className="mx-auto max-w-[1400px]">
        <div className="border-t pt-8 md:pt-10" style={{ borderColor: FIVERR_COLOR.hairline }}>
          <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-[720px] text-[32px] font-normal leading-[1.2] tracking-[-0.03em] text-[#222325] md:text-[40px]">
              {content.valueProps.title}
            </h2>
            <Link
              href={`/${locale}/register`}
              className="pressable fiverr-press inline-flex h-[42px] shrink-0 items-center rounded-lg px-4 text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
              style={{ backgroundColor: FIVERR_COLOR.btnDark }}
            >
              {content.valueProps.cta}
            </Link>
          </div>

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {content.valueProps.items.map((item) => {
            const Icon = FIVERR_ICONS[item.icon];
            return (
              <li key={item.text} className="flex flex-col items-start gap-3">
                <Icon
                  className="h-10 w-10 shrink-0"
                  style={{ color: FIVERR_COLOR.ink900 }}
                  strokeWidth={1}
                  aria-hidden="true"
                />
                <p className="text-base leading-6" style={{ color: FIVERR_COLOR.ink700 }}>
                  {item.text}
                </p>
              </li>
            );
          })}
        </ul>
        </div>
      </FiverrReveal>
    </section>
  );
}

export default FiverrValueProps;