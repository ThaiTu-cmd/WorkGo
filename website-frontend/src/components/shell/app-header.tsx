"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { UserMenu } from "./user-menu";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export interface AppHeaderProps {
  locale: string;
  userName?: string;
  fullName?: string;
  role?: string;
  onOpenMobileMenu?: () => void;
}

export function AppHeader({
  locale,
  userName = "user",
  fullName = "Người dùng",
  role = "CLIENT",
  onOpenMobileMenu,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-surface/85 backdrop-blur-md shadow-sm h-16 transition-all duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 -ml-2 rounded-full text-fg-secondary hover:text-fg hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link
            href={`/${locale}/posts`}
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight group"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1677FF] to-[#0B4DBB] flex items-center justify-center text-white font-black text-sm leading-none select-none shadow-md shadow-[#1677FF]/25 group-hover:scale-105 transition-all duration-200">
              W
            </div>
            <span className="text-fg group-hover:text-primary transition-colors font-semibold tracking-tight">WorkGo</span>
          </Link>
        </div>

        {/* Right: Theme Toggle, Lang Switcher & User Avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />
          <UserMenu
            userName={userName}
            fullName={fullName}
            role={role}
            locale={locale}
          />
        </div>
      </div>
    </header>
  );
}
