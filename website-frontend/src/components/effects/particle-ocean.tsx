"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ParticleOceanProps {
  className?: string;
  particleCount?: number;
  particleColor?: string;
  connectionColor?: string;
  maxConnectionDist?: number;
  speed?: number;
  mouseInfluence?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  alpha: number;
}

export function ParticleOcean({
  className,
  particleCount = 150,
  particleColor = "rgba(93, 240, 168, 0.6)",
  connectionColor = "rgba(93, 240, 168, 0.15)",
  maxConnectionDist = 120,
  speed = 0.3,
  mouseInfluence = 80,
}: ParticleOceanProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isHidden = false;

    // Accessibility check: prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Mobile adaptation: reduce particle count on mobile screens
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const effectiveCount = isMobile ? Math.min(particleCount, 80) : particleCount;

    // Mouse coordinates
    let mouseX = -9999;
    let mouseY = -9999;

    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < effectiveCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: 1 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.3 + Math.random() * 0.7,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles();
    };

    resize();

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseout", handleMouseLeave, { passive: true });

    // Window resize
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 150);
    };
    window.addEventListener("resize", handleResize);

    // Tab visibility handling
    const handleVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden && !prefersReducedMotion) {
        lastTime = performance.now();
        render(performance.now());
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pre-extract connection color prefix once outside loop to eliminate per-frame RegEx execution
    const colorPrefix = (() => {
      const rgbaMatch = connectionColor.match(/^(rgba?\([^,]+,[^,]+,[^,]+,)/);
      if (rgbaMatch) return `${rgbaMatch[1]} `;
      const rgbMatch = connectionColor.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (rgbMatch) return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, `;
      return "rgba(93, 240, 168, ";
    })();

    // If reduced motion, render single static frame
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      for (const p of particles) {
        ctx.moveTo(p.x + p.radius, p.y);
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      ctx.fill();
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseout", handleMouseLeave);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    const FRAME_INTERVAL = 1000 / 40; // ~40 FPS throttle for auth screens
    const maxDistSq = maxConnectionDist * maxConnectionDist;
    let lastTime = performance.now();
    let timeAcc = 0;

    const render = (now: number = performance.now()) => {
      if (isHidden) return;

      animationFrameId = requestAnimationFrame(render);

      if (now - lastTime < FRAME_INTERVAL) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeAcc += dt;

      ctx.clearRect(0, 0, width, height);

      // Update particle physics
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion physics with subtle wave oscillation
        p.x += p.vx * speed * 60 * dt;
        p.y += (p.vy * speed + Math.sin(p.phase + timeAcc * 0.8) * 0.15) * 60 * dt;

        // Mouse repulsion with squared distance pre-filter
        if (mouseX > 0 && mouseY > 0) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const distSq = dx * dx + dy * dy;
          if (distSq < mouseInfluence * mouseInfluence && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / mouseInfluence) * 2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Screen wrap
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;
      }

      // 1. Batched particle dots draw call (single beginPath + fill)
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.moveTo(p.x + p.radius, p.y);
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      ctx.fill();

      // 2. Connect nearby particles: Pre-filter by squared distance, eliminate regex in loop, and bucket strokes
      const bucket1: [number, number, number, number][] = [];
      const bucket2: [number, number, number, number][] = [];
      const bucket3: [number, number, number, number][] = [];

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const norm = 1 - dist / maxConnectionDist;
            if (norm > 0.66) {
              bucket3.push([p1.x, p1.y, p2.x, p2.y]);
            } else if (norm > 0.33) {
              bucket2.push([p1.x, p1.y, p2.x, p2.y]);
            } else {
              bucket1.push([p1.x, p1.y, p2.x, p2.y]);
            }
          }
        }
      }

      ctx.lineWidth = 1;
      if (bucket1.length > 0) {
        ctx.strokeStyle = `${colorPrefix}0.12)`;
        ctx.beginPath();
        for (let k = 0; k < bucket1.length; k++) {
          ctx.moveTo(bucket1[k][0], bucket1[k][1]);
          ctx.lineTo(bucket1[k][2], bucket1[k][3]);
        }
        ctx.stroke();
      }

      if (bucket2.length > 0) {
        ctx.strokeStyle = `${colorPrefix}0.26)`;
        ctx.beginPath();
        for (let k = 0; k < bucket2.length; k++) {
          ctx.moveTo(bucket2[k][0], bucket2[k][1]);
          ctx.lineTo(bucket2[k][2], bucket2[k][3]);
        }
        ctx.stroke();
      }

      if (bucket3.length > 0) {
        ctx.strokeStyle = `${colorPrefix}0.45)`;
        ctx.beginPath();
        for (let k = 0; k < bucket3.length; k++) {
          ctx.moveTo(bucket3[k][0], bucket3[k][1]);
          ctx.lineTo(bucket3[k][2], bucket3[k][3]);
        }
        ctx.stroke();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    particleColor,
    connectionColor,
    maxConnectionDist,
    speed,
    mouseInfluence,
    particleCount,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 block h-full w-full", className)}
      style={{
        contain: "strict",
        transform: "translateZ(0)",
      }}
      aria-hidden="true"
    />
  );
}
