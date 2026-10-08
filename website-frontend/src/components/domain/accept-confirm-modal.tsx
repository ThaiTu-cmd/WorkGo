"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatVND } from "@/lib/format";
import type { ProposalItem } from "@/lib/adapters/proposals";

export interface AcceptConfirmModalProps {
  proposal: ProposalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (proposalId: string) => Promise<void>;
  locale?: string;
}

export function AcceptConfirmModal({
  proposal,
  open,
  onOpenChange,
  onConfirm,
  locale = "vi",
}: AcceptConfirmModalProps) {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setAcknowledged(false);
      setLoading(false);
    }
  }

  if (!proposal) return null;

  const handleConfirm = async () => {
    if (!acknowledged || loading) return;
    setLoading(true);
    try {
      await onConfirm(proposal.proposalId);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span>{t("acceptTitle")}</span>
          </DialogTitle>
          <DialogDescription>{t("acceptStep1")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Cost Summary Box */}
          <div className="p-4 rounded-card bg-primary-subtle/40 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-secondary">Đối tác thực hiện:</span>
              <span className="font-semibold text-fg">{proposal.providerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-secondary">Thời gian cam kết:</span>
              <span className="font-semibold text-fg">{proposal.estimatedDays} ngày</span>
            </div>
            <div className="flex items-center justify-between text-base pt-2 border-t border-primary/10">
              <span className="font-medium text-fg">{t("acceptCostSummary")}</span>
              <span className="text-lg font-bold text-primary">
                {formatVND(proposal.price, locale)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-control bg-warning-bg border border-warning/30 text-xs text-warning flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{t("platformFeeNotice")}</span>
          </div>

          {/* 2-Step Checkbox Guard (Anti-misclick) */}
          <div className="pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-card bg-muted/40 border border-border">
              <Checkbox
                id="acceptTermsAck"
                checked={acknowledged}
                onCheckedChange={(c) => setAcknowledged(Boolean(c))}
                disabled={loading}
                className="mt-0.5"
              />
              <Label
                htmlFor="acceptTermsAck"
                className="text-xs text-fg leading-relaxed cursor-pointer font-normal select-none"
              >
                {t("acceptAcknowledge")}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={!acknowledged || loading}
            isLoading={loading}
            loadingText={tCommon("loading")}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{t("acceptConfirmBtn")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
