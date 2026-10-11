"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Wallet,
  Settings,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVND, formatDateOnly } from "@/lib/format";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { walletApi, type WalletSummary } from "@/lib/adapters/wallet";

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

export default function ProviderDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const t = useTranslations("dashboard");
  const greeting = getGreeting(t);

  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [totalOpportunities, setTotalOpportunities] = React.useState<number>(0);
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function loadProviderDashboard() {
      try {
        const [postsRes, walletRes] = await Promise.allSettled([
          postsApi.list({ limit: 4 }),
          walletApi.getSummary(),
        ]);
        if (!active) return;
        if (postsRes.status === "fulfilled") {
          setPosts(postsRes.value.data);
          setTotalOpportunities(postsRes.value.meta.total);
        }
        if (walletRes.status === "fulfilled") {
          setWallet(walletRes.value);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProviderDashboard();
    return () => {
      active = false;
    };
  }, []);

  const earnedBalance = wallet?.earnedBalance ?? 0;

  return (
    <PageContainer>
      {/* 1. Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-surface via-surface/95 to-surface border border-border p-6 md:p-8 shadow-md mb-8 animate-fade-up backdrop-blur-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-16 w-48 h-48 bg-info/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
              <span className="leading-none">{greeting}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fg">
              {t("providerTitle")}
            </h1>
            <p className="text-sm text-fg-secondary leading-relaxed">
              {t("providerSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href={`/${locale}/posts`}>
              <Button
                variant="primary"
                size="lg"
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Briefcase className="h-5 w-5" />
                <span>{t("findJobs")}</span>
              </Button>
            </Link>
            <Link href={`/${locale}/settings?tab=provider`}>
              <Button
                variant="outline"
                size="lg"
                className="bg-surface/60 hover:bg-muted text-fg border-border active:scale-[0.98] font-medium gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>{t("updateProfile")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Animated Stats Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Cơ hội việc làm mới */}
        <Link href={`/${locale}/posts`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("newOpportunities")}
                </span>
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-primary/15 text-primary group-hover:scale-110 transition-transform">
                  <Briefcase className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl md:text-3xl font-bold text-fg">
                      {totalOpportunities}
                    </span>
                    <Badge variant={totalOpportunities > 0 ? "secondary" : "outline"} className="text-[11px] font-medium">
                      {totalOpportunities > 0 ? "Khả dụng" : "Trống"}
                    </Badge>
                  </div>
                )}
                <p className="text-xs text-fg-tertiary">{t("newOpportunitiesDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Thu nhập tích lũy */}
        <Link href={`/${locale}/wallet`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("totalEarnings")}
                </span>
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Wallet className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-bold text-fg font-mono">
                      {formatVND(earnedBalance, locale)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-fg-tertiary">{t("earningsDesc")}</p>
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    Xem ví →
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Điểm uy tín đối tác */}
        <Link href={`/${locale}/settings?tab=provider`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("reputationScore")}
                </span>
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Star className="h-5 w-5 shrink-0 fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-fg">5.0</span>
                  <Badge variant="warning" className="text-[11px] font-medium">
                    Top Pro
                  </Badge>
                </div>
                <p className="text-xs text-fg-tertiary">{t("ratingDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Hồ sơ đối tác */}
        <Link href={`/${locale}/settings?tab=provider`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("verifiedProfile")}
                </span>
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-fg">100%</span>
                  <Badge variant="success" className="text-[11px] font-medium">
                    {t("verifiedBadge")}
                  </Badge>
                </div>
                <p className="text-xs text-fg-tertiary">{t("verifiedDesc")}</p>
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
          <Link href={`/${locale}/posts`}>
            <Card hoverable className="h-full group border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex items-center justify-center shrink-0 p-3 rounded-card bg-primary-subtle text-primary group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-primary transition-colors">
                      {t("exploreJobs")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {t("exploreJobsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/wallet`}>
            <Card hoverable className="h-full group border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex items-center justify-center shrink-0 p-3 rounded-card bg-success-bg text-success group-hover:scale-105 transition-transform">
                  <Wallet className="h-6 w-6 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-success transition-colors">
                      {t("walletPayments")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-success transition-transform" />
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {t("providerWalletDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/settings?tab=provider`}>
            <Card hoverable className="h-full group border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex items-center justify-center shrink-0 p-3 rounded-card bg-primary-subtle text-primary group-hover:scale-105 transition-transform">
                  <Settings className="h-6 w-6 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-purple-600 transition-colors">
                      {t("providerProfileShortcut")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-purple-600 transition-transform" />
                  </div>
                  <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                    {t("providerProfileShortcutDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 4. Matching Opportunities Preview - DYNAMIC DATA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <span>Cơ hội việc làm phù hợp</span>
          </h2>
          <Link
            href={`/${locale}/posts`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả {totalOpportunities} việc làm</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Card className="border-border">
          <CardContent className="p-0 divide-y divide-border">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-muted/40 text-fg-tertiary mb-3">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-fg">Chưa có việc làm nào phù hợp hiện tại</p>
                <p className="text-xs text-fg-tertiary mt-1">Các bài đăng việc làm mới từ khách hàng sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.postId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {post.categoryName || "Dịch vụ"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {post.executionType}
                      </Badge>
                      <span className="text-xs text-fg-tertiary flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDateOnly(post.createdAt, locale)}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-fg truncate">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-fg-secondary">
                      <span className="font-bold text-primary font-mono">
                        {post.budgetMax > post.budgetMin
                          ? `${formatVND(post.budgetMin, locale)} - ${formatVND(post.budgetMax, locale)}`
                          : formatVND(post.budgetMin, locale)}
                      </span>
                      {post.locationSnapshot && (
                        <span className="flex items-center gap-1 text-fg-tertiary truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {post.locationSnapshot}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/${locale}/posts/${post.postId}`}>
                    <Button variant="primary" size="sm" className="shrink-0 w-full sm:w-auto">
                      Gửi đề xuất
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
