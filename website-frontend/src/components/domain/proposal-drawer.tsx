"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { proposalSchema, type ProposalFormData } from "@/lib/schemas/proposal";
import { proposalsApi, type ProposalItem } from "@/lib/adapters/proposals";
import type { PostItem } from "@/lib/adapters/posts";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { formatVND, formatDateOnly } from "@/lib/format";
import { useToast } from "@/components/ui/toast";

export interface ProposalDrawerProps {
  post: PostItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (created: ProposalItem) => void;
  locale?: string;
}

export function ProposalDrawer({
  post,
  open,
  onOpenChange,
  onSuccess,
  locale = "vi",
}: ProposalDrawerProps) {
  const t = useTranslations("proposal");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      price: post.budgetMin,
      estimatedDays: 7,
      message: "",
      terms: "",
    },
  });

  const onSubmit = async (data: ProposalFormData) => {
    try {
      const created = await proposalsApi.submit(post.postId, data);
      toast({
        type: "success",
        title: t("submitSuccess"),
        description: "Khách hàng sẽ nhận được thông báo về đề xuất của bạn.",
      });
      reset();
      onOpenChange(false);
      onSuccess?.(created);
    } catch {
      toast({
        type: "error",
        title: "Không thể gửi đề xuất",
        description: "Vui lòng kiểm tra lại thông tin và thử lại.",
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" width="wide">
        <DrawerHeader>
          <DrawerTitle>{t("drawerTitle")}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          {/* Sticky Job Summary at top */}
          <div className="p-4 rounded-card bg-primary-subtle border border-primary/20 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {t("jobSummary")}
            </span>
            <h4 className="font-semibold text-sm text-fg leading-snug line-clamp-2">
              {post.title}
            </h4>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/10">
              <span className="font-bold text-primary">
                Ngân sách: {formatVND(post.budgetMin, locale)} - {formatVND(post.budgetMax, locale)}
              </span>
              <span className="text-fg-secondary">
                Hạn nộp: {formatDateOnly(post.deadlineAt, locale)}
              </span>
            </div>
          </div>

          {/* Form */}
          <form id="proposal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("price")}
                required
                error={errors.price?.message ? tVal(errors.price.message as never) : undefined}
                description="Đã bao gồm toàn bộ chi phí thực hiện"
              >
                <Input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  placeholder={t("pricePlaceholder")}
                  disabled={isSubmitting}
                  suffix="₫"
                />
              </Field>

              <Field
                label={t("estimatedDays")}
                required
                error={errors.estimatedDays?.message ? tVal(errors.estimatedDays.message as never) : undefined}
              >
                <Input
                  {...register("estimatedDays", { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  placeholder={t("estimatedDaysPlaceholder")}
                  disabled={isSubmitting}
                  suffix="ngày"
                />
              </Field>
            </div>

            <Field
              label={t("message")}
              required
              error={errors.message?.message ? tVal(errors.message.message as never) : undefined}
              description="Nêu rõ phương pháp thực hiện, quy trình và lý do bạn phù hợp nhất"
            >
              <Textarea
                {...register("message")}
                placeholder={t("messagePlaceholder")}
                disabled={isSubmitting}
                className="min-h-[140px]"
              />
            </Field>

            <Field
              label={t("terms")}
              error={errors.terms?.message}
              description="Chính sách bảo hành, số lần chỉnh sửa miễn phí hoặc yêu cầu đầu vào"
            >
              <Textarea
                {...register("terms")}
                placeholder="Ví dụ: Đã bao gồm 2 lần chỉnh sửa sau nghiệm thu..."
                disabled={isSubmitting}
                className="min-h-[80px]"
              />
            </Field>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
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
                variant="primary"
                isLoading={isSubmitting}
                loadingText={tCommon("loading")}
              >
                {t("submit")}
              </Button>
            </div>
          </form>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
