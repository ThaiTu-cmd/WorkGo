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
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVND, formatDateOnly } from "@/lib/format";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { walletApi, type WalletSummary } from "@/lib/adapters/wallet";
import { proposalsApi, type ProposalItem } from "@/lib/adapters/proposals";

function getGreeting(t: (k: string) => string) {
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) return t("greetingMorning");
  if (hours >= 12 && hours < 18) return t("greetingAfternoon");
  return t("greetingEvening");
}

export default function ClientDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const t = useTranslations("dashboard");
  const greeting = getGreeting(t);

  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);
  const [proposals, setProposals] = React.useState<ProposalItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const [myPostsRes, walletRes, proposalsRes] = await Promise.allSettled([
          postsApi.getMyPosts(),
          walletApi.getSummary(),
          proposalsApi.listAllClientApplications(),
        ]);
        if (!active) return;
        if (myPostsRes.status === "fulfilled") setPosts(myPostsRes.value);
        if (walletRes.status === "fulfilled") setWallet(walletRes.value);
        if (proposalsRes.status === "fulfilled") setProposals(proposalsRes.value);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const openPostsCount = posts.filter((p) => p.status === "OPEN").length;
  const newProposalsCount = proposals.filter((p) => p.status === "SUBMITTED").length;
  const availableBalance = wallet?.availableBalance ?? 0;
  const escrowBalance = wallet?.escrowBalance ?? 0;

  // Lấy danh sách hoạt động gần đây từ bài đăng và giao dịch
  const recentPosts = posts.slice(0, 2);
  const recentTx = wallet?.transactions?.slice(0, 2) ?? [];
  const hasActivity = recentPosts.length > 0 || recentTx.length > 0;

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

      {/* 2. Animated Stats Grid (4 Cards) - DYNAMIC DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Bài đăng đang mở */}
        <Link href={`/${locale}/client/posts`}>
          <Card hoverable glass className="h-full group border-border">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-fg-secondary">
                  {t("openPosts")}
                </span>
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-primary/15 text-primary group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl md:text-3xl font-bold text-fg">
                      {openPostsCount}
                    </span>
                    <Badge variant={openPostsCount > 0 ? "success" : "secondary"} className="text-[11px] font-medium">
                      {openPostsCount > 0 ? t("hiringBadge") : "Trống"}
                    </Badge>
                  </div>
                )}
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
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Inbox className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl md:text-3xl font-bold text-fg">
                      {newProposalsCount}
                    </span>
                    <Badge variant={newProposalsCount > 0 ? "warning" : "secondary"} className="text-[11px] font-medium">
                      {newProposalsCount > 0 ? t("reviewBadge") : "Trống"}
                    </Badge>
                  </div>
                )}
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
                      {formatVND(availableBalance, locale)}
                    </span>
                  </div>
                )}
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
                <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-bold text-fg font-mono">
                      {formatVND(escrowBalance, locale)}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-medium border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                      {t("securedBadge")}
                    </Badge>
                  </div>
                )}
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
                <div className="flex items-center justify-center shrink-0 p-3 rounded-xl bg-primary/15 text-primary group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6 shrink-0" />
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
                <div className="flex items-center justify-center shrink-0 p-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Inbox className="h-6 w-6 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-fg group-hover:text-primary transition-colors">
                      {t("manageProposals")}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:translate-x-1 group-hover:text-primary transition-transform" />
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
                <div className="flex items-center justify-center shrink-0 p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
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
                    {t("walletPaymentsDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 4. Recent Activity Preview - DYNAMIC & ZERO STATE */}
      <div>
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <span>{t("recentActivity")}</span>
        </h2>
        <Card glass className="border-border">
          <CardContent className="p-0 divide-y divide-border">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !hasActivity ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-muted/40 text-fg-tertiary mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-fg">Chưa có hoạt động nào phát sinh</p>
                <p className="text-xs text-fg-tertiary mt-1">Các bài tuyển dụng và giao dịch ví của bạn sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <>
                {recentPosts.map((post) => (
                  <div key={post.postId} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center shrink-0 p-2 rounded-full bg-primary/15 text-primary">
                        <FileText className="h-4 w-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-fg-tertiary mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateOnly(post.createdAt, locale)}</span>
                          <span>•</span>
                          <span>{post.proposalsCount} đề xuất</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={post.status === "OPEN" ? "success" : "secondary"} className="text-xs">
                      {post.status === "OPEN" ? t("hiringBadge") : post.status}
                    </Badge>
                  </div>
                ))}
                {recentTx.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center shrink-0 p-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-fg-tertiary mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateOnly(tx.date, locale)}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            +{formatVND(tx.amount, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      {tx.type}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
