"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { proposalSchema, type ProposalFormData } from "@/lib/schemas/proposal";
import { proposalsApi, type ProposalItem } from "@/lib/adapters/proposals";
import type { PostItem } from "@/lib/adapters/posts";
import { loadDraft, saveDraft, clearDraft } from "@/lib/proposal-draft";
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
  userId?: string;
}

export function ProposalDrawer({
  post,
  open,
  onOpenChange,
  onSuccess,
  locale = "vi",
  userId,
}: ProposalDrawerProps) {
  const t = useTranslations("proposal");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const { toast } = useToast();

  const submittingRef = React.useRef(false);
  const [selectedFile, setSelectedFile] = React.useState<{ name: string; size: number } | null>(null);
  const [attachmentError, setAttachmentError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
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

  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleFormChange = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const values = getValues();
      if (
        values.price !== undefined ||
        values.message ||
        values.terms ||
        values.estimatedDays !== undefined
      ) {
        saveDraft(userId, post.postId, {
          price: values.price,
          estimatedDays: values.estimatedDays,
          message: values.message,
          terms: values.terms,
        });
      }
    }, 300);
  };

  // Prefill from draft on open
  React.useEffect(() => {
    if (open) {
      Promise.resolve().then(() => {
        const draft = loadDraft(userId, post.postId);
        if (draft) {
          reset({
            price: draft.price ?? post.budgetMin,
            estimatedDays: draft.estimatedDays ?? 7,
            message: draft.message ?? "",
            terms: draft.terms ?? "",
          });
        }
      });
    }
  }, [open, post.postId, post.budgetMin, reset, userId]);

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;

    void handleSubmit(async (data: ProposalFormData) => {
      submittingRef.current = true;
      try {
        const created = await proposalsApi.submit(post.postId, data);
        toast({
          type: "success",
          title: t("submitSuccess"),
          description: "Khách hàng sẽ nhận được thông báo về đề xuất của bạn.",
        });
        clearDraft(userId, post.postId);
        setSelectedFile(null);
        reset();
        onOpenChange(false);
        onSuccess?.(created);
      } catch {
        toast({
          type: "error",
          title: "Không thể gửi đề xuất",
          description: "Vui lòng kiểm tra lại thông tin và thử lại.",
        });
      } finally {
        submittingRef.current = false;
      }
    })(e);
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
          <form id="proposal-form" onSubmit={onFormSubmit} onChange={handleFormChange} className="space-y-4">
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

            {/* Attachment slot */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-fg">
                Tài liệu đính kèm (CV, hồ sơ năng lực - PDF, JPG, PNG tối đa 10MB)
              </label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40 text-sm">
                  <span className="truncate max-w-[200px] text-fg font-medium">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-error hover:underline ml-2"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="proposal-attachment"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      setAttachmentError(null);
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const allowed = ["application/pdf", "image/jpeg", "image/png"];
                      if (!allowed.includes(file.type)) {
                        setAttachmentError("Chỉ chấp nhận tệp định dạng PDF, JPG hoặc PNG.");
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        setAttachmentError("Kích thước tệp vượt quá giới hạn 10MB.");
                        return;
                      }
                      setSelectedFile({ name: file.name, size: file.size });
                    }}
                  />
                  <label
                    htmlFor="proposal-attachment"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-muted text-fg transition-colors"
                  >
                    <span>📎 Chọn tệp</span>
                  </label>
                </div>
              )}
              {attachmentError && (
                <p className="text-xs text-error">{attachmentError}</p>
              )}
            </div>

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
