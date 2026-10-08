"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FileText,
  Download,
  Info,
  Flag,
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVND, formatDate } from "@/lib/format";
import { trustApi } from "@/lib/adapters/trust";
import { ReportModal } from "@/components/domain/report-modal";

type DisputeData = Awaited<ReturnType<typeof trustApi.getDispute>>;

export default function DisputeDetailPage() {
  const t = useTranslations("dispute");
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const disputeId = params?.id as string;

  const [dispute, setDispute] = React.useState<DisputeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reportOpen, setReportOpen] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await trustApi.getDispute(disputeId);
        setDispute(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [disputeId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!dispute) {
    return (
      <PageContainer>
        <EmptyState title="Không tìm thấy hồ sơ khiếu nại" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-2">
        <Breadcrumb
          locale={locale}
          items={[
            { label: "Bảng điều khiển", href: "/client" },
            { label: "Trung tâm Khiếu nại" },
            { label: dispute.disputeId },
          ]}
        />
      </div>

      <SectionHeading
        title={t("title")}
        subtitle={`Mã hồ sơ tranh chấp: #${dispute.disputeId} • Liên quan đơn hàng ${dispute.orderNumber}`}
        level={1}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            className="gap-1.5 text-danger border-danger/30 hover:bg-danger-bg"
          >
            <Flag className="h-4 w-4" />
            <span>Báo cáo bổ sung</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order context & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Context Card */}
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-fg-tertiary">
                {t("orderInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-fg">{dispute.serviceTitle}</span>
                <span className="font-bold text-primary text-base">
                  {formatVND(dispute.amount, locale)}
                </span>
              </div>
              <p className="text-xs text-fg-secondary">
                Mã đơn hàng: <strong className="font-mono">{dispute.orderNumber}</strong>
              </p>
            </CardContent>
          </Card>

          {/* Dispute Reason & Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Nội dung khiếu nại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-fg-secondary">Lý do chính:</span>
                <p className="text-sm font-medium text-danger mt-0.5">{dispute.reason}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-fg-secondary">Mô tả chi tiết:</span>
                <p className="text-sm text-fg leading-relaxed mt-0.5 whitespace-pre-line bg-muted/30 p-4 rounded-control border border-border">
                  {dispute.description}
                </p>
              </div>

              {/* Evidence files */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-fg-secondary block mb-2">
                    {t("evidenceTitle")} ({dispute.evidence.length})
                  </span>
                  <div className="space-y-2">
                    {dispute.evidence.map((file: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-control border border-border bg-surface text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{file}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                          <Download className="h-3.5 w-3.5" />
                          <span>Tải</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dispute Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t("timelineTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {dispute.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-primary bg-surface flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-fg">{step.title}</span>
                        <span className="text-xs text-fg-tertiary">
                          {formatDate(step.timestamp, locale)}
                        </span>
                      </div>
                      <p className="text-xs text-fg-secondary leading-relaxed">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & Resolution (Read-only) */}
        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Trạng thái xử lý</CardTitle>
                <Badge variant="warning">Đang xem xét</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-control bg-primary-subtle/50 border border-primary/20 text-xs text-fg-secondary flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t("resolutionNotice")}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-2">
                  {t("resolutionTitle")}
                </h4>
                <div className="p-4 rounded-control bg-muted/40 border border-border text-xs text-fg leading-relaxed">
                  {dispute.resolution}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ReportModal
        targetId={dispute.orderId}
        targetType="SERVICE"
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </PageContainer>
  );
}
