"use client";

import * as React from "react";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { ThemeToggle } from "@/components/shell/theme-toggle";

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
    <div className="relative w-full min-h-screen bg-app text-fg overflow-hidden transition-colors duration-200">
      {/* Accessible brand identifier for SEO / Screen readers */}
      <div className="sr-only">
        <span>WorkGo</span>
        <span>Platform</span>
      </div>

      {/* Bottom-Right Utility Dock (Theme & Language Switcher) - Zero Header Overlap */}
      <aside className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-surface/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-lg">
        <ThemeToggle />
        <div className="h-3.5 w-px bg-border" />
        <LanguageSwitcher currentLocale={locale} />
      </aside>

      {/* Fullscreen Embedded Ascend Landing Experience */}
      {mounted && (
        <iframe
          src={`/landing/index.html?locale=${locale}`}
          title="WorkGo Interactive Platform Landing"
          className="w-full h-screen border-none block relative z-10"
        />
      )}
    </div>
  );
}
