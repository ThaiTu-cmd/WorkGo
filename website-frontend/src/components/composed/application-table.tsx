import Link from "next/link";
import { Star, CheckCircle, XCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";
import type { ProposalItem } from "@/lib/adapters/proposals";

export interface ApplicationTableProps {
  proposals: ProposalItem[];
  onAccept: (prop: ProposalItem) => void;
  onReject: (prop: ProposalItem) => void;
  locale?: string;
}

export function ApplicationTable({
  proposals,
  onAccept,
  onReject,
  locale = "vi",
}: ApplicationTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border text-[12px] font-semibold text-fg-tertiary uppercase tracking-wider">
            <th className="py-3 px-4">Đối tác ứng tuyển</th>
            <th className="py-3 px-4">Đề xuất & Kế hoạch</th>
            <th className="py-3 px-4 whitespace-nowrap">Giá đề xuất</th>
            <th className="py-3 px-4 whitespace-nowrap">Thời gian</th>
            <th className="py-3 px-4">Trạng thái</th>
            <th className="py-3 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {proposals.map((prop) => (
            <tr key={prop.proposalId} className="hover:bg-muted/50 transition-colors">
              <td className="py-4 px-4 align-top">
                <div className="flex items-center gap-3">
                  <Avatar name={prop.providerName} size="sm" />
                  <div>
                    <Link
                      href={`/${locale}/providers/${prop.providerId}`}
                      className="font-semibold text-fg hover:text-primary transition-colors block leading-tight"
                    >
                      {prop.providerName}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-fg-secondary mt-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{prop.ratingAvg.toFixed(1)}</span>
                      <span className="text-fg-tertiary">({prop.ratingCount})</span>
                    </div>
                  </div>
                </div>
              </td>

              <td className="py-4 px-4 align-top max-w-sm">
                <p className="text-xs text-fg leading-relaxed line-clamp-3">
                  {prop.message}
                </p>
                {prop.terms && (
                  <p className="text-[11px] text-fg-tertiary mt-1 italic line-clamp-1">
                    Điều khoản: {prop.terms}
                  </p>
                )}
              </td>

              <td className="py-4 px-4 align-top whitespace-nowrap">
                <span className="font-bold text-primary text-base">
                  {formatVND(prop.price, locale)}
                </span>
              </td>

              <td className="py-4 px-4 align-top whitespace-nowrap text-fg-secondary">
                {prop.estimatedDays} ngày
              </td>

              <td className="py-4 px-4 align-top whitespace-nowrap">
                <Badge
                  variant={
                    prop.status === "ACCEPTED"
                      ? "success"
                      : prop.status === "REJECTED"
                      ? "danger"
                      : "primary"
                  }
                >
                  {prop.status === "ACCEPTED"
                    ? "Đã chấp nhận"
                    : prop.status === "REJECTED"
                    ? "Đã từ chối"
                    : "Đang chờ duyệt"}
                </Badge>
              </td>

              <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                {prop.status === "SUBMITTED" ? (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1"
                      onClick={() => onAccept(prop)}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Chấp thuận</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1 text-danger hover:text-danger hover:border-danger/40 hover:bg-danger-bg"
                      onClick={() => onReject(prop)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Từ chối</span>
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-fg-tertiary">Đã xử lý</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
