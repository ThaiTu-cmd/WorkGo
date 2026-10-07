"use client";

import * as React from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MockChip } from "@/components/ui/mock-chip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { proposalsApi, type ProposalItem } from "@/lib/adapters/proposals";
import { ApplicationTable } from "@/components/composed/application-table";
import { ApplicationCard } from "@/components/composed/application-card";
import { AcceptConfirmModal } from "@/components/domain/accept-confirm-modal";

function ClientApplicationsContent() {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { toast } = useToast();

  const statusParam = searchParams.get("status") || "ALL";

  const [proposals, setProposals] = React.useState<ProposalItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [acceptProposal, setAcceptProposal] = React.useState<ProposalItem | null>(null);
  const [rejectProposal, setRejectProposal] = React.useState<ProposalItem | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await proposalsApi.listAllClientApplications(statusParam);
        setProposals(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusParam]);

  const handleStatusTabChange = (val: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (val === "ALL") {
      next.delete("status");
    } else {
      next.set("status", val);
    }
    router.push(`/${locale}/client/applications?${next.toString()}`);
  };

  const onConfirmAccept = async (propId: string) => {
    await proposalsApi.accept(propId);
    setProposals((prev) =>
      prev.map((p) => (p.proposalId === propId ? { ...p, status: "ACCEPTED" } : p))
    );
    toast({
      type: "success",
      title: t("acceptSuccess"),
      description: "Hợp đồng công việc đã được khởi tạo.",
    });
  };

  const onConfirmReject = async () => {
    if (!rejectProposal) return;
    try {
      await proposalsApi.reject(rejectProposal.proposalId);
      setProposals((prev) =>
        prev.map((p) =>
          p.proposalId === rejectProposal.proposalId
            ? { ...p, status: "REJECTED" }
            : p
        )
      );
      toast({
        type: "success",
        title: t("rejectSuccess"),
      });
    } finally {
      setRejectProposal(null);
    }
  };

  return (
    <PageContainer>
      <SectionHeading
        title={t("title")}
        subtitle="Xem xét các đề xuất thực hiện, báo giá và kế hoạch triển khai từ các đối tác ứng tuyển"
        level={1}
        action={<MockChip />}
      />

      <div className="mb-6">
        <Tabs value={statusParam} onValueChange={handleStatusTabChange}>
          <TabsList>
            <TabsTrigger value="ALL">Tất cả ({proposals.length})</TabsTrigger>
            <TabsTrigger value="SUBMITTED">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="ACCEPTED">Đã chấp thuận</TabsTrigger>
            <TabsTrigger value="REJECTED">Đã từ chối</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          title="Chưa có đề xuất nào"
          description="Các bài đăng của bạn hiện chưa nhận được đề xuất báo giá nào phù hợp với bộ lọc trạng thái này."
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block">
            <ApplicationTable
              proposals={proposals}
              onAccept={(p) => setAcceptProposal(p)}
              onReject={(p) => setRejectProposal(p)}
              locale={locale}
            />
          </div>

          {/* Mobile Card Stack View (< 768px) */}
          <div className="md:hidden space-y-3">
            {proposals.map((prop) => (
              <ApplicationCard
                key={prop.proposalId}
                proposal={prop}
                onAccept={(p) => setAcceptProposal(p)}
                onReject={(p) => setRejectProposal(p)}
                locale={locale}
              />
            ))}
          </div>
        </>
      )}

      {/* 2-Step Accept Confirmation Modal */}
      <AcceptConfirmModal
        proposal={acceptProposal}
        open={Boolean(acceptProposal)}
        onOpenChange={(open) => !open && setAcceptProposal(null)}
        onConfirm={onConfirmAccept}
        locale={locale}
      />

      {/* 1-Step Reject Confirmation Modal */}
      <Dialog
        open={Boolean(rejectProposal)}
        onOpenChange={(o) => !o && setRejectProposal(null)}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectProposal(null)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirmReject}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default function ClientApplicationsPage() {
  return (
    <React.Suspense fallback={null}>
      <ClientApplicationsContent />
    </React.Suspense>
  );
}
