"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FiverrImage } from "./fiverr-image";
import { FIVERR_ICONS } from "./fiverr-category-grid";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR, FIVERR_RADIUS } from "@/lib/landing/fiverr-tokens";
import { FiverrReveal } from "./fiverr-reveal";

export interface FiverrFeaturePanelsProps {
  locale: string;
  regionLabel: string;
  imageAlt: string;
}

/**
 * FiverrFeaturePanels — the two dark showcase panels.
 * Panel 1: measured green gradient (#00732E → #003912), radius 16.
 * Panel 2: measured flat brown (#421300), radius 16.
 * Both use a 52px / 32px extra-light heading and a 3-item disc list.
 */
export function FiverrFeaturePanels({
  locale,
  regionLabel,
  imageAlt,
}: FiverrFeaturePanelsProps): React.JSX.Element {
  const content = getFiverrContent(locale);

  return (
    <section aria-label={regionLabel} className="bg-white px-6 pb-12 md:px-8 md:pb-16">
      <div className="mx-auto max-w-[1400px] space-y-6 md:space-y-10">
        {content.panels.map((panel, idx) => {
          const Icon = FIVERR_ICONS[panel.icon];
          return (
            <FiverrReveal key={panel.id} delay={idx * 100}>
              <article
                className="flex flex-col items-start gap-8 overflow-hidden rounded-2xl p-6 text-white lg:flex-row lg:gap-10 lg:p-14"
                style={{
                  backgroundImage: `linear-gradient(140deg, ${panel.gradient[0]}, ${panel.gradient[1]})`,
                }}
              >
              <div className="flex flex-col items-start gap-6 lg:max-w-[640px]">
                <h2 className="text-[32px] font-extralight leading-[1.06] tracking-[-0.06em] text-white md:text-[36px] lg:text-[52px] text-balance">
                  {panel.title}
                </h2>

                <ul className="list-disc space-y-2 pl-5 text-base leading-6 text-white">
                  {panel.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                <Link
                  href={`/${locale}${panel.ctaHref}`}
                  className="pressable fiverr-press inline-flex h-[42px] items-center rounded-lg px-4 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ backgroundColor: "#FFFFFF", color: FIVERR_COLOR.ink900 }}
                >
                  {panel.ctaLabel}
                </Link>

                {panel.footnote && (
                  <p className="flex items-center gap-2 text-base font-semibold text-[#F3FDF9]">
                    <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {panel.footnote}
                  </p>
                )}
              </div>

              <div
                className="relative flex h-[200px] w-full shrink-0 items-center justify-center overflow-hidden border border-white/15 lg:h-[320px] lg:flex-1"
                style={{
                  borderRadius: FIVERR_RADIUS.card,
                }}
                role="img"
                aria-label={`${imageAlt}: ${panel.title}`}
              >
                <FiverrImage
                  src={panel.image.src}
                  alt={panel.image.alt}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  gradient={panel.gradient}
                  icon={<Icon className="animate-fiverr-float relative z-10 h-24 w-24 shrink-0 text-white/60 drop-shadow" strokeWidth={1} />}
                  className="object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(140deg, ${panel.gradient[0]}B3, ${panel.gradient[1]}E6)`,
                  }}
                  aria-hidden="true"
                />
                <Icon className="animate-fiverr-float relative z-10 h-24 w-24 shrink-0 text-white/60 drop-shadow" strokeWidth={1} />
              </div>
            </article>
          </FiverrReveal>
        );
      })}
    </div>
    </section>
  );
}

export default FiverrFeaturePanels;