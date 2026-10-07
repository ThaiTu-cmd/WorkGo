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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    // If reduced motion, render single static frame
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
      }
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseout", handleMouseLeave);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    let lastTime = performance.now();
    let timeAcc = 0;

    const render = (now: number) => {
      if (isHidden) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeAcc += dt;

      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion physics with subtle wave oscillation
        p.x += p.vx * speed * 60 * dt;
        p.y += (p.vy * speed + Math.sin(p.phase + timeAcc * 0.8) * 0.15) * 60 * dt;

        // Mouse repulsion
        if (mouseX > 0 && mouseY > 0) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < mouseInfluence && dist > 0) {
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

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectionDist) {
            const alpha = (1 - dist / maxConnectionDist) * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = connectionColor.replace(/[\d.]+\)$/, `${alpha})`);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
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
      aria-hidden="true"
    />
  );
}
