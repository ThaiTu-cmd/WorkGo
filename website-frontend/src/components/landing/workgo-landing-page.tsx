"use client";

import * as React from "react";
import { LandingStaticBackground } from "./landing-static-background";
import { WorkgoNavbar } from "./workgo-navbar";
import { ParticleOceanHero } from "./particle-ocean-hero";
import { WorkgoLandingSections } from "./workgo-landing-sections";

export interface WorkgoLandingPageProps {
  locale: string;
}

export function WorkgoLandingPage({ locale }: WorkgoLandingPageProps): React.JSX.Element {
  return (
    <div className="relative w-full min-h-screen bg-transparent text-fg selection:bg-primary/30">
      <LandingStaticBackground />
      <WorkgoNavbar locale={locale} />
      <ParticleOceanHero locale={locale} tone="dark" showOcean={false} />
      <WorkgoLandingSections locale={locale} />
    </div>
  );
}

export default WorkgoLandingPage;
