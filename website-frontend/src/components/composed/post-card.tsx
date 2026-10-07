"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, MessageSquare, Clock, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatVND, formatDateOnly } from "@/lib/format";
import type { PostItem } from "@/lib/adapters/posts";
import { cn } from "@/lib/utils";

export interface PostCardProps {
  post: PostItem;
  locale?: string;
}

const EXECUTION_LABELS: Record<string, string> = {
  DIGITAL: "Trực tuyến",
  ONSITE: "Tại chỗ",
  DELIVERY: "Giao nhận",
  APPOINTMENT: "Theo lịch hẹn",
  HOURLY: "Theo giờ",
  PROJECT: "Trọn gói dự án",
};

export function PostCard({ post, locale = "vi" }: PostCardProps) {
  const [isSaved, setIsSaved] = React.useState(false);
  const isBudgetRange = post.budgetMin !== post.budgetMax;

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved((prev) => !prev);
  };

  const isDigital = post.executionType === "DIGITAL";

  return (
    <Link href={`/${locale}/posts/${post.postId}`} className="block h-full group">
      <Card
        hoverable
        glass
        className="h-full flex flex-col justify-between border-border/80 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 relative"
      >
        <CardContent className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Top row: Category, Execution, and Bookmark button */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Badge variant="secondary" className="text-xs">
                  {post.categoryName}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isDigital
                      ? "border-cyan-500/30 text-cyan-400 bg-cyan-950/30"
                      : "border-amber-500/30 text-amber-400 bg-amber-950/30"
                  )}
                >
                  {EXECUTION_LABELS[post.executionType] || post.executionType}
                </Badge>
              </div>

              <button
                type="button"
                onClick={handleBookmark}
                className={cn(
                  "p-1.5 rounded-full transition-transform duration-200 active:scale-125 cursor-pointer shrink-0",
                  isSaved
                    ? "text-primary bg-primary/20"
                    : "text-fg-tertiary hover:text-primary hover:bg-muted/80"
                )}
                aria-label={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                title={isSaved ? "Đã lưu việc làm" : "Lưu việc làm"}
              >
                <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary")} />
              </button>
            </div>

            {/* 1. Title */}
            <h3 className="font-semibold text-base text-fg leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2.5">
              {post.title}
            </h3>

            {/* 2. Budget (Formatted prominently with mono font) */}
            <div className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary font-bold font-mono text-sm mb-3 border border-primary/25 shadow-xs">
              {isBudgetRange
                ? `${formatVND(post.budgetMin, locale)} - ${formatVND(post.budgetMax, locale)}`
                : formatVND(post.budgetMin, locale)}
            </div>

            {/* 3. Description snippet */}
            <p className="text-xs text-fg-secondary line-clamp-2 mb-4 leading-relaxed">
              {post.description}
            </p>
          </div>

          <div>
            {/* 4. Location and Deadline captions */}
            <div className="space-y-1.5 text-xs text-fg-tertiary pt-3 border-t border-border mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{post.locationSnapshot || "Trực tuyến"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Hạn nộp: {formatDateOnly(post.deadlineAt, locale)}</span>
              </div>
            </div>

            {/* 5. Client row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={post.client.name} size="xs" />
                <span className="text-xs font-medium text-fg truncate">
                  {post.client.name}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-fg-tertiary shrink-0">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{post.proposalsCount} đề xuất</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
