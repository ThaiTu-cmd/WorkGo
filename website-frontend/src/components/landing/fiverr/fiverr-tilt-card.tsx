"use client";

import * as React from "react";
import { FIVERR_3D } from "@/lib/landing/fiverr-tokens";

export interface FiverrTiltCardProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}

/**
 * FiverrTiltCard — 3D interactive tilt wrapper.
 *
 * Physics & ergonomics:
 * - perspective 800px, rotateX/Y <= 8deg, subtle scale3d.
 * - Active strictly on fine-pointer hover devices (`(hover: hover) and (pointer: fine)`).
 * - Bypassed under `prefers-reduced-motion` and touch screens (preventing scroll-lock).
 * - Smooth cubic-bezier spring return on pointer leave.
 */
export function FiverrTiltCard({
  children,
  className,
  max = FIVERR_3D.tiltMax,
  scale = 1.02,
}: FiverrTiltCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -max;
    const rotateY = ((x - centerX) / centerX) * max;

    setStyle({
      transform: `perspective(${FIVERR_3D.perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`,
      transition: "transform 100ms cubic-bezier(0.22, 1, 0.36, 1)",
    });
  };

  const handlePointerLeave = () => {
    setStyle({
      transform: `perspective(${FIVERR_3D.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
    });
  };

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={(className ?? "") + " focus-elevate"}
      style={{
        transformStyle: "preserve-3d",
        touchAction: "manipulation",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default FiverrTiltCard;
