"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FIVERR_COLOR } from "@/lib/landing/fiverr-tokens";
import { FiverrSearchForm } from "./fiverr-search-form";

export interface FiverrHeaderProps {
  locale: string;
}

/**
 * FiverrHeader — marketing header measured at 1440/1024/390.
 * Reference uses `position: static` (not sticky): keep it that way.
 */
export function FiverrHeader({ locale }: FiverrHeaderProps): React.JSX.Element {
  const t = useTranslations("landing.fiverr");
  const content = getFiverrContent(locale);
  const [open, setOpen] = React.useState(false);

  const drawerId = "fiverr-mobile-drawer";

  // Close the drawer on Escape (accessibility, §3.3).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = React.useCallback(() => setOpen(false), []);

  const linkBtn =
    "pressable inline-flex h-[42px] shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[15px] font-semibold text-[#222325] transition-colors duration-200 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325] xl:px-4 xl:text-base";

  const navItems = [
    { label: content.nav.pro, href: `/${locale}/pro` },
    { label: content.nav.explore, href: `/${locale}/posts` },
  ];

  const drawerItems = [
    ...navItems,
    { label: content.nav.becomeSeller, href: `/${locale}/register` },
    { label: content.nav.signIn, href: `/${locale}/login` },
  ];

  return (
    <>
      <a
        href="#fiverr-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#222325] focus:px-4 focus:py-2 focus:text-white"
      >
        {t("header.skipToContent")}
      </a>

      <header
        className="w-full bg-white border-b border-[#DADBDD]"
        style={{ borderBottomWidth: "0.8px" }}
      >
        <div className="mx-auto flex min-h-[64px] md:h-[53px] max-w-[1400px] items-center justify-between gap-2 px-6 py-2 md:gap-8 md:py-4 md:px-8 lg:gap-3 xl:gap-8 overflow-x-clip">
          {/* Brand */}
          <Link
            href={`/${locale}`}
            aria-label={t("header.brandLabel")}
            className="flex shrink-0 items-center gap-2 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#222325] text-sm font-black leading-none text-white">
              W
            </span>
            <span className="text-lg font-bold leading-none tracking-tight text-[#222325]">
              WorkGo
            </span>
          </Link>

          {/* Desktop inline search (measured: 423 × 42, radius 4) */}
          <FiverrSearchForm
            locale={locale}
            id="fiverr-header-search"
            placeholder={content.nav.searchPlaceholder}
            searchLabel={t("header.searchLabel")}
            submitLabel={t("header.searchSubmitLabel")}
            emptyHint={t("header.searchEmptyHint")}
            clearLabel={t("search.clearLabel")}
            suggestionsLabel={t("hero.suggestionsLabel")}
            variant="header"
            role="search"
          />

          {/* Desktop actions */}
          <nav
            aria-label={t("header.drawerLabel")}
            className="hidden min-w-0 items-center gap-1 lg:flex xl:gap-2"
          >
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={linkBtn}>
                {item.label}
              </Link>
            ))}
            <div className="h-4 w-px shrink-0" style={{ backgroundColor: FIVERR_COLOR.hairline }} />
            <div className="shrink-0"><ThemeToggle /></div>
            <div className="shrink-0"><LanguageSwitcher currentLocale={locale} /></div>
            <div className="h-4 w-px shrink-0" style={{ backgroundColor: FIVERR_COLOR.hairline }} />
            <div className="hidden min-w-0 items-center gap-1 xl:flex">
              <Link href={`/${locale}/register`} className={linkBtn}>
                {content.nav.becomeSeller}
              </Link>
            </div>
            <Link href={`/${locale}/login`} className={linkBtn}>
              {content.nav.signIn}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="pressable shrink-0 whitespace-nowrap inline-flex h-[42px] items-center rounded-lg px-3 text-[15px] xl:px-4 xl:text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
              style={{ backgroundColor: FIVERR_COLOR.btnDark }}
            >
              {content.nav.join}
            </Link>
          </nav>

          {/* Mobile cluster */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t("header.closeMenuLabel") : t("header.openMenuLabel")}
              aria-expanded={open}
              aria-controls={drawerId}
              className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-[#222325] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
              style={{ borderColor: FIVERR_COLOR.fieldBorder }}
            >
              {open ? (
                <X className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
            </button>
            <FiverrSearchForm
              locale={locale}
              id="fiverr-mobile-search"
              placeholder={content.nav.mobileSearchPlaceholder}
              searchLabel={t("header.searchLabel")}
              submitLabel={t("header.searchSubmitLabel")}
              emptyHint={t("header.searchEmptyHint")}
              clearLabel={t("search.clearLabel")}
              suggestionsLabel={t("hero.suggestionsLabel")}
              variant="mobile"
              role="search"
              className="flex items-center min-w-0 flex-1 max-w-[200px]"
            />
            <Link
              href={`/${locale}/register`}
              className="pressable fiverr-press inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
              style={{ backgroundColor: FIVERR_COLOR.btnDark }}
            >
              {content.nav.join}
            </Link>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div
            id={drawerId}
            className="animate-in border-t bg-white px-6 py-4 lg:hidden"
            style={{ borderColor: FIVERR_COLOR.hairline }}
          >
            <div className="flex flex-col gap-1">
              {drawerItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className="pressable rounded-lg px-3 py-2.5 text-base font-semibold text-[#222325] hover:bg-black/5"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: FIVERR_COLOR.hairline }}>
              <ThemeToggle />
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default FiverrHeader;