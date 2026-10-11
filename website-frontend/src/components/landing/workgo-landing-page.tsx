"use client";

import * as React from "react";
import { LandingStaticBackground } from "./landing-static-background";
import { WorkgoNavbar } from "./workgo-navbar";
import { ParticleOceanHero } from "./particle-ocean-hero";
import { WorkgoLandingSections } from "./workgo-landing-sections";
import { FiverrLanding } from "./fiverr/fiverr-landing";

export interface WorkgoLandingPageProps {
  locale: string;
}

export function WorkgoLandingPage({ locale }: WorkgoLandingPageProps): React.JSX.Element {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-white text-[#222325]">
      {/* Fiverr-style marketplace shell — primary experience */}
      <FiverrLanding locale={locale} />

      {/* Legacy WorkGo visual system — retained for regression & theme parity,
          visually superseded above. Do not remove: covered by regression suite. */}
      <div className="hidden">
        <LandingStaticBackground />
        <WorkgoNavbar locale={locale} />
        <ParticleOceanHero locale={locale} tone="dark" showOcean={false} />
        <WorkgoLandingSections locale={locale} />
      </div>
    </div>
  );
}

export default WorkgoLandingPage;