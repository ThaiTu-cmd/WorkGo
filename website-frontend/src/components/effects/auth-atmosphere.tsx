"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "./animated-background";
import { BackgroundMotionLayer } from "./background-motion-layer";

export interface AuthAtmosphereProps {
  className?: string;
  intensity?: "vivid" | "default" | "subtle" | "none";
  showVideo?: boolean;
}

/**
 * AuthAtmosphere: Theme-aware atmospheric background for authentication flows (Login/Register).
 * Features hardware-accelerated animated wave video with subtle radial light cones and zero canvas.
 */
export function AuthAtmosphere({
  className,
  intensity = "vivid",
  showVideo = true,
}: AuthAtmosphereProps): React.JSX.Element {
  if (intensity === "none") {
    return (
      <div
        className={cn("fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-app", className)}
        aria-hidden="true"
      />
    );
  }

  const vivid = intensity === "vivid";
  const isDefault = intensity === "default";
  const opacityClass = vivid ? "opacity-100" : isDefault ? "opacity-90" : "opacity-75";
  const rate = vivid ? 1.35 : isDefault ? 1.15 : 1.0;
  const dots = vivid ? 10 : isDefault ? 8 : 6;
  const coneClass = vivid || isDefault ? "auth-cone-animated" : "";
  const level: "vivid" | "default" | "subtle" = vivid ? "vivid" : isDefault ? "default" : "subtle";

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-app",
        className
      )}
      aria-hidden="true"
    >
      {/* Flowing particle ocean animated video background */}
      {showVideo && (
        <AnimatedBackground
          variant="none"
          showOverlay={false}
          intensity={level}
          playbackRate={rate}
          enableZoomPan={vivid}
          className="absolute inset-0 z-0 pointer-events-none"
        />
      )}

      <BackgroundMotionLayer
        variant="auth"
        intensity={level}
        dotCount={dots}
      />

      {/* Subtle atmospheric contrast scrim for form legibility without murkiness or blur */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/20 pointer-events-none" />

      {/* Subtle theme-aware radial light cones */}
      <div
        className={cn("absolute inset-0 transition-opacity duration-300 pointer-events-none", opacityClass, coneClass)}
        style={{
          background:
            vivid
              ? "radial-gradient(55% 40% at 50% 0%, color-mix(in srgb, var(--primary) 26%, transparent), transparent 70%), radial-gradient(40% 30% at 50% 100%, color-mix(in srgb, var(--color-brand-700) 22%, transparent), transparent 70%)"
              : "radial-gradient(55% 40% at 50% 0%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 70%), radial-gradient(40% 30% at 50% 100%, color-mix(in srgb, var(--color-brand-700) 15%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}

export default AuthAtmosphere;
