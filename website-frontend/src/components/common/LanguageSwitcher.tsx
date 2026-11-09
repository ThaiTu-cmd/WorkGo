"use client";

import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "button" | "pill" | "footer";
}

export default function LanguageSwitcher({
  className = "",
  variant = "pill",
}: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState<"vi" | "en">("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (typeof window !== "undefined") {
      setCurrentLocale(window.location.pathname.startsWith("/en") ? "en" : "vi");
    }

    const handlePopState = () => {
      setCurrentLocale(window.location.pathname.startsWith("/en") ? "en" : "vi");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSwitchLanguage = (targetLocale: "vi" | "en") => {
    if (typeof window === "undefined") return;
    if (targetLocale === currentLocale) return;

    const { pathname, search, hash } = window.location;
    let newPathname = pathname;

    if (pathname.startsWith("/vi")) {
      newPathname = pathname.replace(/^\/vi/, `/${targetLocale}`);
    } else if (pathname.startsWith("/en")) {
      newPathname = pathname.replace(/^\/en/, `/${targetLocale}`);
    } else if (pathname === "/" || pathname === "") {
      newPathname = `/${targetLocale}`;
    } else {
      newPathname = `/${targetLocale}${pathname}`;
    }

    const targetUrl = `${newPathname}${search}${hash}`;
    window.location.href = targetUrl;
  };

  const toggleLanguage = () => {
    handleSwitchLanguage(currentLocale === "vi" ? "en" : "vi");
  };

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer rounded border min-h-[44px] min-w-[44px] justify-center ${className}`}
        style={{
          color: "var(--text-secondary, #62646a)",
          background: "var(--bg-surface, #ffffff)",
          borderColor: "var(--border-default, #e4e5e7)",
        }}
        aria-label={`Ngôn ngữ: ${mounted && currentLocale === "en" ? "English" : "Tiếng Việt"}. Nhấn để đổi.`}
        title="Chuyển đổi ngôn ngữ / Switch language"
        suppressHydrationWarning
      >
        <Globe size={15} style={{ color: "var(--primary, #1dbf73)" }} className="shrink-0" aria-hidden="true" />
        <span>{mounted && currentLocale === "en" ? "English (EN)" : "Tiếng Việt (VI)"}</span>
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all min-h-[44px] cursor-pointer border ${className}`}
        style={{
          color: "var(--text-primary)",
          background: "var(--bg-muted)",
          borderColor: "var(--border-default)",
        }}
        aria-label={`Ngôn ngữ: ${mounted && currentLocale === "en" ? "English" : "Tiếng Việt"}. Nhấn để đổi.`}
        title="Chuyển đổi ngôn ngữ / Switch language"
        suppressHydrationWarning
      >
        <Globe size={16} style={{ color: "var(--primary, #1dbf73)" }} aria-hidden="true" />
        <span className="text-sm font-medium">
          {mounted && currentLocale === "en" ? "English" : "Tiếng Việt"}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg border p-0.5 shadow-sm text-xs select-none ${className}`}
      style={{
        background: "var(--bg-muted)",
        borderColor: "var(--border-default)",
      }}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => handleSwitchLanguage("vi")}
        className="flex items-center justify-center px-2 py-1.5 rounded-md min-h-[44px] min-w-[44px] text-xs font-semibold transition-all cursor-pointer"
        style={
          !mounted || currentLocale === "vi"
            ? { background: "var(--primary, #1dbf73)", color: "#FFFFFF" }
            : { color: "var(--text-secondary)" }
        }
        aria-pressed={!mounted || currentLocale === "vi"}
        aria-label="Tiếng Việt"
        suppressHydrationWarning
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleSwitchLanguage("en")}
        className="flex items-center justify-center px-2 py-1.5 rounded-md min-h-[44px] min-w-[44px] text-xs font-semibold transition-all cursor-pointer"
        style={
          mounted && currentLocale === "en"
            ? { background: "var(--primary, #1dbf73)", color: "#FFFFFF" }
            : { color: "var(--text-secondary)" }
        }
        aria-pressed={mounted && currentLocale === "en"}
        aria-label="English"
        suppressHydrationWarning
      >
        EN
      </button>
    </div>
  );
}