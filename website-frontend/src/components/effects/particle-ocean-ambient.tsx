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
    let isHidden = false;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resize);
    resize();

    // Tab visibility handling: pause render when tab is backgrounded
    const handleVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden && !prefersReducedMotion) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Ambient wave grid configuration
    const cols = 28;
    const rows = 14;
    const FRAME_INTERVAL = 1000 / 36; // ~36 FPS throttle
    let lastTime = performance.now();

    const render = (now: number = performance.now()) => {
      if (isHidden) return;

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }

      if (now - lastTime < FRAME_INTERVAL) return;
      lastTime = now;

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

      // 1. Batched horizontal right connections
      const p = { alpha: 1 };
      ctx.lineWidth = 1;
      ctx.strokeStyle = isLightMode
        ? `rgba(16, 185, 129, ${p.alpha * 0.12})`
        : `rgba(93, 240, 168, ${p.alpha * 0.22})`;

      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const pt = points[r]?.[c];
          const pr = points[r]?.[c + 1];
          if (pt && pr) {
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pr.x, pr.y);
          }
        }
      }
      ctx.stroke();

      // 2. Batched vertical row connections
      ctx.strokeStyle = isLightMode
        ? `rgba(16, 185, 129, ${p.alpha * 0.08})`
        : `rgba(93, 240, 168, ${p.alpha * 0.16})`;

      ctx.beginPath();
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = points[r]?.[c];
          const pb = points[r + 1]?.[c];
          if (pt && pb) {
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pb.x, pb.y);
          }
        }
      }
      ctx.stroke();

      // 3. Batched particle dots
      ctx.fillStyle = isLightMode
        ? `rgba(16, 185, 129, ${p.alpha * 0.35})`
        : `rgba(93, 240, 168, ${p.alpha * 0.8})`;

      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = points[r]?.[c];
          if (pt) {
            ctx.moveTo(pt.x + 1.4, pt.y);
            ctx.arc(pt.x, pt.y, 1.4, 0, Math.PI * 2);
          }
        }
      }
      ctx.fill();
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
        contain: "strict",
        transform: "translateZ(0)",
      }}
      aria-hidden="true"
    />
  );
}
