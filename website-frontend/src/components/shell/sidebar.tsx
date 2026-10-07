"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Inbox,
  Wallet,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLIENT_NAV_ITEMS, PROVIDER_NAV_ITEMS, type NavItem } from "./nav-config";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  FileText,
  Inbox,
  Wallet,
  Settings,
  ShieldCheck,
};

export interface SidebarProps {
  role?: string;
  locale: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onItemClick?: () => void;
}

export function Sidebar({
  role = "CLIENT",
  locale,
  className,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onItemClick,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  // Internal state for collapsible sidebar with localStorage sync
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const saved = localStorage.getItem("workgo_sidebar_collapsed");
      if (saved !== null) {
        setInternalCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : (mounted ? internalCollapsed : false);

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("workgo_sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    }
  };

  const items = role === "PROVIDER" ? PROVIDER_NAV_ITEMS : CLIENT_NAV_ITEMS;

  // Track search query on client safely without useSearchParams Suspense de-opt
  const searchQuery = React.useSyncExternalStore(
    () => () => {},
    () => (typeof window !== "undefined" ? window.location.search : ""),
    () => ""
  );

  const checkIsActive = (item: NavItem) => {
    const fullHref = `/${locale}${item.href}`;
    const [itemPath, itemQuery] = item.href.split("?");

    if (itemQuery) {
      return pathname === `/${locale}${itemPath}` && searchQuery.includes(itemQuery);
    }

    if (item.href === "/client" || item.href === "/provider") {
      return pathname === fullHref;
    }

    if (item.href === "/settings") {
      return pathname === fullHref && !searchQuery.includes("tab=provider");
    }

    if (item.href === "/posts") {
      return pathname === fullHref || pathname.startsWith(`/${locale}/posts/`);
    }

    return pathname === fullHref || pathname.startsWith(fullHref);
  };

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-surface/95 backdrop-blur-md min-h-[calc(100vh-4rem)] p-3 hidden md:flex flex-col justify-between transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-[264px]",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {/* Channel label */}
        <div
          className={cn(
            "text-[11px] font-semibold text-fg-tertiary uppercase tracking-wider mb-2 transition-all duration-200 overflow-hidden",
            isCollapsed ? "px-0 text-center opacity-70" : "px-3"
          )}
          title={role === "PROVIDER" ? "Kênh Đối tác (Provider)" : "Kênh Khách hàng"}
        >
          {isCollapsed ? (role === "PROVIDER" ? "PRO" : "CLI") : (role === "PROVIDER" ? "Kênh Đối tác (Provider)" : "Kênh Khách hàng")}
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1" aria-label="Menu điều hướng chính">
          {items.map((item: NavItem) => {
            const Icon = iconMap[item.icon] || Briefcase;
            const href = `/${locale}${item.href}`;
            const isActive = checkIsActive(item);
            const label = t(item.titleKey);

            return (
              <Link
                key={item.href}
                href={href}
                onClick={onItemClick}
                title={label}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-all duration-150 group cursor-pointer select-none",
                  isCollapsed ? "justify-center px-0" : "",
                  isActive
                    ? "bg-primary-subtle text-primary font-semibold shadow-xs shadow-primary/20"
                    : "text-fg-secondary hover:text-fg hover:bg-muted"
                )}
              >
                {/* Active Indicator Accent Line */}
                {isActive && (
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-primary transition-all duration-200",
                      isCollapsed && "h-8"
                    )}
                  />
                )}

                {/* Icon with micro-bounce on hover */}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110",
                    isActive ? "text-primary" : "text-fg-tertiary group-hover:text-primary"
                  )}
                />

                {/* Text Label */}
                {!isCollapsed && (
                  <span className="truncate flex-1 leading-none">{label}</span>
                )}

                {/* Optional Badge */}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls & Network Status */}
      <div className="flex flex-col gap-2 pt-3 border-t border-border mt-auto">
        {/* Network Status Widget */}
        {isCollapsed ? (
          <div className="flex justify-center p-2" title="WorkGo Network: Trực tuyến (v1.0.0)">
            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          </div>
        ) : (
          <div className="px-3 py-2 rounded-control bg-muted/60 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-fg-secondary font-medium">WorkGo Network</span>
            </div>
            <span className="text-[10px] text-fg-tertiary font-mono">v1.0.0</span>
          </div>
        )}

        {/* Collapsible Toggle Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "flex items-center gap-2 p-2 rounded-control text-xs text-fg-secondary hover:text-fg hover:bg-muted transition-colors cursor-pointer w-full select-none",
            isCollapsed ? "justify-center" : "justify-start px-3"
          )}
          aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
              <span className="truncate">Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
