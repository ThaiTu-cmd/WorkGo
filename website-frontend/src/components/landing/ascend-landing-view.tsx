"use client";

import * as React from "react";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { WorkgoLandingPage } from "./workgo-landing-page";

export interface AscendLandingViewProps {
  locale: string;
}

/**
 * AscendLandingView: Migrated from legacy HTML iframe to native React 19 / Next.js.
 * Single WebGL Particle Ocean Engine architecture adhering to WorkGo visual system.
 */
export function AscendLandingView({ locale }: AscendLandingViewProps) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <div
      className="relative w-full min-h-screen bg-transparent text-fg overflow-x-hidden"
      data-theme-semantic="bg-app text-fg"
    >
      {/* Accessible brand identifier for SEO / Screen readers */}
      <div className="sr-only">
        <span>WorkGo</span>
        <span>Platform</span>
      </div>

      {/* Bottom-Right Utility Dock (Theme & Language Switcher) */}
      <aside className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-surface/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-lg">
        <ThemeToggle />
        <div className="h-3.5 w-px bg-border" />
        <LanguageSwitcher currentLocale={locale} />
      </aside>

      {/* Native React Landing Page (Zero iframe duplicate loops) */}
      {mounted && <WorkgoLandingPage locale={locale} />}
    </div>
  );
}

export default AscendLandingView;
