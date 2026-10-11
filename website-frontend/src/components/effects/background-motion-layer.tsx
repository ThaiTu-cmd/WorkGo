"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MotionLayerIntensity = "subtle" | "default" | "vivid";

export interface BackgroundMotionLayerProps {
  variant?: "landing" | "auth";
  intensity?: MotionLayerIntensity;
  className?: string;
  dotCount?: number;
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

/** Deterministic pseudo-random in [0,100) — avoids hydration mismatch (deterministic, no nondeterministic APIs). */
function pseudo(i: number, salt: number): number {
  return ((i * 37 + salt * 13 + 11) % 100 + 100) % 100;
}

/**
 * BackgroundMotionLayer: pure-CSS vivid motion layer (orbs + twinkling dots).
 * Sits above the video and below cones/scrims. Returns null when reduced-motion.
 */
export function BackgroundMotionLayer({
  variant = "landing",
  intensity = "vivid",
  className,
  dotCount,
}: BackgroundMotionLayerProps): React.JSX.Element | null {
  const isReducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  if (isReducedMotion) {
    return null;
  }

  const resolvedDots =
    dotCount ?? (intensity === "subtle" ? 6 : intensity === "default" ? 10 : variant === "auth" ? 10 : 14);
  const orbCount = intensity === "subtle" ? 1 : intensity === "default" ? 2 : 3;
  const isAuth = variant === "auth";

  const dots = Array.from({ length: resolvedDots }, (_, i) => {
    const left = pseudo(i, 1);
    const top = pseudo(i * 7 + 3, 5);
    const delay = ((i * 0.7) % 4).toFixed(2);
    const duration = (3 + ((i * 13) % 20) / 10).toFixed(2);
    const size = 2 + (i % 3);
    return { i, left, top, delay, duration, size };
  });

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        intensity === "subtle" ? "opacity-60" : "opacity-100",
        className
      )}
      aria-hidden="true"
    >
      <div className={cn("bg-orb bg-orb-a", isAuth && "bg-orb-auth")} />
      {orbCount >= 2 && <div className={cn("bg-orb bg-orb-b", isAuth && "bg-orb-auth")} />}
      {orbCount >= 3 && (
        <div className={cn("bg-orb bg-orb-c", isAuth && "bg-orb-auth")} />
      )}
      {dots.map((d) => (
        <span
          key={d.i}
          className="bg-twinkle-dot"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            opacity: isAuth ? 0.35 : undefined,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default BackgroundMotionLayer;
