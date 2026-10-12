"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, ChevronDown } from "lucide-react";
import { FiverrHeader } from "@/components/landing/fiverr/fiverr-header";
import { FiverrFooter } from "@/components/landing/fiverr/fiverr-footer";
import { FiverrReveal } from "@/components/landing/fiverr/fiverr-reveal";
import { InfoOrb } from "@/components/landing/art/landing-art";
import { getInfoContent, type InfoPageKey } from "@/lib/landing/info-content";
import { cn } from "@/lib/utils";

export interface InfoPageShellProps {
  locale: string;
  pageKey: InfoPageKey;
  breadcrumb: string;
  showToc?: boolean;
  children?: React.ReactNode;
}

interface FaqAccordionProps {
  items: Array<{ q: string; a: string }>;
}

function FaqAccordion({ items }: FaqAccordionProps): React.JSX.Element {
  const [openIndexes, setOpenIndexes] = React.useState<Record<number, boolean>>({ 0: true });

  const toggle = (idx: number) => {
    setOpenIndexes((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="divide-y divide-[#E4E5E7] rounded-2xl border border-[#E4E5E7] bg-white">
      {items.map((item, idx) => {
        const isOpen = !!openIndexes[idx];
        const headingId = `faq-h-${idx}`;
        const panelId = `faq-p-${idx}`;

        return (
          <div key={idx} className="p-5 md:p-6 transition-colors hover:bg-black/[0.02]">
            <button
              id={headingId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between gap-4 text-left font-semibold text-[#222325] text-base md:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded-lg"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-[#62646A] transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              className={cn(
                "faq-accordion overflow-hidden",
                isOpen && "data-open"
              )}
              data-open={isOpen ? "true" : undefined}
            >
              <div className="overflow-hidden">
                <p className="pt-3 text-sm md:text-base leading-relaxed text-[#62646A]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * InfoPageShell — Common light marketing shell for static information pages.
 * Fully offline-first, no backend fetch, 0 risk of ErrorState.
 */
export function InfoPageShell({
  locale,
  pageKey,
  breadcrumb,
  showToc = true,
  children,
}: InfoPageShellProps): React.JSX.Element {
  const content = getInfoContent(locale, pageKey);
  const homeLabel = locale === "en" ? "Home" : "Trang chủ";
  const tocLabel = locale === "en" ? "On this page" : "Nội dung chính";
  const regionFooter = locale === "en" ? "Footer" : "Chân trang";

  const hasAnchors = content.anchors && content.anchors.length > 0;
  const shouldRenderToc = showToc && hasAnchors;

  return (
    <div className="min-h-screen bg-white text-[#222325] flex flex-col font-sans selection:bg-[#1677FF]/15 selection:text-[#1677FF]">
      {/* 1. Header */}
      <FiverrHeader locale={locale} />

      {/* 2. Breadcrumb bar */}
      <div className="border-b border-[#E4E5E7] bg-[#FAFAFA] py-3">
        <div className="mx-auto max-w-[1400px] px-6 md:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs md:text-sm text-[#62646A]">
            <Link
              href={`/${locale}`}
              className="hover:text-[#222325] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded"
            >
              {homeLabel}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#62646A]/60" aria-hidden="true" />
            <span className="font-medium text-[#222325]" aria-current="page">
              {breadcrumb}
            </span>
          </nav>
        </div>
      </div>

      {/* 3. Hero section */}
      <section className="relative overflow-hidden border-b border-[#E4E5E7] bg-white py-12 md:py-20">
        <InfoOrb variant={pageKey} />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-8">
          <FiverrReveal>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#222325] leading-tight">
                {content.title}
              </h1>
              <p className="mt-4 md:mt-6 text-base md:text-xl text-[#62646A] leading-relaxed">
                {content.desc}
              </p>
            </div>
          </FiverrReveal>
        </div>
      </section>

      {/* 4. Main Body with optional TOC */}
      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-[1400px] px-6 md:px-8">
          <div className={cn("grid gap-12", shouldRenderToc && "lg:grid-cols-[260px_1fr]")}>
            {/* Table of Contents sidebar */}
            {shouldRenderToc && (
              <aside className="hidden lg:block">
                <div className="sticky top-8 rounded-2xl border border-[#E4E5E7] bg-[#FAFAFA] p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#62646A]">
                    {tocLabel}
                  </h2>
                  <nav className="mt-4 flex flex-col space-y-2">
                    {content.anchors.map((anchor) => (
                      <a
                        key={anchor.id}
                        href={`#${anchor.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#62646A] transition-colors hover:bg-white hover:text-[#222325] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
                      >
                        {anchor.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Content area */}
            <div className="space-y-12 md:space-y-16 min-w-0">
              {/* Optional custom children (e.g. pricing tier cards, custom slot) */}
              {children && (
                <FiverrReveal>
                  <div className="mb-10">{children}</div>
                </FiverrReveal>
              )}

              {/* Standard sections */}
              {content.sections.map((section, idx) => {
                const sectionId = section.anchor ?? (idx === 0 && content.anchors[0]?.id ? undefined : undefined);
                return (
                  <FiverrReveal key={idx} delay={idx * 60}>
                    <section
                      id={sectionId}
                      className={cn("space-y-4", sectionId && "scroll-mt-24")}
                    >
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222325]">
                        {section.heading}
                      </h2>
                      <div className="space-y-3 text-base md:text-lg text-[#404145] leading-relaxed">
                        {section.body.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>

                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="mt-4 space-y-2.5 pt-2">
                          {section.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-3 text-base text-[#404145]">
                              <CheckCircle2
                                className="h-5 w-5 shrink-0 text-[#1DBF73] mt-0.5"
                                aria-hidden="true"
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </FiverrReveal>
                );
              })}

              {/* Optional FAQ Section */}
              {content.faq && content.faq.length > 0 && (
                <FiverrReveal delay={content.sections.length * 60}>
                  <section id="faq" className="scroll-mt-24 pt-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222325] mb-6">
                      {locale === "en" ? "Frequently Asked Questions" : "Câu hỏi thường gặp"}
                    </h2>
                    <FaqAccordion items={content.faq} />
                  </section>
                </FiverrReveal>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 5. Bottom CTA Banner */}
      <section className="border-t border-[#E4E5E7] bg-[#FAFAFA] py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-8 text-center">
          <FiverrReveal>
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#222325]">
                {content.cta.title}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  href={`/${locale}${content.cta.primaryHref}`}
                  className="fiverr-press inline-flex h-12 items-center justify-center rounded-lg bg-[#222325] px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
                >
                  {content.cta.primaryLabel}
                </Link>
                <Link
                  href={`/${locale}${content.cta.secondaryHref}`}
                  className="fiverr-press inline-flex h-12 items-center justify-center rounded-lg border border-[#DADBDD] bg-white px-6 text-base font-semibold text-[#222325] transition-colors duration-150 hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
                >
                  {content.cta.secondaryLabel}
                </Link>
              </div>
            </div>
          </FiverrReveal>
        </div>
      </section>

      {/* 6. Footer */}
      <FiverrFooter locale={locale} regionLabel={regionFooter} />
    </div>
  );
}
