"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { User, Settings, Wallet, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface UserMenuProps {
  userName?: string;
  fullName?: string;
  role?: string;
  locale: string;
}

export function UserMenu({
  userName = "user",
  fullName = "Người dùng",
  role = "CLIENT",
  locale,
}: UserMenuProps) {
  const t = useTranslations("common");
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors during logout
    } finally {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Hard reload flushes client router cache
      window.location.href = `/${locale}/login`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer">
        <Avatar name={fullName} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-fg leading-none">{fullName}</p>
            <p className="text-xs text-fg-tertiary leading-none">@{userName}</p>
            <div className="pt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-subtle text-primary">
                {role === "PROVIDER" ? "Provider" : "Khách hàng"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push(`/${locale}/settings?tab=profile`)}>
          <User className="h-4 w-4 text-fg-secondary" />
          <span>{t("profile")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push(`/${locale}/settings`)}>
          <Settings className="h-4 w-4 text-fg-secondary" />
          <span>{t("settings")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push(`/${locale}/wallet`)}>
          <Wallet className="h-4 w-4 text-fg-secondary" />
          <span>{t("wallet")}</span>
        </DropdownMenuItem>

        {role === "CLIENT" && (
          <DropdownMenuItem onClick={() => router.push(`/${locale}/settings?tab=provider`)}>
            <ShieldCheck className="h-4 w-4 text-fg-secondary" />
            <span>Trở thành Provider</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
