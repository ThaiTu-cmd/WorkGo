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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = (localStorage.getItem("workgo_theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(saved);
    document.documentElement.setAttribute("data-theme", saved);
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
        "inline-flex items-center justify-center gap-2 p-2 rounded-full",
        "bg-surface/85 backdrop-blur-md border border-border shadow-xs",
        "text-fg-secondary hover:text-fg hover:border-primary/50 transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      title={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      aria-label="Chuyển đổi giao diện Sáng / Tối"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-500 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {theme === "dark" ? "Chế độ Tối" : "Chế độ Sáng"}
        </span>
      )}
    </button>
  );
}
