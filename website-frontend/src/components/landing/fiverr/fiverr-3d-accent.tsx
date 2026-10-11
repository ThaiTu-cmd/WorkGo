"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useReveal } from "@/lib/motion";

export interface Fiverr3dAccentProps {
  locale?: string;
  className?: string;
  density?: number;
}

const ThreeCanvas = dynamic(() => import("./fiverr-3d-canvas"), {
  ssr: false,
  loading: () => null,
});

export function Fiverr3dAccent({
  locale,
  className,
  density = 300,
}: Fiverr3dAccentProps) {
  void locale; // locale giữ parity i18n
  const [enabled, setEnabled] = React.useState(false);
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0 });

  React.useEffect(() => {
    if (!visible) return;
    const hasWebGL = (() => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        return false;
      }
    })();
    const reduced =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const saveData =
      typeof navigator !== "undefined" &&
      ((navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData ?? false);

    if (hasWebGL && !reduced && !saveData) {
      const raf = requestAnimationFrame(() => setEnabled(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [visible]);

  if (!enabled) {
    return <div aria-hidden="true" className={className} />;
  }

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <ThreeCanvas density={density} />
    </div>
  );
}
