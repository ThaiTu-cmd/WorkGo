"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { FiverrCarousel } from "./fiverr-carousel";
import { FIVERR_ICONS } from "./fiverr-category-grid";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR, FIVERR_SHADOW } from "@/lib/landing/fiverr-tokens";
import { FiverrReveal } from "./fiverr-reveal";

export interface FiverrPopularServicesProps {
  locale: string;
  regionLabel: string;
  prevLabel: string;
  nextLabel: string;
}

/**
 * FiverrPopularServices — measured 200×266 dark-green card, radius 16,
 * `padding 25px 6px 6px`, shadow `0 3px 10px rgba(0,0,0,.13)`.
 */
export function FiverrPopularServices({
  locale,
  regionLabel,
  prevLabel,
  nextLabel,
}: FiverrPopularServicesProps): React.JSX.Element {
  const content = getFiverrContent(locale);

  return (
    <section aria-label={regionLabel} className="bg-white px-6 pb-14 md:px-8 md:pb-20">
      <FiverrReveal className="mx-auto max-w-[1400px]">
        <h2 className="mb-6 text-[32px] font-normal leading-[1.05] tracking-[-0.03em] text-[#222325] md:text-[48px]">
          {content.popular.title}
        </h2>

        <FiverrCarousel
          label={regionLabel}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
          itemGapClass="gap-4 pb-2"
        >
          {content.popular.services.map((service) => {
            const Icon = FIVERR_ICONS[service.icon];
            return (
              <Link
                key={service.id}
                href={`/${locale}/posts`}
                className="fiverr-press flex h-[266px] w-[200px] shrink-0 snap-start flex-col rounded-2xl p-[25px_6px_6px] text-white transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003912]"
                style={{ backgroundColor: FIVERR_COLOR.cardGreen, boxShadow: FIVERR_SHADOW.pop }}
              >
                <div className="flex items-center justify-between px-2.5">
                  <h3 className="text-lg font-bold leading-[28px]">{service.title}</h3>
                  <Star
                    className="h-4 w-4 shrink-0 fill-current text-white/70"
                    aria-hidden="true"
                  />
                </div>

                <p className="px-2.5 pt-1 text-xs leading-[18px] text-white/70">{service.blurb}</p>

                <div
                  className="animate-fiverr-pan mt-2 flex h-[168px] flex-1 items-center justify-center overflow-hidden rounded-xl"
                  style={{
                    backgroundImage: `linear-gradient(140deg, ${service.accent[0]}, ${service.accent[1]})`,
                  }}
                  aria-hidden="true"
                >
                  <Icon className="h-12 w-12 shrink-0 text-white/90" />
                </div>
              </Link>
            );
          })}
        </FiverrCarousel>
      </FiverrReveal>
    </section>
  );
}

export default FiverrPopularServices;