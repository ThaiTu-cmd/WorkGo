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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./app-header";
import { Sidebar } from "./sidebar";
import { AppContentArea } from "./app-content-area";
import { MobileNav } from "./mobile-nav";
import { CLIENT_NAV_ITEMS, PROVIDER_NAV_ITEMS, type NavItem } from "./nav-config";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  FileText,
  Inbox,
  Wallet,
  Settings,
  ShieldCheck,
};

export interface AppShellClientProps {
  children: React.ReactNode;
  locale: string;
  role?: string;
  userName?: string;
  fullName?: string;
  ambient?: "subtle" | "off";
}

export function AppShellClient({
  children,
  locale,
  role = "CLIENT",
  userName = "user",
  fullName = "Người dùng",
  ambient = "subtle",
}: AppShellClientProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Load sidebar collapsed state from localStorage on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("workgo_sidebar_collapsed");
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSidebarCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("workgo_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const navItems = role === "PROVIDER" ? PROVIDER_NAV_ITEMS : CLIENT_NAV_ITEMS;

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

  // Ambient intensity mode acknowledgment (deprecated)
  void ambient;

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-app flex flex-col relative">
      {/* Top Header with Hamburger for Mobile */}
      <AppHeader
        locale={locale}
        role={role}
        userName={userName}
        fullName={fullName}
        onOpenMobileMenu={() => setMobileDrawerOpen(true)}
      />

      {/* Main Body Area: Sidebar flush to viewport left edge + Independent Content Area */}
      <div className="flex-1 flex w-full relative z-10 overflow-hidden">
        <Sidebar
          role={role}
          locale={locale}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        <AppContentArea>{children}</AppContentArea>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav locale={locale} role={role} />

      {/* Mobile Drawer Navigation (Slides from Left) */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent side="left" className="h-[100dvh] bg-surface/95 backdrop-blur-2xl border-r border-border">
          <DrawerHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-control bg-gradient-to-br from-[#1677FF] to-[#0B4DBB] flex items-center justify-center text-white font-black text-sm leading-none select-none shadow-xs">
                W
              </div>
              <DrawerTitle className="text-base font-bold text-primary">WorkGo</DrawerTitle>
            </div>
            <div className="text-[11px] font-semibold text-fg-tertiary uppercase tracking-wider mt-1">
              {role === "PROVIDER" ? "Kênh Đối tác (Provider)" : "Kênh Khách hàng"}
            </div>
          </DrawerHeader>

          <DrawerBody className="p-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon] || Briefcase;
                const href = `/${locale}${item.href}`;
                const isActive = checkIsActive(item);
                const label = t(item.titleKey);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 rounded-control text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-subtle text-primary font-semibold"
                        : "text-fg-secondary hover:text-fg hover:bg-muted"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-primary" />
                    )}
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-fg-tertiary")} />
                    <span className="flex-1 truncate">{label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
