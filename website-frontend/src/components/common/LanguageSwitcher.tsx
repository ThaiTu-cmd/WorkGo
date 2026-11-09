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
  // 1. Khởi tạo ổn định trên cả Server và Client render đầu tiên
  const [currentLocale, setCurrentLocale] = useState<"vi" | "en">("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 2. Chỉ đọc window.location sau khi component đã mount trên Client
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
    // Điều hướng toàn trang để Next.js nạp lại dictionary locale chuẩn
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = targetUrl;
  };

  const toggleLanguage = () => {
    handleSwitchLanguage(currentLocale === "vi" ? "en" : "vi");
  };

  // Render an toàn chống hydration mismatch
  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer rounded border border-slate-700 hover:border-slate-500 bg-slate-800/60 min-h-[44px] min-w-[44px] justify-center ${className}`}
        aria-label={`Ngôn ngữ: ${mounted && currentLocale === "en" ? "English" : "Tiếng Việt"}. Nhấn để đổi.`}
        title="Chuyển đổi ngôn ngữ / Switch language"
        suppressHydrationWarning
      >
        <Globe size={15} className="text-blue-400 shrink-0" aria-hidden="true" />
        <span>{mounted && currentLocale === "en" ? "English (EN)" : "Tiếng Việt (VI)"}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg bg-slate-800/70 border border-slate-700/80 p-0.5 shadow-sm text-xs select-none ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => handleSwitchLanguage("vi")}
        className={`flex items-center justify-center px-2 py-1.5 rounded-md min-h-[44px] min-w-[44px] text-xs font-semibold transition-all cursor-pointer ${
          (!mounted || currentLocale === "vi")
            ? "bg-blue-600 text-white shadow-sm font-bold"
            : "text-slate-400 hover:text-slate-200"
        }`}
        aria-pressed={!mounted || currentLocale === "vi"}
        aria-label="Tiếng Việt"
        suppressHydrationWarning
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleSwitchLanguage("en")}
        className={`flex items-center justify-center px-2 py-1.5 rounded-md min-h-[44px] min-w-[44px] text-xs font-semibold transition-all cursor-pointer ${
          mounted && currentLocale === "en"
            ? "bg-blue-600 text-white shadow-sm font-bold"
            : "text-slate-400 hover:text-slate-200"
        }`}
        aria-pressed={mounted && currentLocale === "en"}
        aria-label="English"
        suppressHydrationWarning
      >
        EN
      </button>
    </div>
  );
}
