import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { ParticleOcean } from "@/components/effects/particle-ocean";

export interface AuthShellProps {
  children: React.ReactNode;
  locale: string;
}

export function AuthShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  return (
    <div className="relative min-h-screen bg-app flex flex-col justify-between overflow-hidden">
      {/* Dynamic Particle Ocean Background */}
      <ParticleOcean className="fixed inset-0 z-0 pointer-events-none opacity-40" />

      {/* Top bar with logo & language */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 font-bold text-xl text-primary tracking-tight group"
          title={locale === "vi" ? "Về trang giới thiệu" : "Back to Home"}
        >
          <div className="h-8 w-8 rounded-control bg-primary flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:shadow-md group-hover:shadow-primary/30 transition-all duration-200">
            W
          </div>
          <span className="group-hover:text-primary-hover transition-colors">WorkGo</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-fg-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-muted border border-border/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{locale === "vi" ? "Về trang giới thiệu" : "Back to Home"}</span>
          </Link>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </header>

      {/* Centered Auth Card (480px) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-[480px] drop-shadow-sm">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-fg-tertiary">
        © {new Date().getFullYear()} WorkGo Platform. Bản quyền thuộc về WorkGo.
      </footer>
    </div>
  );
}
