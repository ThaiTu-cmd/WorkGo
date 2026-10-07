"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MapPin,
  Clock,
  FileText,
  Download,
  Star,
  CheckCircle2,
  Send,
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVND, formatDateOnly } from "@/lib/format";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { proposalsApi } from "@/lib/adapters/proposals";
import { ProposalDrawer } from "@/components/domain/proposal-drawer";

export default function PostDetailPage() {
  const t = useTranslations("posts");
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const postId = params?.id as string;

  const [post, setPost] = React.useState<PostItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasApplied, setHasApplied] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postData, applied] = await Promise.all([
          postsApi.get(postId),
          proposalsApi.hasApplied(postId),
        ]);
        setPost(postData);
        setHasApplied(applied);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [postId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!post) {
    return (
      <PageContainer>
        <EmptyState
          title="Không tìm thấy bài đăng việc làm"
          description="Bài đăng này có thể đã bị xóa hoặc đã hết hạn tuyển dụng."
          action={
            <Link href={`/${locale}/posts`}>
              <Button variant="primary">Khám phá Việc làm</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-2">
        <Breadcrumb
          locale={locale}
          items={[
            { label: "Việc làm", href: "/posts" },
            { label: post.categoryName, href: `/posts?category=${post.categoryId}` },
            { label: post.title },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Post Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary">{post.categoryName}</Badge>
                <Badge variant="outline">{post.executionType}</Badge>
                <Badge variant={post.status === "OPEN" ? "success" : "secondary"}>
                  {post.status === "OPEN" ? "Đang mở nhận hồ sơ" : "Đã đóng"}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-fg leading-snug">
                {post.title}
              </h1>

              <div className="text-2xl font-bold text-primary">
                {post.budgetMin !== post.budgetMax
                  ? `${formatVND(post.budgetMin, locale)} - ${formatVND(post.budgetMax, locale)}`
                  : formatVND(post.budgetMin, locale)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border text-sm text-fg-secondary">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>Hạn nộp hồ sơ: <strong>{formatDateOnly(post.deadlineAt, locale)}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">Địa điểm: <strong>{post.locationSnapshot || "Trực tuyến"}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Mô tả công việc & Yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-fg leading-relaxed whitespace-pre-line space-y-4">
                {post.description}
              </div>
            </CardContent>
          </Card>

          {/* Attachments Card */}
          {post.attachments && post.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tài liệu đính kèm ({post.attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {post.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-control border border-border bg-slate-50 text-sm"
                    >
                      <div className="flex items-center gap-2 text-fg font-medium truncate">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{file}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs text-primary">
                        <Download className="h-3.5 w-3.5" />
                        <span>Tải về</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Profile Row */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Thông tin Người đăng bài</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar name={post.client.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-fg">{post.client.name}</span>
                    <Badge variant="success" className="text-[10px] h-4">
                      Đã xác thực
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-fg-secondary mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{post.client.ratingAvg.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>Đã đăng {post.client.completedOrders} việc</span>
                    <span>•</span>
                    <span>Phản hồi: {post.client.responseTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Action & Proposal Panel (360px) */}
        <div>
          <div className="sticky top-24 space-y-4">
            <Card className="border-primary/30 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Gửi đề xuất nhận việc</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-fg-secondary leading-relaxed">
                  Báo giá cạnh tranh và kế hoạch làm việc chi tiết để tăng cơ hội được khách hàng lựa chọn.
                </p>

                {hasApplied ? (
                  <div className="p-3.5 rounded-control bg-green-50 border border-green-200 text-success text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Bạn đã nộp đề xuất cho công việc này</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full gap-2 text-base shadow-sm"
                    onClick={() => setDrawerOpen(true)}
                  >
                    <Send className="h-4 w-4" />
                    <span>{t("applyNow")}</span>
                  </Button>
                )}

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-fg-tertiary">
                  <span>Tổng đề xuất đã nộp:</span>
                  <span className="font-semibold text-fg">{post.proposalsCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Proposal Drawer */}
      <ProposalDrawer
        post={post}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={() => setHasApplied(true)}
        locale={locale}
      />
    </PageContainer>
  );
}
