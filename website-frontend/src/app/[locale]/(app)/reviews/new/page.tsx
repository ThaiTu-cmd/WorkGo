"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { StarRating } from "@/components/ui/star-rating";
import { Spinner } from "@/components/ui/spinner";
import { reviewSchema, type ReviewFormData } from "@/lib/schemas/review";
import { trustApi } from "@/lib/adapters/trust";
import { ordersApi } from "@/lib/adapters/orders";
import { useToast } from "@/components/ui/toast";

function NewReviewContent() {
  const t = useTranslations("review");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { toast } = useToast();

  const orderId = searchParams.get("orderId") || "ord-8812";

  type OrderData = Awaited<ReturnType<typeof ordersApi.getOrder>>;
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [loading, setLoading] = React.useState(true);
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
    async function load() {
      setLoading(true);
      try {
        const data = await ordersApi.getOrder(orderId);
        setOrder(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await trustApi.submitReview(orderId, data);
      setSubmitted(true);
      toast({
        type: "success",
        title: t("submitSuccess"),
      });
    } catch {
      toast({
        type: "error",
        title: "Có lỗi xảy ra",
      });
    }
  };

  const isCompleted = order?.status === "COMPLETED";

  return (
    <PageContainer size="narrow">
      <SectionHeading
        title={t("modalTitle")}
        subtitle="Ý kiến đánh giá khách quan của bạn là động lực giúp các Provider hoàn thiện dịch vụ"
        level={1}
      />

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !isCompleted ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-warning mx-auto" />
            <h3 className="text-base font-semibold text-fg">{t("orderNotCompleted")}</h3>
            <p className="text-xs text-fg-secondary">
              Bạn chỉ có thể đánh giá đối tác sau khi đơn dịch vụ đã được xác nhận hoàn thành và giải ngân.
            </p>
            <Link href={`/${locale}/client`}>
              <Button variant="outline" className="mt-2">Quay lại Bảng điều khiển</Button>
            </Link>
          </CardContent>
        </Card>
      ) : submitted ? (
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h3 className="text-xl font-bold text-fg">{t("submitSuccess")}</h3>
            <p className="text-sm text-fg-secondary max-w-md mx-auto">
              Đánh giá của bạn đã được ghi nhận trên hồ sơ của đối tác <strong>{order.providerName}</strong>.
            </p>
            <div className="pt-4">
              <Link href={`/${locale}/client`}>
                <Button variant="primary">Về trang chủ Khách hàng</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Order Context Card */}
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-fg-tertiary">Mã đơn: {order.orderNumber}</span>
                <h4 className="font-semibold text-sm text-fg mt-0.5">{order.serviceTitle}</h4>
                <p className="text-xs text-fg-secondary mt-1">Đối tác: {order.providerName}</p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-primary-subtle text-primary">
                Đã hoàn thành
              </span>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-card bg-muted/40 border border-border space-y-3">
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
                      ? "Tuyệt vời (5/5 sao)"
                      : ratingValue === 4
                      ? "Hài lòng (4/5 sao)"
                      : ratingValue === 3
                      ? "Bình thường (3/5 sao)"
                      : ratingValue === 2
                      ? "Chưa hài lòng (2/5 sao)"
                      : "Rất không hài lòng (1/5 sao)"}
                  </span>
                </div>

                <Field
                  label={t("commentLabel")}
                  error={errors.comment?.message}
                  description="Chia sẻ thêm về trải nghiệm làm việc, tiến độ và mức độ hoàn thiện của đối tác"
                >
                  <Textarea
                    {...register("comment")}
                    placeholder={t("commentPlaceholder")}
                    disabled={isSubmitting}
                    className="min-h-[140px]"
                  />
                </Field>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link href={`/${locale}/client`}>
                    <Button type="button" variant="outline" disabled={isSubmitting}>
                      {tCommon("cancel")}
                    </Button>
                  </Link>
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
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

export default function NewReviewPage() {
  return (
    <React.Suspense fallback={null}>
      <NewReviewContent />
    </React.Suspense>
  );
}
