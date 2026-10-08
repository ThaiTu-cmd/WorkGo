"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export interface WorkgoNavbarProps {
  locale: string;
}

export function WorkgoNavbar({ locale }: WorkgoNavbarProps) {
  const t = useTranslations("landing.nav");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: "#features", label: t("features"), isAnchor: true },
    { href: "#showcase", label: t("showcase"), isAnchor: true },
    { href: "#pricing", label: t("pricing"), isAnchor: true },
    { href: `/${locale}/posts`, label: t("posts"), isAnchor: false },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBB] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#1677FF]/30 group-hover:scale-105 transition-transform duration-200">
              W
            </div>
            <div className="flex flex-col">
              <span className="text-fg font-bold text-lg tracking-tight leading-none group-hover:text-primary transition-colors">
                WorkGo
              </span>
              <span className="text-[10px] text-fg-tertiary font-medium tracking-wider uppercase leading-none mt-1">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isAnchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="pressable text-sm font-medium text-fg-secondary hover:text-fg transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="pressable text-sm font-medium text-fg-secondary hover:text-fg transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="h-4 w-px bg-border" />
            <LanguageSwitcher currentLocale={locale} />
            <div className="h-4 w-px bg-border" />
            <Link
              href={`/${locale}/login`}
              className="pressable text-sm font-medium text-fg-secondary hover:text-fg px-3 py-1.5 transition-colors"
            >
              {t("signIn")}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="pressable inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#1677FF] to-[#0B4DBB] hover:brightness-110 shadow-sm shadow-[#1677FF]/30 transition-all"
            >
              <span>{t("getStarted")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher currentLocale={locale} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="pressable p-2 rounded-lg text-fg-secondary hover:text-fg hover:bg-muted transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in">
          {navLinks.map((link) =>
            link.isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="pressable block px-3 py-2 rounded-lg text-base font-medium text-fg-secondary hover:text-fg hover:bg-muted"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="pressable block px-3 py-2 rounded-lg text-base font-medium text-fg-secondary hover:text-fg hover:bg-muted"
              >
                {link.label}
              </Link>
            )
          )}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link
              href={`/${locale}/login`}
              onClick={() => setMobileMenuOpen(false)}
              className="pressable w-full text-center py-2.5 rounded-xl text-sm font-medium text-fg bg-surface border border-border hover:bg-muted"
            >
              {t("signIn")}
            </Link>
            <Link
              href={`/${locale}/register`}
              onClick={() => setMobileMenuOpen(false)}
              className="pressable w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1677FF] to-[#0B4DBB]"
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default WorkgoNavbar;
