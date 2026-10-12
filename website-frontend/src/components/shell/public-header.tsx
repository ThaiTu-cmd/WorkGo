"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, ArrowRight, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export function PublicHeader({ locale }: { locale: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [searchVal, setSearchVal] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/${locale}/posts?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/85 backdrop-blur-md shadow-sm h-16 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 font-bold text-xl text-primary tracking-tight group"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBB] flex items-center justify-center text-white font-black text-lg leading-none select-none shadow-sm shadow-[#1677FF]/30 group-hover:scale-105 transition-all duration-200">
              W
            </div>
            <span className="text-fg group-hover:text-primary transition-colors">WorkGo</span>
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

        {/* Center: Desktop Mini Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <Input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={locale === "vi" ? "Tìm việc nhanh..." : "Quick search jobs..."}
              className="h-9 pl-9 pr-3 text-xs rounded-full bg-muted/60 border-border"
              prefixIcon={<Search className="h-3.5 w-3.5 text-fg-tertiary" />}
            />
          </form>
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

export default PublicHeader;
