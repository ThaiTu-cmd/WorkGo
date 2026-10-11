import * as React from "react";

export const EASES = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  press: "cubic-bezier(0.75, 0, 0.25, 1)",
} as const;

export const DURATIONS = {
  fast: 150,
  med: 300,
  slow: 620,
  stagger: 80,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useMounted(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function useReveal<T extends HTMLElement>(opts?: { threshold?: number }): {
  ref: React.RefObject<T | null>;
  visible: boolean;
} {
  const ref = React.useRef<T | null>(null);
  const [visible, setVisible] = React.useState(false);
  const mounted = useMounted();

  React.useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: opts?.threshold ?? 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, opts?.threshold]);

  return { ref, visible };
}
