"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVND, formatDateOnly } from "@/lib/format";
import { proposalSchema, type ProposalFormData } from "@/lib/schemas/proposal";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { proposalsApi } from "@/lib/adapters/proposals";
import { useToast } from "@/components/ui/toast";

export default function PostApplyFallbackPage() {
  const t = useTranslations("proposal");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const { toast } = useToast();

  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "vi";
  const postId = params?.id as string;

  const [post, setPost] = React.useState<PostItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasApplied, setHasApplied] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  });

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postData, applied] = await Promise.all([
          postsApi.get(postId),
          proposalsApi.hasApplied(postId),
        ]);
        setPost(postData);
        setHasApplied(applied);
        if (postData) {
          reset({
            price: postData.budgetMin,
            estimatedDays: 7,
            message: "",
            terms: "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [postId, reset]);

  const onSubmit = async (data: ProposalFormData) => {
    try {
      await proposalsApi.submit(postId, data);
      setHasApplied(true);
      toast({
        type: "success",
        title: t("submitSuccess"),
      });
      router.push(`/${locale}/posts/${postId}`);
    } catch {
      toast({
        type: "error",
        title: "Không thể nộp đề xuất",
      });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!post) {
    return (
      <PageContainer>
        <EmptyState
          title="Không tìm thấy bài đăng"
          action={
            <Link href={`/${locale}/posts`}>
              <Button variant="primary">Quay lại danh sách</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb
        locale={locale}
        items={[
          { label: "Việc làm", href: "/posts" },
          { label: post.title, href: `/posts/${post.postId}` },
          { label: "Gửi đề xuất" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">{t("drawerTitle")}</h1>
        <p className="text-sm text-fg-secondary">Điền thông tin báo giá và cam kết triển khai</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 bg-primary-subtle/30 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t("jobSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <h3 className="font-semibold text-fg leading-snug">{post.title}</h3>

              <div className="text-lg font-bold text-primary">
                {formatVND(post.budgetMin, locale)} - {formatVND(post.budgetMax, locale)}
              </div>

              <div className="space-y-2 text-xs text-fg-secondary pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Hạn nộp: {formatDateOnly(post.deadlineAt, locale)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{post.locationSnapshot || "Trực tuyến"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Proposal Form */}
        <div className="lg:col-span-2">
          {hasApplied ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
                <h3 className="text-lg font-semibold text-fg">{t("alreadySubmitted")}</h3>
                <Link href={`/${locale}/posts/${post.postId}`}>
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Quay lại bài đăng</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label={t("price")}
                      required
                      error={errors.price?.message ? tVal(errors.price.message as never) : undefined}
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
                  >
                    <Textarea
                      {...register("message")}
                      placeholder={t("messagePlaceholder")}
                      disabled={isSubmitting}
                      className="min-h-[140px]"
                    />
                  </Field>

                  <Field label={t("terms")} error={errors.terms?.message}>
                    <Textarea
                      {...register("terms")}
                      placeholder="Điều khoản bổ sung (tùy chọn)..."
                      disabled={isSubmitting}
                      className="min-h-[80px]"
                    />
                  </Field>

                  <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                    <Link href={`/${locale}/posts/${post.postId}`}>
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
          )}
        </div>
      </div>
    </PageContainer>
  );
}
