"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Briefcase, FileText, Inbox, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({
  locale,
  role = "CLIENT",
}: {
  locale: string;
  role?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("common");

  const navItems =
    role === "PROVIDER"
      ? [
          { href: "/provider", label: t("dashboard"), icon: LayoutDashboard },
          { href: "/posts", label: t("posts"), icon: Briefcase },
          { href: "/wallet", label: t("wallet"), icon: Wallet },
          { href: "/settings", label: t("settings"), icon: Settings },
        ]
      : [
          { href: "/client", label: t("dashboard"), icon: LayoutDashboard },
          { href: "/posts", label: t("posts"), icon: Briefcase },
          { href: "/client/posts", label: t("myPosts"), icon: FileText },
          { href: "/client/applications", label: t("applications"), icon: Inbox },
          { href: "/wallet", label: t("wallet"), icon: Wallet },
          { href: "/settings", label: t("settings"), icon: Settings },
        ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-md border-t border-border/80 flex items-center justify-around h-16 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-all duration-200">
      {navItems.map((item) => {
        const Icon = item.icon;
        const fullHref = `/${locale}${item.href}`;
        const isActive =
          item.href === "/client" || item.href === "/provider"
            ? pathname === fullHref
            : pathname === fullHref || (item.href !== "/settings" && pathname.startsWith(fullHref));

        return (
          <Link
            key={item.href}
            href={fullHref}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all group active:scale-95",
              isActive ? "text-primary font-semibold" : "text-fg-secondary hover:text-fg"
            )}
          >
            <Icon className={cn("h-5 w-5 mb-0.5 transition-transform duration-150 group-hover:scale-110", isActive ? "text-primary" : "text-fg-tertiary")} />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
