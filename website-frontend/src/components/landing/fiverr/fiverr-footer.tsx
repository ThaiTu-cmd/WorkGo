"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GitBranch, Globe, MessageCircle, Network, Send } from "lucide-react";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR } from "@/lib/landing/fiverr-tokens";
import { FiverrReveal } from "./fiverr-reveal";


export interface FiverrFooterProps {
  locale: string;
  regionLabel: string;
}

/**
 * Channel badges. `lucide-react` v1 ships no brand marks (Github/Twitter/
 * Linkedin/Facebook were removed upstream), so generic glyphs stand in.
 * They render as non-interactive badges because WorkGo does not publish
 * verified external profile URLs — inventing hrefs would ship dead links.
 */
const SOCIALS = [
  { key: "community", label: "Cộng đồng WorkGo", Icon: MessageCircle },
  { key: "opensource", label: "Mã nguồn mở", Icon: GitBranch },
  { key: "newsletter", label: "Bản tin", Icon: Send },
  { key: "network", label: "Mạng lưới đối tác", Icon: Network },
] as const;

/**
 * FiverrFooter — measured 5-column grid (258px per column, gap 24) plus a
 * bottom bar with brand, copyright, socials and language/currency.
 *
 * The year renders only after mount (R5) so SSR and client markup agree.
 */
export function FiverrFooter({
  locale,
  regionLabel,
}: FiverrFooterProps): React.JSX.Element {
  const t = useTranslations("landing.fiverr");
  const content = getFiverrContent(locale);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <footer
      aria-label={regionLabel}
      className="bg-white border-t border-[#DADBDD] px-6 pb-10 pt-8 md:px-8"
      style={{ borderTopWidth: "0.8px" }}
    >
      <FiverrReveal className="mx-auto max-w-[1400px]">
        <nav
          aria-label={regionLabel}
          className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10"
        >
          {content.footer.columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <h2 className="text-base font-semibold leading-6 text-[#222325]">
                {column.heading}
              </h2>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      href={`/${locale}/posts`}
                      className="text-sm leading-[22px] text-[#222325] underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="mt-10 flex flex-col gap-4 border-t border-[#DADBDD] pt-6 md:flex-row md:items-center md:justify-between"
          style={{ borderTopWidth: "0.8px" }}
        >
          <div className="flex items-center gap-2.5 select-none">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#222325] text-sm font-black leading-none text-white">
              W
            </span>
            <span className="text-lg font-bold leading-none tracking-tight text-[#222325]">
              WorkGo
            </span>
          </div>

          <p className="text-sm" style={{ color: FIVERR_COLOR.ink500 }}>
            {mounted
              ? `© ${new Date().getFullYear()} ${content.footer.copyright}`
              : `© ${content.footer.copyright}`}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <ul className="flex items-center gap-3" aria-label={t("footer.socialLabel")}>
              {SOCIALS.map(({ key, label, Icon }) => (
                <li key={key}>
                  <span
                    role="img"
                    aria-label={label}
                    title={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DADBDD] text-[#222325]"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>

            <span className="flex items-center gap-1.5 text-sm" style={{ color: FIVERR_COLOR.ink500 }}>
              <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">{t("footer.languageLabel")}</span>
              {locale.toUpperCase()}
            </span>

            <span className="text-sm" style={{ color: FIVERR_COLOR.ink500 }}>
              {t("footer.currencyLabel")}: VND
            </span>
          </div>
        </div>
      </FiverrReveal>
    </footer>
  );
}

export default FiverrFooter;