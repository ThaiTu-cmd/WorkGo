import Link from "next/link";
import { Star, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";
import type { ProposalItem } from "@/lib/adapters/proposals";

export interface ApplicationCardProps {
  proposal: ProposalItem;
  onAccept: (prop: ProposalItem) => void;
  onReject: (prop: ProposalItem) => void;
  locale?: string;
}

export function ApplicationCard({
  proposal,
  onAccept,
  onReject,
  locale = "vi",
}: ApplicationCardProps) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Top: Provider & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={proposal.providerName} size="sm" />
            <div className="min-w-0">
              <Link
                href={`/${locale}/providers/${proposal.providerId}`}
                className="font-semibold text-sm text-fg hover:text-primary truncate block"
              >
                {proposal.providerName}
              </Link>
              <div className="flex items-center gap-1 text-xs text-fg-secondary">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{proposal.ratingAvg.toFixed(1)}</span>
                <span className="text-fg-tertiary">({proposal.ratingCount})</span>
              </div>
            </div>
          </div>

          <Badge
            variant={
              proposal.status === "ACCEPTED"
                ? "success"
                : proposal.status === "REJECTED"
                ? "danger"
                : "primary"
            }
            className="text-[10px] h-5"
          >
            {proposal.status === "ACCEPTED"
              ? "Đã chấp thuận"
              : proposal.status === "REJECTED"
              ? "Đã từ chối"
              : "Chờ duyệt"}
          </Badge>
        </div>

        {/* Message */}
        <p className="text-xs text-fg-secondary leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-control">
          {proposal.message}
        </p>

        {/* Price & Duration */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
          <span className="text-fg-secondary">Thời gian: <strong>{proposal.estimatedDays} ngày</strong></span>
          <span className="text-base font-bold text-primary">
            {formatVND(proposal.price, locale)}
          </span>
        </div>

        {/* Actions */}
        {proposal.status === "SUBMITTED" && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-danger hover:text-danger"
              onClick={() => onReject(proposal)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              <span>Từ chối</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs"
              onClick={() => onAccept(proposal)}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              <span>Chấp thuận</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
