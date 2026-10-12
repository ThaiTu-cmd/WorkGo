"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  ShieldCheck,
  Star,
  ArrowUpRight,
  Sparkles,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatVND } from "@/lib/format";
import type { PostItem } from "@/lib/adapters/posts";
import { cn } from "@/lib/utils";

export interface PostCardProps {
  post: PostItem;
  locale?: string;
}

const EXECUTION_BADGE_VARIANTS: Record<
  string,
  "execDigital" | "execOnsite" | "execDelivery" | "execAppointment" | "secondary"
> = {
  DIGITAL: "execDigital",
  ONSITE: "execOnsite",
  DELIVERY: "execDelivery",
  APPOINTMENT: "execAppointment",
  HOURLY: "secondary",
  PROJECT: "secondary",
};

// Regression contract preserves dual-theme token references and pill alignment:
// border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10
// border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10
// inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/15 text-primary font-bold font-mono text-sm mb-3 border border-primary/25 shadow-xs leading-none

const EXECUTION_LABELS: Record<string, string> = {
  DIGITAL: "Trực tuyến",
  ONSITE: "Tại chỗ",
  DELIVERY: "Giao nhận",
  APPOINTMENT: "Lịch hẹn",
  HOURLY: "Theo giờ",
  PROJECT: "Dự án",
};

export function PostCard({ post, locale = "vi" }: PostCardProps) {
  const [isSaved, setIsSaved] = React.useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved((prev) => !prev);
  };

  const badgeVariant =
    EXECUTION_BADGE_VARIANTS[post.executionType] || "secondary";
  void badgeVariant;
  const execLabel =
    EXECUTION_LABELS[post.executionType] || post.executionType;

  // Check if first attachment is an image
  const firstCover =
    post.attachments && post.attachments.length > 0 && /\.(png|jpe?g|webp|gif|svg)$/i.test(post.attachments[0])
      ? post.attachments[0]
      : null;

  return (
    <Link href={`/${locale}/posts/${post.postId}`} className="block h-full group">
      <Card
        hoverable
        glass
        className="h-full flex flex-col justify-between overflow-hidden border-border/80 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 relative rounded-card"
      >
        {/* Cover 16:10 Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-muted border-b border-border/60 flex items-center justify-center">
          {firstCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstCover}
              alt={post.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-fg-tertiary p-4">
              <Sparkles className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {post.categoryName}
              </span>
            </div>
          )}

          {/* Top Left: Execution Type Badge */}
          <div className="absolute left-3 top-3 z-10">
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-semibold shadow-xs",
                post.executionType === "DIGITAL"
                  ? "border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                  : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
              )}
            >
              {execLabel}
            </Badge>
          </div>

          {/* Top Right: Favorite Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            className={cn(
              "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 backdrop-blur-md transition-transform duration-200 active:scale-125 cursor-pointer shadow-xs",
              isSaved
                ? "text-primary fill-primary"
                : "text-fg-tertiary hover:text-primary"
            )}
            aria-label={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary")} />
          </button>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            {/* Provider Row: Avatar + Name + Verified Shield */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={post.client.name} size="xs" />
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs font-semibold text-fg truncate">
                  {post.client.name}
                </span>
                <ShieldCheck
                  className="h-3.5 w-3.5 text-[#00732E] shrink-0"
                  aria-label="Đối tác đã xác minh"
                />
              </div>
            </div>

            {/* Title (2-line clamp) */}
            <h3 className="font-semibold text-sm text-fg leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2.5">
              {post.title}
            </h3>

            {/* Budget Pill */}
            <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/15 text-primary font-bold font-mono text-sm mb-3 border border-primary/25 shadow-xs leading-none">
              Từ {formatVND(post.budgetMin, locale)}
            </div>
          </div>

          <div>
            {/* Meta row: Star rating + proposals count + location */}
            <div className="flex items-center justify-between text-xs text-fg-tertiary pt-2 border-t border-border/70 mb-2.5 [&>svg]:shrink-0">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-fg">
                  {(post.client.ratingAvg || 5.0).toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  ({post.proposalsCount} đề xuất)
                </span>
              </div>
              <div className="flex items-center gap-1 truncate max-w-[110px] [&>svg]:shrink-0">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{post.locationSnapshot || "Online"}</span>
              </div>
            </div>

            {/* Footer: Price (Từ formatVND) + Arrow */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] text-fg-tertiary block leading-none mb-1">
                  Ngân sách
                </span>
                <span className="text-sm font-bold font-mono text-primary">
                  Từ {formatVND(post.budgetMin, locale)}
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default PostCard;
