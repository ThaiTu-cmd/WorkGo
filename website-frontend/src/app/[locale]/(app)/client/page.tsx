"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  PlusCircle,
  FileText,
  Inbox,
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getGreeting(t: (k: string) => string) {
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) {
    return t("greetingMorning");
  }
  if (hours >= 12 && hours < 18) {
    return t("greetingAfternoon");
  }
  return t("greetingEvening");
}

export default function ClientDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const t = useTranslations("dashboard");
  const greeting = getGreeting(t);

  return (
    <PageContainer>
      {/* 1. Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-surface via-surface/95 to-surface border border-border p-6 md:p-8 shadow-md mb-8 animate-fade-up backdrop-blur-xl">
        {/* Glow ambient background effects */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-16 w-48 h-48 bg-info/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>{greeting}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fg">
              {t("clientTitle")}
            </h1>
            <p className="text-sm text-fg-secondary leading-relaxed">
              {t("clientSubtitle")}
            </p>
          </div>

          <div className="shrink-0">
            <Link href={`/${locale}/client/posts/new`}>
              <Button
                variant="primary"
                size="lg"
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <PlusCircle className="h-5 w-5" />
                <span>{t("newPost")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Animated Stats Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Bài đăng đang mở */}
        <Link href={`/${locale}/client/posts`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("openPosts")}
                </span>
                <div className="p-2.5 rounded-full bg-primary/15 text-primary group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-fg">3</span>
                  <Badge variant="success" className="text-[11px] font-medium">
                    {t("hiringBadge")}
                  </Badge>
                </div>
                <p className="text-xs text-fg-tertiary">{t("openPostsDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Đề xuất mới nhận */}
        <Link href={`/${locale}/client/applications`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("newProposals")}
                </span>
                <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
                  <Inbox className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-fg">8</span>
                  <Badge variant="warning" className="text-[11px] font-medium">
                    {t("reviewBadge")}
                  </Badge>
                </div>
                <p className="text-xs text-fg-tertiary">{t("newProposalsDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Số dư khả dụng */}
        <Link href={`/${locale}/wallet`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("availableBalance")}
                </span>
                <div className="p-2.5 rounded-full bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-fg font-mono">
                    15.500.000₫
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-fg-tertiary">{t("availableBalanceDesc")}</p>
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    {t("topupWallet")} →
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Đang giữ Escrow */}
        <Link href={`/${locale}/wallet`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("escrowHold")}
                </span>
                <div className="p-2.5 rounded-full bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-fg font-mono">
                    4.200.000₫
                  </span>
                  <Badge variant="outline" className="text-[11px] font-medium border-indigo-500/30 text-indigo-400">
                    {t("securedBadge")}
                  </Badge>
                </div>
                <p className="text-xs text-fg-tertiary">{t("escrowDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 3. Quick Action Shortcuts */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <span>{t("quickActions")}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href={`/${locale}/client/posts`} className="block group">
            <Card hoverable glass className="h-full border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/15 text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-primary transition-colors">
                      {t("manageMyPosts")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {t("manageMyPostsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/client/applications`} className="block group">
            <Card hoverable glass className="h-full border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Inbox className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-warning transition-colors">
                      {t("manageProposals")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-warning transition-transform" />
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {t("manageProposalsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/wallet`} className="block group">
            <Card hoverable glass className="h-full border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-success transition-colors">
                      {t("walletPayments")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-success transition-transform" />
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {t("walletPaymentsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 4. Recent Activity Preview */}
      <div>
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <span>{t("recentActivity")}</span>
        </h2>
        <Card glass className="border-border">
          <CardContent className="p-0 divide-y divide-border">
            <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-primary/15 text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    Thiết kế giao diện website thương mại điện tử
                  </p>
                  <div className="flex items-center gap-2 text-xs text-fg-tertiary mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>2 giờ trước</span>
                    <span>•</span>
                    <span>4 đề xuất mới</span>
                  </div>
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                {t("hiringBadge")}
              </Badge>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    Nạp tiền vào ví WorkGo qua QR Banking
                  </p>
                  <div className="flex items-center gap-2 text-xs text-fg-tertiary mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>Hôm qua</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400 font-medium">+5.000.000₫</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                Thành công
              </Badge>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-indigo-500/15 text-indigo-400 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    Ký kết hợp đồng: Phát triển ứng dụng đặt lịch cắt tóc
                  </p>
                  <div className="flex items-center gap-2 text-xs text-fg-tertiary mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>3 ngày trước</span>
                    <span>•</span>
                    <span>Escrow bảo đảm 4.200.000₫</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Đang thực hiện
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
