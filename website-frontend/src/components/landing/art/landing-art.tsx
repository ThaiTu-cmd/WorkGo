"use client";

import * as React from "react";
import {
  Code2,
  Palette,
  Megaphone,
  Languages,
  Clapperboard,
  Bot,
  Music2,
  Briefcase,
  LifeBuoy,
  Users,
  Zap,
  ShieldCheck,
  Wallet,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InfoPageKey } from "@/lib/landing/info-content";

const ICON_MAP: Record<string, LucideIcon> = {
  Code2,
  Palette,
  Megaphone,
  Languages,
  Clapperboard,
  Bot,
  Music2,
  Briefcase,
  LifeBuoy,
  Users,
  Zap,
  ShieldCheck,
  Wallet,
  Sparkles,
};

function DynamicIcon({
  icon,
  className,
}: {
  icon: LucideIcon | string;
  className?: string;
}): React.JSX.Element {
  const Comp = typeof icon === "string" ? (ICON_MAP[icon] ?? Sparkles) : icon;
  return React.createElement(Comp, { className });
}

export interface ServiceArtProps {
  accent: [string, string];
  icon: LucideIcon | string;
  className?: string;
}

/**
 * ServiceArt — Rich visual art card for popular services with CSS gradients,
 * decorative micro-dot grid and lucide glyph. Zero external image assets.
 */
export function ServiceArt({
  accent,
  icon,
  className,
}: ServiceArtProps): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)`,
      }}
    >
      {/* Decorative concentric pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Soft radial glow behind icon */}
      <div className="pointer-events-none absolute h-28 w-28 rounded-full bg-white/15 blur-xl" />
      {/* Icon */}
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
        <DynamicIcon icon={icon} className="h-9 w-9 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
      </div>
    </div>
  );
}

export interface GuideArtProps {
  from: [string, string];
  icon: LucideIcon | string;
  className?: string;
}

/**
 * GuideArt — 4:3 ratio visual cover for guides with geometric gradients and iconography.
 */
export function GuideArt({
  from,
  icon,
  className,
}: GuideArtProps): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden rounded",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${from[0]} 0%, ${from[1]} 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-xl bg-white/15 shadow-md backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
        <DynamicIcon icon={icon} className="h-8 w-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]" />
      </div>
    </div>
  );
}

export interface CategoryArtProps {
  icon: LucideIcon | string;
  className?: string;
}

/**
 * CategoryArt — Crisp icon container for category cards.
 */
export function CategoryArt({
  icon,
  className,
}: CategoryArtProps): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
        className
      )}
    >
      <DynamicIcon icon={icon} className="h-8 w-8 text-[#222325]" />
    </div>
  );
}

export interface InfoOrbProps {
  variant: InfoPageKey;
  className?: string;
}

const ORB_PALETTES: Record<InfoPageKey, { a: string; b: string; c: string }> = {
  about: { a: "#1677FF", b: "#00D2D3", c: "#0B4DBB" },
  pricing: { a: "#1DBF73", b: "#00732E", c: "#10B981" },
  pro: { a: "#FF7640", b: "#8B5CF6", c: "#4D1727" },
  guides: { a: "#0EA5E9", b: "#6366F1", c: "#1677FF" },
  help: { a: "#14B8A6", b: "#1677FF", c: "#0D9488" },
  terms: { a: "#64748B", b: "#94A3B8", c: "#475569" },
  privacy: { a: "#10B981", b: "#0D9488", c: "#059669" },
  trustSafety: { a: "#059669", b: "#2563EB", c: "#1DBF73" },
};

/**
 * InfoOrb — Soft CSS gradient background glow for info page headers.
 * Safe for light mode, GPU-only blur, no external assets.
 */
export function InfoOrb({
  variant,
  className,
}: InfoOrbProps): React.JSX.Element {
  const p = ORB_PALETTES[variant] ?? ORB_PALETTES.about;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div
        className="absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-20 blur-3xl animate-fiverr-float"
        style={{ backgroundColor: p.a }}
      />
      <div
        className="absolute top-12 right-48 h-64 w-64 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: p.b }}
      />
      <div
        className="absolute -bottom-20 right-10 h-80 w-80 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: p.c }}
      />
    </div>
  );
}
