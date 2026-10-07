"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, LogIn, UserPlus } from "lucide-react";
import { LanguageSwitcher } from "@/components/shell/language-switcher";

export interface AscendLandingViewProps {
  locale: string;
}

export function AscendLandingView({ locale }: AscendLandingViewProps) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <div className="relative w-full min-h-screen bg-[#04060f] text-[#f3f6ff] overflow-hidden">
      {/* Floating Top Nav Overlay (Quick Action Bar) */}
      <header className="fixed top-0 inset-x-0 z-50 pointer-events-none p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Brand */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 font-extrabold text-lg sm:text-xl text-[#f3f6ff] tracking-tight bg-[#0c1226]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[rgba(150,175,230,0.18)] shadow-lg hover:border-[#5df0a8]/50 transition-all duration-200 group"
          >
            <span className="text-[#5df0a8] text-sm transform -translate-y-0.5 group-hover:scale-110 transition-transform">
              ▲
            </span>
            <span>WorkGo</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#5df0a8]/15 text-[#5df0a8] font-mono font-medium ml-1">
              Platform
            </span>
          </Link>

          {/* Quick Actions & Language */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#0c1226]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[rgba(150,175,230,0.18)] shadow-lg">
            <Link
              href={`/${locale}/posts`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#9aa6c4] hover:text-[#f3f6ff] transition-colors px-2 py-1"
            >
              <Briefcase className="h-3.5 w-3.5 text-[#5df0a8]" />
              <span>{locale === "vi" ? "Việc làm" : "Browse Jobs"}</span>
            </Link>

            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#9aa6c4] hover:text-[#f3f6ff] transition-colors px-2.5 py-1 rounded-full hover:bg-white/5"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? "Đăng nhập" : "Sign In"}</span>
            </Link>

            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#032018] bg-gradient-to-b from-[#5df0a8] to-[#2fd38a] hover:from-[#6df2b2] hover:to-[#38db94] px-3.5 py-1.5 rounded-full shadow-[0_4px_16px_rgba(93,240,168,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? "Bắt đầu ngay" : "Get Started"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <div className="border-l border-[rgba(150,175,230,0.2)] pl-2 ml-1">
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Embedded Ascend Landing Experience */}
      {mounted && (
        <iframe
          src={`/landing/index.html?locale=${locale}`}
          title="Ascend Interactive SaaS Platform Landing"
          className="w-full h-screen border-none block relative z-10"
        />
      )}
    </div>
  );
}
