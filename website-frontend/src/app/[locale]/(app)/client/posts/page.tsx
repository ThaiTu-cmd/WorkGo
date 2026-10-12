"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PlusCircle,
  Edit,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatVND, formatDateOnly } from "@/lib/format";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function MyPostsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { toast } = useToast();

  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [postToClose, setPostToClose] = React.useState<string | null>(null);

  // Filter toolbar state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusTab, setStatusTab] = React.useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await postsApi.getMyPosts();
        setPosts(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleClosePost = async () => {
    if (!postToClose) return;
    try {
      await postsApi.close(postToClose);
      setPosts((prev) =>
        prev.map((p) => (p.postId === postToClose ? { ...p, status: "CLOSED" } : p))
      );
      toast({
        type: "success",
        title: "Đã đóng bài đăng tuyển dụng",
      });
    } finally {
      setPostToClose(null);
    }
  };

  // Metrics
  const totalPosts = posts.length;
  const openPosts = posts.filter((p) => p.status === "OPEN").length;
  const closedPosts = posts.filter((p) => p.status === "CLOSED").length;
  const totalProposals = posts.reduce((acc, p) => acc + (p.proposalsCount || 0), 0);

  // Filtered list
  const filteredPosts = posts.filter((post) => {
    if (statusTab !== "ALL" && post.status !== statusTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.postId.toLowerCase().includes(q) ||
        post.categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PageContainer>
      <SectionHeading
        title="Quản lý Bài đăng việc làm"
        subtitle="Theo dõi tiến độ, số lượng đề xuất và trạng thái tuyển dụng các bài đăng của bạn"
        level={1}
        action={
          <Link href={`/${locale}/client/posts/new`}>
            <Button variant="primary" size="md" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Đăng việc mới</span>
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="Bạn chưa có bài đăng việc làm nào"
          description="Đăng bài tuyển dụng ngay để nhận các đề xuất báo giá chất lượng từ các Provider trên WorkGo."
          action={
            <Link href={`/${locale}/client/posts/new`}>
              <Button variant="primary">Đăng bài việc làm đầu tiên</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card glass className="p-4 border-border/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-tertiary block font-medium">Tổng bài đăng</span>
                  <span className="text-xl font-bold font-mono text-fg">{totalPosts}</span>
                </div>
              </div>
            </Card>

            <Card glass className="p-4 border-border/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success-bg text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-tertiary block font-medium">Đang mở tuyển</span>
                  <span className="text-xl font-bold font-mono text-fg">{openPosts}</span>
                </div>
              </div>
            </Card>

            <Card glass className="p-4 border-border/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted text-fg-secondary flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-tertiary block font-medium">Đã đóng</span>
                  <span className="text-xl font-bold font-mono text-fg">{closedPosts}</span>
                </div>
              </div>
            </Card>

            <Card glass className="p-4 border-border/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-tertiary block font-medium">Tổng đề xuất</span>
                  <span className="text-xl font-bold font-mono text-fg">{totalProposals}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar: Search input + Status Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-surface rounded-card border border-border">
            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                placeholder="Tìm bài đăng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefixIcon={<Search className="h-4 w-4" />}
                className="h-9 text-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(
                [
                  { id: "ALL", label: `Tất cả (${totalPosts})` },
                  { id: "OPEN", label: `Đang mở (${openPosts})` },
                  { id: "CLOSED", label: `Đã đóng (${closedPosts})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none",
                    statusTab === tab.id
                      ? "bg-primary text-white shadow-xs"
                      : "text-fg-secondary hover:text-fg hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-sm text-fg-tertiary">
              Không có bài đăng nào khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card
                  key={post.postId}
                  glass
                  className="hover:border-primary/50 hover:shadow-xl transition-all"
                >
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={post.status} />
                        <Badge variant="outline">{post.categoryName}</Badge>
                        <Badge variant="secondary" className="text-[11px]">
                          {post.executionType}
                        </Badge>
                        <span className="text-xs text-fg-tertiary font-mono">
                          Mã: {post.postId}
                        </span>
                      </div>

                      <Link
                        href={`/${locale}/posts/${post.postId}`}
                        className="font-semibold text-base text-fg hover:text-primary transition-colors block leading-snug truncate"
                      >
                        {post.title}
                      </Link>

                      <div className="flex items-center gap-4 text-xs text-fg-secondary flex-wrap">
                        <span className="font-bold text-primary font-mono text-sm">
                          {formatVND(post.budgetMin, locale)} - {formatVND(post.budgetMax, locale)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-fg-tertiary" />
                          Hạn: {formatDateOnly(post.deadlineAt, locale)}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-fg">
                          {post.proposalsCount} đề xuất đã nộp
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                      <Link href={`/${locale}/posts/${post.postId}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Xem</span>
                        </Button>
                      </Link>

                      <Link href={`/${locale}/client/posts/${post.postId}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <Edit className="h-3.5 w-3.5" />
                          <span>Sửa</span>
                        </Button>
                      </Link>

                      {post.status === "OPEN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-danger hover:text-danger cursor-pointer"
                          onClick={() => setPostToClose(post.postId)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Đóng bài</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close Post Confirm Modal */}
      <Dialog open={Boolean(postToClose)} onOpenChange={(o) => !o && setPostToClose(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Xác nhận đóng bài đăng</DialogTitle>
            <DialogDescription>
              Khi đóng bài đăng, các đối tác sẽ không thể gửi thêm đề xuất mới. Bạn vẫn có thể xem các đề xuất đã nhận trước đó.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostToClose(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleClosePost}>
              Xác nhận đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
