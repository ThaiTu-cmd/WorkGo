"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { reviewSchema, type ReviewFormData } from "@/lib/schemas/review";
import { trustApi } from "@/lib/adapters/trust";
import { ordersApi } from "@/lib/adapters/orders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/components/ui/toast";

export interface ReviewModalProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReviewModal({
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: ReviewModalProps) {
  const t = useTranslations("review");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  type OrderData = Awaited<ReturnType<typeof ordersApi.getOrder>>;
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [loadingOrder, setLoadingOrder] = React.useState(true);
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const ratingValue = useWatch({ control, name: "rating" }) ?? 5;

  React.useEffect(() => {
    if (open && orderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitted(false);
      setLoadingOrder(true);
      ordersApi
        .getOrder(orderId)
        .then(setOrder)
        .finally(() => setLoadingOrder(false));
    }
  }, [open, orderId]);

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await trustApi.submitReview(orderId, data);
      setSubmitted(true);
      toast({
        type: "success",
        title: t("submitSuccess"),
      });
      onSuccess?.();
    } catch {
      toast({
        type: "error",
        title: "Không thể gửi đánh giá",
      });
    }
  };

  const isCompleted = order?.status === "COMPLETED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t("modalTitle")}</DialogTitle>
          </div>
          {order && (
            <DialogDescription>
              Đơn hàng: <strong>{order.orderNumber}</strong> • {order.serviceTitle}
            </DialogDescription>
          )}
        </DialogHeader>

        {loadingOrder ? (
          <div className="py-8 text-center text-sm text-fg-secondary">
            Đang tải thông tin đơn hàng...
          </div>
        ) : !isCompleted ? (
          <div className="p-4 rounded-card bg-warning-bg border border-warning/30 text-warning text-sm flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{t("orderNotCompleted")}</p>
          </div>
        ) : submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h4 className="font-bold text-base text-fg">{t("submitSuccess")}</h4>
            <p className="text-xs text-fg-secondary">
              Đánh giá của bạn giúp cộng đồng WorkGo nâng cao chất lượng dịch vụ.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="mt-2"
            >
              Hoàn tất
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-card bg-muted/40 border border-border space-y-2">
              <label className="text-sm font-semibold text-fg">
                {t("ratingLabel")}
              </label>
              <StarRating
                value={ratingValue}
                onChange={(val) => setValue("rating", val)}
                size="lg"
              />
              <span className="text-xs text-fg-secondary font-medium">
                {ratingValue === 5
                  ? "Tuyệt vời (5/5)"
                  : ratingValue === 4
                  ? "Hài lòng (4/5)"
                  : ratingValue === 3
                  ? "Bình thường (3/5)"
                  : ratingValue === 2
                  ? "Chưa hài lòng (2/5)"
                  : "Rất không hài lòng (1/5)"}
              </span>
            </div>

            <Field label={t("commentLabel")} error={errors.comment?.message}>
              <Textarea
                {...register("comment")}
                placeholder={t("commentPlaceholder")}
                disabled={isSubmitting}
                className="min-h-[100px]"
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
                variant="primary"
                isLoading={isSubmitting}
                loadingText={tCommon("loading")}
              >
                {t("submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
