"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FiverrImage } from "./fiverr-image";
import { FIVERR_ICONS } from "./fiverr-category-grid";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR, FIVERR_RADIUS } from "@/lib/landing/fiverr-tokens";
import { FiverrReveal } from "./fiverr-reveal";
import { FiverrTiltCard } from "./fiverr-tilt-card";

export interface FiverrGuidesProps {
  locale: string;
  regionLabel: string;
  imageAlt: string;
}

/**
 * FiverrGuides — measured 3-column grid of 4:3 media cards, radius 4,
 * 18px/w700 heading underneath, "See more guides" link on the right.
 */
export function FiverrGuides({
  locale,
  regionLabel,
  imageAlt,
}: FiverrGuidesProps): React.JSX.Element {
  const content = getFiverrContent(locale);

  return (
    <section aria-label={regionLabel} className="bg-white px-6 py-10 md:px-8 md:py-12">
      <FiverrReveal className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[32px] font-normal leading-[1.05] tracking-[-0.03em] text-[#222325] md:text-[48px]">
          {content.guides.title}
        </h2>
        <Link
          href={`/${locale}/guides`}
          className="fiverr-press inline-flex items-center gap-1.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
          style={{ color: FIVERR_COLOR.ink700 }}
        >
          {content.guides.seeMore}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {content.guides.items.map((guide) => {
          const Icon = FIVERR_ICONS[guide.icon];
          return (
            <li key={guide.id}>
              <FiverrTiltCard max={6}>
                <Link
                  href={`/${locale}/guides/${guide.id}`}
                  className="fiverr-press group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
                >
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden"
                    style={{
                      borderRadius: FIVERR_RADIUS.media,
                    }}
                    role="img"
                    aria-label={imageAlt}
                  >
                    <FiverrImage
                      src={guide.image.src}
                      alt={guide.image.alt}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      gradient={guide.from}
                      icon={<Icon className="h-14 w-14 shrink-0 text-white/60 drop-shadow transition-transform duration-300 group-hover:scale-110" strokeWidth={1} />}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `linear-gradient(140deg, ${guide.from[0]}99, ${guide.from[1]}D9)`,
                      }}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex h-full w-full items-center justify-center">
                      <Icon className="h-14 w-14 shrink-0 text-white/60 drop-shadow transition-transform duration-300 group-hover:scale-110" strokeWidth={1} />
                    </div>
                  </div>
                  <h3 className="mt-4 min-h-[56px] text-lg font-bold leading-7 line-clamp-2" style={{ color: FIVERR_COLOR.ink700 }}>
                    {guide.title}
                  </h3>
                </Link>
              </FiverrTiltCard>
            </li>
          );
        })}
      </ul>
      </FiverrReveal>
    </section>
  );
}

export default FiverrGuides;