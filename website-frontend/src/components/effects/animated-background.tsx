/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BackgroundIntensity = "subtle" | "default" | "vivid";

export interface AnimatedBackgroundProps {
  className?: string;
  overlayClassName?: string;
  variant?: "landing" | "auth" | "subtle" | "none";
  showOverlay?: boolean;
  videoWebmSrc?: string;
  videoMp4Src?: string;
  fallbackImageSrc?: string;
  intensity?: BackgroundIntensity;
  playbackRate?: number;
  enableZoomPan?: boolean;
}

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * AnimatedBackground: High-performance, hardware-accelerated animated background component.
 * Features:
 * - WebM (VP9) as preferred source with MP4 (H.264) fallback and static image final fallback
 * - autoplay, muted, loop, playsInline, object-cover
 * - pointer-events-none and -z-10 to never obstruct user interaction
 * - Zero CPU/GPU loop overhead (relies on browser hardware video decoding)
 * - Strict accessibility compliance: stops video and displays static fallback when prefers-reduced-motion is enabled
 */
export function AnimatedBackground({
  className,
  overlayClassName,
  variant = "landing",
  showOverlay = true,
  videoWebmSrc = "/assets/particle-ocean.webm",
  videoMp4Src = "/assets/particle-ocean.mp4",
  fallbackImageSrc = "/assets/particle-ocean-fallback.webp",
  intensity,
  playbackRate,
  enableZoomPan,
}: AnimatedBackgroundProps): React.JSX.Element {
  const isReducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const resolvedIntensity: BackgroundIntensity =
    intensity ?? (variant === "auth" ? "default" : "vivid");
  const resolvedRate =
    playbackRate ??
    (resolvedIntensity === "vivid" ? 1.25 : resolvedIntensity === "default" ? 1.15 : 1.0);
  const resolvedZoomPan = enableZoomPan ?? resolvedIntensity === "vivid";

  // Attempt autoplay safely in case of browser power-save policies
  React.useEffect(() => {
    if (!isReducedMotion && videoRef.current) {
      try {
        videoRef.current.playbackRate = resolvedRate;
      } catch {
        // playbackRate unsupported; ignore
      }
      videoRef.current.play().catch(() => {
        // Autoplay policy prevented playback; poster/fallback image is visible
      });
    }
  }, [isReducedMotion, resolvedRate]);

  return (
    <div
      className={cn(
        "fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Media Layer: Static fallback when reduced-motion is requested; otherwise hardware video */}
      {isReducedMotion ? (
        <img
          src={fallbackImageSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none"
          aria-hidden="true"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={fallbackImageSrc}
          className={cn(
            "absolute inset-0 w-full h-full object-cover select-none",
            resolvedZoomPan && !isReducedMotion && "bg-motion-vivid"
          )}
          aria-hidden="true"
        >
          <source src={videoWebmSrc} type="video/webm" />
          <source src={videoMp4Src} type="video/mp4" />
          {/* Final fallback if browser cannot render HTML5 video */}
          <img
            src={fallbackImageSrc}
            alt=""
            className="w-full h-full object-cover select-none"
            aria-hidden="true"
          />
        </video>
      )}

      {/* 2. Overlays for text readability & visual integration */}
      {showOverlay && (
        <>
          {variant === "landing" && (
            <>
              {/* Subtle brand radiance cone */}
              <div className="absolute inset-0 landing-static-cone pointer-events-none z-[1]" />
              {/* Soft bottom vignette for section readability */}
              <div className="absolute inset-0 landing-static-vignette pointer-events-none z-[2]" />
              {/* Subtle bottom gradient for section transition without washing out particles */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15 dark:to-black/25 pointer-events-none z-[3]" />
            </>
          )}

          {variant === "auth" && (
            <>
              {/* Auth atmospheric depth scrim without blur or murkiness */}
              <div className="absolute inset-0 bg-black/10 dark:bg-black/20 pointer-events-none z-[1]" />
              {/* Theme-aware radial light cones */}
              <div
                className="absolute inset-0 pointer-events-none opacity-80 z-[2]"
                style={{
                  background:
                    "radial-gradient(55% 40% at 50% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%), radial-gradient(40% 30% at 50% 100%, color-mix(in srgb, var(--color-brand-700) 18%, transparent), transparent 70%)",
                }}
              />
            </>
          )}

          {variant === "subtle" && (
            <div className="absolute inset-0 bg-app/25 pointer-events-none z-[1]" />
          )}

          {overlayClassName && (
            <div className={cn("absolute inset-0 pointer-events-none z-[4]", overlayClassName)} />
          )}
        </>
      )}
    </div>
  );
}

export default AnimatedBackground;
