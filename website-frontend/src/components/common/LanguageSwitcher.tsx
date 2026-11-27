"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "button" | "pill" | "footer";
}

export default function LanguageSwitcher({
  className = "",
  variant = "pill",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale: "vi" | "en" = pathname.startsWith("/en") ? "en" : "vi";

  const handleSwitchLanguage = (targetLocale: "vi" | "en") => {
    if (targetLocale === currentLocale) return;
    if (typeof window !== "undefined" && (window as unknown as { __workgoThemeSwitching?: boolean }).__workgoThemeSwitching) return;

    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
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

    router.push(`${newPathname}${search}${hash}`);
  };

  const toggleLanguage = () => {
    handleSwitchLanguage(currentLocale === "vi" ? "en" : "vi");
  };

  const languageLabel = currentLocale === "en" ? "English" : "Tiếng Việt";
  const switchLabel = `Ngôn ngữ: ${languageLabel}. Nhấn để đổi.`;

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer rounded-lg border min-h-[44px] min-w-[44px] justify-center ${className}`}
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
        aria-label={switchLabel}
        title="Chuyển đổi ngôn ngữ / Switch language"
      >
        <Globe size={15} style={{ color: "var(--primary-text)" }} className="shrink-0" aria-hidden="true" />
        <span>{currentLocale === "en" ? "English (EN)" : "Tiếng Việt (VI)"}</span>
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors min-h-[44px] cursor-pointer border ${className}`}
        style={{
          color: "var(--text-primary)",
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
        aria-label={switchLabel}
        title="Chuyển đổi ngôn ngữ / Switch language"
      >
        <Globe size={16} style={{ color: "var(--primary-text)" }} aria-hidden="true" />
        <span className="text-sm font-medium">{languageLabel}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg border p-0.5 text-xs select-none ${className}`}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => handleSwitchLanguage("vi")}
        className="flex items-center justify-center px-2.5 rounded-md min-h-[38px] min-w-[38px] text-xs font-semibold transition-colors cursor-pointer"
        style={
          currentLocale === "vi"
            ? { background: "var(--primary)", color: "#ffffff" }
            : { color: "var(--text-secondary)", background: "transparent" }
        }
        aria-pressed={currentLocale === "vi"}
        aria-label="Tiếng Việt"
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleSwitchLanguage("en")}
        className="flex items-center justify-center px-2.5 rounded-md min-h-[38px] min-w-[38px] text-xs font-semibold transition-colors cursor-pointer"
        style={
          currentLocale === "en"
            ? { background: "var(--primary)", color: "#ffffff" }
            : { color: "var(--text-secondary)", background: "transparent" }
        }
        aria-pressed={currentLocale === "en"}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
