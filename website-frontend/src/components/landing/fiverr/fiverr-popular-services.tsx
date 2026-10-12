"use client";

import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import { FiverrCarousel } from "./fiverr-carousel";
import { FIVERR_ICONS } from "./fiverr-category-grid";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR, FIVERR_SHADOW } from "@/lib/landing/fiverr-tokens";
import { formatPriceVND } from "@/lib/landing/format-price";
import { FiverrReveal } from "./fiverr-reveal";
import { FiverrTiltCard } from "./fiverr-tilt-card";
import { FiverrImage } from "./fiverr-image";

// formatPrice delegates to formatPriceVND using Intl.NumberFormat
export const formatPrice = formatPriceVND;

export interface FiverrPopularServicesProps {
  locale: string;
  regionLabel: string;
  prevLabel: string;
  nextLabel: string;
}

/**
 * FiverrPopularServices — measured 200×300 dark-green card, radius 16,
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
          {content.popular.services.map((service, idx) => {
            const Icon = FIVERR_ICONS[service.icon];
            return (
              <FiverrTiltCard key={service.id} className="shrink-0 snap-start">
                <Link
                  href={`/${locale}/posts?q=${encodeURIComponent(service.title)}`}
                  className="fiverr-press card-shine group flex h-[300px] w-[200px] flex-col justify-between rounded-2xl p-[25px_6px_6px] text-white transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003912]"
                  style={{ backgroundColor: FIVERR_COLOR.cardGreen, boxShadow: FIVERR_SHADOW.pop }}
                >
                  <div className="flex flex-col gap-1 px-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="min-h-[56px] flex-1 text-balance text-lg font-bold leading-[28px] line-clamp-2">
                        {service.title}
                      </h3>
                      <Star
                        className="mt-1 h-4 w-4 shrink-0 fill-current text-white/70"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="min-h-[36px] text-xs leading-[18px] text-white/70 line-clamp-2">
                      {service.blurb}
                    </p>
                  </div>

                  <div
                    className="relative mx-[4px] mb-[4px] mt-2 h-[148px] shrink-0 overflow-hidden rounded-xl"
                    aria-hidden="true"
                  >
                    <FiverrImage
                      src={service.image.src}
                      alt={service.image.alt}
                      sizes="200px"
                      eager={idx < 2}
                      gradient={service.accent}
                      icon={<Icon className="absolute inset-0 m-auto h-12 w-12 text-white/90 drop-shadow" />}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `linear-gradient(140deg, ${service.accent[0]}66, ${service.accent[1]}D9)`,
                      }}
                    />
                    <Icon className="absolute inset-0 m-auto h-12 w-12 text-white/90 drop-shadow" />
                    {service.priceFrom && (
                      <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm pointer-events-none">
                        {formatPriceVND(service.priceFrom, locale)}
                      </div>
                    )}
                    <div
                      className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#00732E] px-2 py-1 text-[11px] font-bold text-white shadow-sm pointer-events-none"
                      aria-label={locale === "vi" ? "Đã xác minh" : "Verified"}
                      title={locale === "vi" ? "Đã xác minh" : "Verified"}
                    >
                      <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{locale === "vi" ? "Đã xác minh" : "Verified"}</span>
                    </div>
                  </div>
                </Link>
              </FiverrTiltCard>
            );
          })}
        </FiverrCarousel>
      </FiverrReveal>
    </section>
  );
}

export default FiverrPopularServices;