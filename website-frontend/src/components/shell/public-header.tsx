"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export function PublicHeader({ locale }: { locale: string }) {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/85 backdrop-blur-md shadow-sm h-16 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 font-bold text-xl text-primary tracking-tight group"
          >
            <div className="h-8 w-8 rounded-control bg-primary flex items-center justify-center text-primary-ink font-black text-lg shadow-sm group-hover:shadow-md group-hover:shadow-primary/30 transition-all duration-200">
              W
            </div>
            <span className="group-hover:text-primary-hover transition-colors text-fg">WorkGo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className="text-sm font-medium text-fg-secondary hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span>{locale === "vi" ? "Trang chủ" : "Home"}</span>
            </Link>

            <Link
              href={`/${locale}/posts`}
              className="text-sm font-medium text-fg-secondary hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Briefcase className="h-4 w-4" />
              <span>{t("posts")}</span>
            </Link>
          </nav>
        </div>

        {/* Right: Theme Toggle, Lang Switcher & Auth Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />

          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm">
              {t("login")}
            </Button>
          </Link>

          <Link href={`/${locale}/register`}>
            <Button variant="primary" size="sm" className="gap-1">
              <span>{t("register")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
