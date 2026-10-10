"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/effects/animated-background";

export interface LandingStaticBackgroundProps {
  className?: string;
  showVideo?: boolean;
}

export function LandingStaticBackground({
  className,
  showVideo = true,
}: LandingStaticBackgroundProps) {
  return (
    <div
      className={cn("fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-app", className)}
      aria-hidden="true"
    >
      {/* Flowing animated background video with seamless loop & fallbacks */}
      {showVideo && (
        <AnimatedBackground
          variant="none"
          showOverlay={false}
          className="absolute inset-0 z-0 pointer-events-none"
        />
      )}

      {/* Top light cone — brand glow, static */}
      <div className="absolute inset-0 landing-static-cone pointer-events-none z-[1]" />

      {/* Bottom vignette for section continuity */}
      <div className="absolute inset-0 landing-static-vignette pointer-events-none z-[2]" />

      {/* Theme-adaptive subtle bottom gradient for smooth section transition without washing out particles */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15 dark:to-black/25 pointer-events-none z-[3]" />
    </div>
  );
}

export default LandingStaticBackground;
