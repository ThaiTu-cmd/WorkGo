"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PlusCircle, Edit, XCircle, Clock, ExternalLink } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MockChip } from "@/components/ui/mock-chip";
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

export default function MyPostsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { toast } = useToast();

  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [postToClose, setPostToClose] = React.useState<string | null>(null);

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

  return (
    <PageContainer>
      <SectionHeading
        title="Quản lý Bài đăng việc làm"
        subtitle="Theo dõi tiến độ, số lượng đề xuất và trạng thái tuyển dụng các bài đăng của bạn"
        level={1}
        action={
          <div className="flex items-center gap-3">
            <MockChip />
            <Link href={`/${locale}/client/posts/new`}>
              <Button variant="primary" size="md" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Đăng việc mới</span>
              </Button>
            </Link>
          </div>
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
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.postId} glass className="hover:border-primary/50 hover:shadow-xl transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={post.status === "OPEN" ? "success" : "secondary"}>
                      {post.status === "OPEN" ? "Đang mở" : "Đã đóng"}
                    </Badge>
                    <Badge variant="outline">{post.categoryName}</Badge>
                    <span className="text-xs text-fg-tertiary">
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
                      className="gap-1 text-xs text-danger hover:text-danger"
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
