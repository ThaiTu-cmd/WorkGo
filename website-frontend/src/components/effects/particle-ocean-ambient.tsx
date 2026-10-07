"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ParticleOceanAmbient() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const themeRef = React.useRef<"dark" | "light">("dark");
  const [isLight, setIsLight] = React.useState(false);

  React.useEffect(() => {
    const updateTheme = () => {
      const isCurrentLight =
        document.documentElement.classList.contains("light") ||
        document.documentElement.getAttribute("data-theme") === "light";
      const nextTheme = isCurrentLight ? "light" : "dark";
      themeRef.current = nextTheme;
      setIsLight(isCurrentLight);
    };

    updateTheme();

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme?: string }>;
      if (customEvent.detail?.theme) {
        const next = customEvent.detail.theme === "light";
        themeRef.current = next ? "light" : "dark";
        setIsLight(next);
      } else {
        updateTheme();
      }
    };

    window.addEventListener("workgo-theme-change", handleThemeChange);

    const observer = new MutationObserver(() => {
      updateTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      window.removeEventListener("workgo-theme-change", handleThemeChange);
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener("resize", resize);
    resize();

    // Ambient wave grid configuration
    const cols = 28;
    const rows = 14;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      time += prefersReducedMotion ? 0 : 0.006;

      const fov = 340;
      const cameraY = -120;
      const cameraZ = -220;

      const points: { x: number; y: number; alpha: number }[][] = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        for (let c = 0; c < cols; c++) {
          const u = (c / (cols - 1)) * 2 - 1; // -1 to 1
          const v = r / (rows - 1); // 0 to 1

          const wx = u * (width * 0.7);
          const wz = 100 + v * 700;

          // Gentle sine wave calculation
          const dist = Math.sqrt(u * u + v * v);
          const wy =
            Math.sin(dist * 5 - time * 2) * 22 +
            Math.cos(u * 4 + time * 1.5) * 16;

          // 3D perspective projection
          const relZ = wz - cameraZ;
          if (relZ <= 10) continue;

          const scale = fov / relZ;
          const sx = width / 2 + wx * scale;
          const sy = height * 0.7 + (wy - cameraY) * scale;
          const alpha = Math.max(0.04, Math.min(0.45, (1 - v) * 0.5));

          points[r][c] = { x: sx, y: sy, alpha };
        }
      }

      // Check theme dynamically per frame
      const isLightMode = themeRef.current === "light";

      // Render ambient mesh lines
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r]?.[c];
          if (!p) continue;

          // Connect to right neighbor
          const pr = points[r]?.[c + 1];
          if (pr) {
            ctx.strokeStyle = isLightMode
              ? `rgba(16, 185, 129, ${p.alpha * 0.12})`
              : `rgba(93, 240, 168, ${p.alpha * 0.22})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pr.x, pr.y);
            ctx.stroke();
          }

          // Connect to row neighbor
          const pb = points[r + 1]?.[c];
          if (pb) {
            ctx.strokeStyle = isLightMode
              ? `rgba(16, 185, 129, ${p.alpha * 0.08})`
              : `rgba(93, 240, 168, ${p.alpha * 0.16})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }

          // Render particle dot
          ctx.fillStyle = isLightMode
            ? `rgba(16, 185, 129, ${p.alpha * 0.35})`
            : `rgba(93, 240, 168, ${p.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-opacity duration-300",
        isLight ? "opacity-20" : "opacity-40"
      )}
      style={{
        width: "100vw",
        height: "100vh",
      }}
      aria-hidden="true"
    />
  );
}
