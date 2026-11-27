"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

function readValidTheme(): "dark" | "light" | null {
  try {
    const saved = localStorage.getItem("workgo_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // storage blocked
  }
  return null;
}

function resolveInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  const saved = readValidTheme();
  if (saved) return saved;
  const domTheme = document.documentElement.getAttribute("data-theme");
  if (domTheme === "dark" || domTheme === "light") return domTheme;
  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyThemeToDom(nextTheme: "dark" | "light") {
  const root = document.documentElement;
  root.setAttribute("data-theme", nextTheme);
  root.classList.remove("light", "dark");
  root.classList.add(nextTheme);
  root.style.colorScheme = nextTheme;
}

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(resolveInitialTheme);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Re-apply theme on mount: soft navigations (language switch) do not re-run
    // the beforeInteractive script, so data-theme/class may be missing.
    const initial = resolveInitialTheme();
    setTheme(initial);
    applyThemeToDom(initial);

    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: "dark" | "light" }>).detail;
      if (detail?.theme === "dark" || detail?.theme === "light") {
        setTheme(detail.theme);
        applyThemeToDom(detail.theme);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "workgo_theme" && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
        applyThemeToDom(e.newValue);
      }
    };

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!readValidTheme()) {
        const systemTheme = e.matches ? "dark" : "light";
        setTheme(systemTheme);
        applyThemeToDom(systemTheme);
      }
    };

    window.addEventListener("workgo-theme-changed", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    mediaQuery?.addEventListener("change", handleMediaChange);
    return () => {
      window.removeEventListener("workgo-theme-changed", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
      mediaQuery?.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyThemeToDom(nextTheme);

    try {
      localStorage.setItem("workgo_theme", nextTheme);
    } catch {
      // storage blocked
    }

    if (typeof window !== "undefined") {
      (window as unknown as { __workgoThemeSwitching?: boolean }).__workgoThemeSwitching = true;
      window.dispatchEvent(new CustomEvent("workgo-theme-changed", { detail: { theme: nextTheme } }));
      window.setTimeout(() => {
        (window as unknown as { __workgoThemeSwitching?: boolean }).__workgoThemeSwitching = false;
      }, 500);
    }
  };

  const isDark = theme === "dark";

  // Prevent hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center p-2 rounded-lg min-h-[44px] min-w-[44px] cursor-pointer opacity-70 border ${className}`}
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
        aria-label="Chuyển chế độ giao diện Sáng / Tối"
        disabled
      >
        <Moon size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] cursor-pointer border ${className}`}
      style={{
        color: "var(--text-primary)",
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
      aria-label={`Chuyển sang giao diện ${isDark ? "Sáng" : "Tối"}`}
      title={`Đang dùng giao diện ${isDark ? "Tối" : "Sáng"}. Nhấn để đổi sang ${isDark ? "Sáng" : "Tối"}.`}
    >
      {isDark ? (
        <Sun size={18} style={{ color: "var(--primary-text)" }} aria-hidden="true" />
      ) : (
        <Moon size={18} style={{ color: "var(--primary-text)" }} aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-xs font-medium whitespace-nowrap">
          {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
        </span>
      )}
    </button>
  );
}