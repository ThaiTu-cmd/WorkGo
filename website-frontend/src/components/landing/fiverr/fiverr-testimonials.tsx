"use client";

import * as React from "react";
import { Star, ShieldCheck } from "lucide-react";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FiverrReveal } from "./fiverr-reveal";
import { FIVERR_SHADOW } from "@/lib/landing/fiverr-tokens";

export interface FiverrTestimonialsProps {
  locale: string;
  regionLabel: string;
}

export function FiverrTestimonials({
  locale,
  regionLabel,
}: FiverrTestimonialsProps): React.JSX.Element {
  const content = getFiverrContent(locale);
  const testimonials = content.testimonials;

  return (
    <section aria-label={regionLabel} className="bg-white px-6 pb-14 md:px-8 md:pb-20">
      <FiverrReveal className="mx-auto max-w-[1400px]">
        <h2 className="mb-6 text-[32px] font-normal leading-[1.05] tracking-[-0.03em] text-[#222325] md:text-[48px]">
          {testimonials.title}
        </h2>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.items.map((t, idx) => (
            <li key={t.name} className="flex">
              <FiverrReveal
                delay={idx * 80}
                className="flex w-full flex-col justify-between rounded-2xl border border-[#DADBDD] bg-[#FAFAFA] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#1DBF73]/40"
                style={{ boxShadow: FIVERR_SHADOW.card }}
              >
                <div>
                  <div className="mb-4 flex items-center gap-1 text-[#1DBF73]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-[#1DBF73]" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-base leading-relaxed text-[#404145] line-clamp-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-[#E4E5E7] pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003912] text-sm font-bold text-white">
                    {t.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-[#222325] truncate">{t.name}</h4>
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full bg-[#00732E] px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                        aria-label={locale === "vi" ? "Đã xác minh" : "Verified"}
                        title={locale === "vi" ? "Đã xác minh" : "Verified"}
                      >
                        <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{locale === "vi" ? "Đã xác minh" : "Verified"}</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#62646A] truncate">{t.role}</p>
                  </div>
                </div>
              </FiverrReveal>
            </li>
          ))}
        </ul>
      </FiverrReveal>
    </section>
  );
}

export default FiverrTestimonials;
