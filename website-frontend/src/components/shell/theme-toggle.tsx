"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let isApplying = false;

    const applyThemeToDom = (value: "dark" | "light") => {
      const el = document.documentElement;
      // Guard: không ghi DOM khi giá trị đã đúng -> tránh trigger MutationObserver vô hạn
      if (el.getAttribute("data-theme") === value && el.classList.contains(value)) {
        return;
      }
      isApplying = true;
      try {
        el.classList.remove("light", "dark");
        el.classList.add(value);
        el.setAttribute("data-theme", value);
      } finally {
        // Reset sau microtask để bỏ qua mutation do chính mình gây ra
        queueMicrotask(() => {
          isApplying = false;
        });
      }
    };

    const sync = () => {
      const saved = (localStorage.getItem("workgo_theme") as "dark" | "light") || "dark";
      setTheme((prev) => (prev === saved ? prev : saved));
      applyThemeToDom(saved);
    };

    sync();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const onCustom = () => sync();
    window.addEventListener("workgo-theme-change", onCustom);

    const obs = new MutationObserver(() => {
      if (isApplying) return;
      sync();
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      window.removeEventListener("workgo-theme-change", onCustom);
      obs.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("workgo_theme", nextTheme);
    } catch {}
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("workgo-theme-change", { detail: { theme: nextTheme } })
      );
    }
  };

  if (!mounted) {
    return (
      <div className={cn("h-9 w-9 rounded-full bg-surface/50 border border-border animate-pulse", className)} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "pressable inline-flex items-center justify-center gap-2 p-2 rounded-full",
        "bg-surface/85 backdrop-blur-md border border-border shadow-xs",
        "text-fg-secondary hover:text-fg hover:border-primary/50 transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      title={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      aria-label={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-warning animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-primary animate-in spin-in-180 duration-200" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {theme === "dark" ? "Sáng" : "Tối"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
