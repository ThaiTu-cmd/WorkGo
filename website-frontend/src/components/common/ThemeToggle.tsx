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

  const isDark = theme === "dark";

  // Prevent hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center p-2 rounded-lg min-h-[44px] min-w-[44px] cursor-pointer opacity-70 ${className}`}
        style={{ color: "var(--text-secondary, #94a3b8)" }}
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
      className={`inline-flex items-center justify-center gap-2 p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] cursor-pointer shadow-sm ${className}`}
      style={{
        color: isDark ? "var(--text-primary, #F8FCFF)" : "var(--text-primary, #06142F)",
        background: isDark ? "var(--bg-muted, #0A1F4D)" : "var(--bg-muted, #EDF5FF)",
        border: "1px solid var(--border-default, #D3E3F8)",
      }}
      aria-label={`Chuyển sang giao diện ${isDark ? "Sáng" : "Tối"}`}
      title={`Đang dùng giao diện ${isDark ? "Tối" : "Sáng"}. Nhấn để đổi sang ${isDark ? "Sáng" : "Tối"}.`}
    >
      {isDark ? (
        <Sun size={18} style={{ color: "#F59E0B" }} className="transition-transform hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon size={18} style={{ color: "#1dbf73" }} className="transition-transform hover:-rotate-12" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
        </span>
      )}
    </button>
  );
}