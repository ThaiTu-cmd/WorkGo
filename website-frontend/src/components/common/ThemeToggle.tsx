"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const savedTheme = localStorage.getItem("workgo_theme") as "dark" | "light" | null;
      const domTheme = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
      return savedTheme || domTheme || "dark";
    } catch {
      return "dark";
    }
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: "dark" | "light" }>).detail;
      if (detail?.theme) {
        setTheme(detail.theme);
      }
    };

    window.addEventListener("workgo-theme-changed", handleThemeChange);
    return () => window.removeEventListener("workgo-theme-changed", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);

    try {
      localStorage.setItem("workgo_theme", nextTheme);
    } catch {
      // storage blocked
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("workgo-theme-changed", { detail: { theme: nextTheme } }));
    }
  };

  // Prevent hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center p-2 rounded-lg text-slate-400 min-h-[44px] min-w-[44px] cursor-pointer opacity-70 ${className}`}
        aria-label="Chuyển chế độ giao diện Sáng / Tối"
        disabled
      >
        <Moon size={18} aria-hidden="true" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/80 transition-all min-h-[44px] min-w-[44px] cursor-pointer shadow-sm ${className}`}
      aria-label={`Chuyển sang giao diện ${isDark ? "Sáng" : "Tối"}`}
      title={`Đang dùng giao diện ${isDark ? "Tối" : "Sáng"}. Nhấn để đổi sang ${isDark ? "Sáng" : "Tối"}.`}
    >
      {isDark ? (
        <Sun size={18} className="text-amber-400 transition-transform hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon size={18} className="text-blue-500 transition-transform hover:-rotate-12" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
        </span>
      )}
    </button>
  );
}
