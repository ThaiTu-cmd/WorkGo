"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "./animated-background";

export interface AuthAtmosphereProps {
  className?: string;
  intensity?: "subtle" | "none" | "default";
  showVideo?: boolean;
}

/**
 * AuthAtmosphere: Theme-aware atmospheric background for authentication flows (Login/Register).
 * Features hardware-accelerated animated wave video with subtle radial light cones and zero canvas.
 */
export function AuthAtmosphere({
  className,
  intensity = "subtle",
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

  const opacityClass = intensity === "subtle" ? "opacity-75" : "opacity-100";

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
          className="absolute inset-0 z-0 pointer-events-none"
        />
      )}

      {/* Subtle atmospheric contrast scrim for form legibility without murkiness or blur */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/20 pointer-events-none" />

      {/* Subtle theme-aware radial light cones */}
      <div
        className={cn("absolute inset-0 transition-opacity duration-300 pointer-events-none", opacityClass)}
        style={{
          background:
            "radial-gradient(55% 40% at 50% 0%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 70%), radial-gradient(40% 30% at 50% 100%, color-mix(in srgb, var(--color-brand-700) 15%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}

export default AuthAtmosphere;
