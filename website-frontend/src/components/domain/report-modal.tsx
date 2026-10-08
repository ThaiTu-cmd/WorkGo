"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { reportSchema, type ReportFormData } from "@/lib/schemas/dispute";
import { trustApi } from "@/lib/adapters/trust";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export interface ReportModalProps {
  targetId: string;
  targetType: "USER" | "POST" | "SERVICE" | "REVIEW" | "MESSAGE";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReportModal({
  targetId,
  targetType,
  open,
  onOpenChange,
  onSuccess,
}: ReportModalProps) {
  const t = useTranslations("report");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      targetId,
      targetType,
      reason: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        targetId,
        targetType,
        reason: "",
        description: "",
      });
    }
  }, [open, targetId, targetType, reset]);

  const onSubmit = async (data: ReportFormData) => {
    try {
      await trustApi.submitReport(data);
      toast({
        type: "success",
        title: "Đã gửi báo cáo vi phạm",
        description: t("success"),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        type: "error",
        title: "Không thể gửi báo cáo vi phạm",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-danger">
              <ShieldAlert className="h-5 w-5" />
              <span>{t("modalTitle")}</span>
            </DialogTitle>
          </div>
          <DialogDescription>
            Báo cáo này sẽ được chuyển trực tiếp tới Ban Quản Trị WorkGo để thẩm tra độc lập.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label={t("reasonLabel")}
            required
            error={errors.reason?.message}
            description="Nêu rõ lý do (ví dụ: Gian lận tiền cọc, ngôn từ xúc phạm, vi phạm cam kết...)"
          >
            <Input
              {...register("reason")}
              placeholder={t("reasonPlaceholder")}
              disabled={isSubmitting}
            />
          </Field>

          <Field
            label={t("descLabel")}
            error={errors.description?.message}
            description="Mô tả cụ thể diễn biến và cung cấp các dẫn chứng liên quan"
          >
            <Textarea
              {...register("description")}
              placeholder={t("descPlaceholder")}
              disabled={isSubmitting}
              className="min-h-[120px]"
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={isSubmitting}
              loadingText={tCommon("loading")}
            >
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
