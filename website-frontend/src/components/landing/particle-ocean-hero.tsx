"use client";

import * as React from "react";
import { ParticleOceanWebGL } from "@/components/effects/particle-ocean-webgl";

export interface ParticleOceanHeroProps {
  locale?: string;
  headline?: string;
  sub?: string;
  ctaPrimary?: {
    label: string;
    href: string;
  };
  ctaSecondary?: {
    label: string;
    href: string;
  };
  navbarSlot?: React.ReactNode;
}

/**
 * Reusable hero section showcasing Particle Ocean WebGL background
 * Designed for light-tone aesthetic with high-contrast navy typography.
 */
export function ParticleOceanHero({
  locale = "vi",
  headline,
  sub,
  ctaPrimary,
  ctaSecondary,
  navbarSlot,
}: ParticleOceanHeroProps): React.JSX.Element {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#FFFFFF]">
      {/* Background WebGL Particle Ocean Engine (pointer-events disabled) */}
      <ParticleOceanWebGL fixed={false} />

      {/* Optional top navbar slot */}
      {navbarSlot && (
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {navbarSlot}
        </header>
      )}

      {/* Hero Content positioned over the bright top haze area */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-[16vh] pb-16 text-center flex flex-col items-center">
        <h1 className="text-[#0B1B3F] text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.15]">
          {headline || "Next-Generation Autonomous Talent Platform"}
        </h1>

        <p className="mt-6 text-[#33415E] text-lg md:text-xl max-w-2xl font-normal leading-relaxed">
          {sub ||
            "Harness the power of AI-orchestrated workflows with instant settlement, verified credibility, and frictionless project execution."}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={ctaPrimary?.href || `/${locale}/posts`}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold text-white bg-[#2F6BFF] hover:bg-[#1747C9] shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer pointer-events-auto"
          >
            {ctaPrimary?.label || "Khám phá ngay"}
          </a>
          <a
            href={ctaSecondary?.href || `/${locale}/login`}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold text-[#0B1B3F] bg-white/80 hover:bg-white border border-[#BFD8FF] shadow-sm backdrop-blur-sm transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer pointer-events-auto"
          >
            {ctaSecondary?.label || "Đăng nhập"}
          </a>
        </div>
      </div>
    </section>
  );
}

export default ParticleOceanHero;
