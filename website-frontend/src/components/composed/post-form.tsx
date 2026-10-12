"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Upload,
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import { postSchema, EXECUTION_TYPES, type PostFormData } from "@/lib/schemas/post";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ServiceFormStepper } from "./service-form-stepper";
import { formatVND, formatDateOnly } from "@/lib/format";
import type { CategoryItem } from "@/lib/adapters/catalog";
import type { PostItem } from "@/lib/adapters/posts";

export interface PostFormProps {
  categories: CategoryItem[];
  initialData?: PostItem | null;
  onSubmit: (data: PostFormData) => Promise<void>;
  locale?: string;
  isEdit?: boolean;
}

export function PostForm({
  categories,
  initialData,
  onSubmit,
  locale = "vi",
  isEdit = false,
}: PostFormProps) {
  const t = useTranslations("jobForm");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");

  const [currentStep, setCurrentStep] = React.useState(1);

  const [attachments, setAttachments] = React.useState<string[]>(
    initialData?.attachments || []
  );

  const defaultDeadline = React.useMemo(() => {
    if (initialData?.deadlineAt) {
      return new Date(initialData.deadlineAt).toISOString().slice(0, 16);
    }
    // eslint-disable-next-line react-hooks/purity
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, [initialData]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || categories[0]?.categoryId || "cat-1",
      budgetMin: initialData?.budgetMin || 1000000,
      budgetMax: initialData?.budgetMax || 3000000,
      executionType: initialData?.executionType || "DIGITAL",
      locationSnapshot: initialData?.locationSnapshot || "",
      deadlineAt: defaultDeadline,
      attachments: initialData?.attachments || [],
    },
  });

  const titleValue = useWatch({ control, name: "title" }) || "";
  const descValue = useWatch({ control, name: "description" }) || "";
  const executionType = useWatch({ control, name: "executionType" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const budgetMin = useWatch({ control, name: "budgetMin" }) || 0;
  const budgetMax = useWatch({ control, name: "budgetMax" }) || 0;
  const deadlineAt = useWatch({ control, name: "deadlineAt" });
  const locationSnapshot = useWatch({ control, name: "locationSnapshot" }) || "";

  const selectedCategoryName =
    categories.find((c) => c.categoryId === categoryId)?.categoryName || "Danh mục";

  const requiresLocation =
    executionType === "ONSITE" || executionType === "DELIVERY";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Tệp vượt quá dung lượng tối đa 10MB");
      return;
    }

    const updated = [...attachments, file.name];
    setAttachments(updated);
    setValue("attachments", updated);
  };

  const removeAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    setValue("attachments", updated);
  };

  const getValidationMsg = (msg?: string) => {
    if (!msg) return undefined;
    if (msg.startsWith("validation.")) {
      return tVal(msg.replace("validation.", "") as never);
    }
    return msg;
  };

  const handleNextFromStep1 = async () => {
    const valid = await trigger(["title", "categoryId", "description", "executionType"]);
    if (valid) {
      setCurrentStep(2);
    }
  };

  const handleNextFromStep2 = async () => {
    const fieldsToValidate: Array<keyof PostFormData> = [
      "budgetMin",
      "budgetMax",
      "deadlineAt",
    ];
    if (requiresLocation) {
      fieldsToValidate.push("locationSnapshot");
    }
    const valid = await trigger(fieldsToValidate);
    if (valid) {
      setCurrentStep(3);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* 3-Step Wizard Stepper */}
      <ServiceFormStepper
        currentStep={currentStep}
        onStepClick={(s) => setCurrentStep(s)}
      />

      {/* STEP 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? t("editTitle") : t("createTitle")} — Bước 1: Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <Field
              label={t("title")}
              required
              error={getValidationMsg(errors.title?.message)}
              description={`Độ dài: ${titleValue.length}/120 ký tự`}
            >
              <Input
                {...register("title")}
                placeholder={t("titlePlaceholder")}
                disabled={isSubmitting}
              />
            </Field>

            {/* Category */}
            <Field
              label={t("category")}
              required
              error={getValidationMsg(errors.categoryId?.message)}
            >
              <select
                {...register("categoryId")}
                className="flex h-11 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                disabled={isSubmitting}
              >
                <option value="">{t("selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </Field>

            {/* Execution Type */}
            <Field label={t("executionType")} required>
              <select
                {...register("executionType")}
                className="flex h-11 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                disabled={isSubmitting}
              >
                {EXECUTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === "DIGITAL"
                      ? "Trực tuyến (Digital)"
                      : type === "ONSITE"
                      ? "Tại chỗ (Onsite)"
                      : type === "DELIVERY"
                      ? "Giao nhận (Delivery)"
                      : type === "APPOINTMENT"
                      ? "Theo lịch hẹn (Appointment) — Sắp ra mắt"
                      : type === "HOURLY"
                      ? "Theo giờ (Hourly)"
                      : "Trọn gói dự án (Project)"}
                  </option>
                ))}
              </select>
            </Field>

            {/* Description */}
            <Field
              label={t("description")}
              required
              error={getValidationMsg(errors.description?.message)}
              description={`Độ dài: ${descValue.length}/5000 ký tự (tối thiểu 20 ký tự)`}
            >
              <Textarea
                {...register("description")}
                placeholder={t("descriptionPlaceholder")}
                disabled={isSubmitting}
                className="min-h-[160px]"
              />
            </Field>

            <div className="flex justify-end pt-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleNextFromStep1}
                className="gap-2"
              >
                <span>Tiếp theo: Bảng giá</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Pricing, Budget & Deadline */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? t("editTitle") : t("createTitle")} — Bước 2: Ngân sách & Tiến độ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Budget Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("budgetMin")}
                required
                error={getValidationMsg(errors.budgetMin?.message)}
              >
                <Input
                  {...register("budgetMin", { valueAsNumber: true })}
                  type="number"
                  disabled={isSubmitting}
                  suffix="₫"
                />
              </Field>

              <Field
                label={t("budgetMax")}
                required
                error={getValidationMsg(errors.budgetMax?.message)}
              >
                <Input
                  {...register("budgetMax", { valueAsNumber: true })}
                  type="number"
                  disabled={isSubmitting}
                  suffix="₫"
                />
              </Field>
            </div>

            {/* Location Snapshot */}
            {requiresLocation && (
              <Field
                label={t("locationSnapshot")}
                required
                error={getValidationMsg(errors.locationSnapshot?.message)}
                description="Bắt buộc nhập địa chỉ cụ thể khi triển khai dịch vụ tại chỗ hoặc giao nhận"
              >
                <Input
                  {...register("locationSnapshot")}
                  placeholder={t("locationPlaceholder")}
                  disabled={isSubmitting}
                />
              </Field>
            )}

            {/* Deadline */}
            <Field
              label={t("deadlineAt")}
              required
              error={getValidationMsg(errors.deadlineAt?.message)}
              description="Thời hạn kết thúc nhận đề xuất (sau thời điểm hiện tại ít nhất 24 giờ)"
            >
              <Input
                {...register("deadlineAt")}
                type="datetime-local"
                disabled={isSubmitting}
              />
            </Field>

            <div className="flex justify-between pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleNextFromStep2}
                className="gap-2"
              >
                <span>Tiếp theo: Tệp & Xác nhận</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Media, Attachments & Confirm */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isEdit ? t("editTitle") : t("createTitle")} — Bước 3: Tệp đính kèm & Xác nhận</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Attachments Dropzone */}
              <div>
                <label className="text-sm font-medium text-fg mb-1.5 block">
                  {t("attachments")}
                </label>
                <div className="border-2 border-dashed border-border-strong rounded-card p-6 text-center bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                  />
                  <Upload className="h-8 w-8 text-fg-tertiary mx-auto mb-2" />
                  <p className="text-sm font-medium text-fg">Nhấn hoặc kéo tệp vào đây</p>
                  <p className="text-xs text-fg-secondary mt-1">Định dạng PDF, PNG, JPG tối đa 10MB</p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border text-xs"
                      >
                        <div className="flex items-center gap-2 text-fg truncate">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{file}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-fg-tertiary hover:text-danger p-1 cursor-pointer"
                          aria-label="Xóa tệp đính kèm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-fg mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Xem trước bài đăng
                </h4>
                <div className="p-4 rounded-card border border-border bg-surface space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{selectedCategoryName}</Badge>
                    <Badge variant="outline">{executionType}</Badge>
                  </div>
                  <h4 className="font-semibold text-base text-fg">{titleValue || "Tiêu đề công việc"}</h4>
                  <p className="text-xs text-fg-secondary line-clamp-2">{descValue || "Chưa có mô tả"}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/70 text-xs text-fg-secondary">
                    <span className="font-bold text-primary font-mono text-sm">
                      {formatVND(budgetMin, locale)} - {formatVND(budgetMax, locale)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-fg-tertiary" />
                      Hạn: {deadlineAt ? formatDateOnly(deadlineAt, locale) : "Chưa chọn"}
                    </span>
                  </div>
                  {requiresLocation && locationSnapshot && (
                    <div className="text-xs text-fg-tertiary flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{locationSnapshot}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sticky Action Footer */}
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur-xs border-t border-border p-4 rounded-card shadow-md flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              loadingText={tCommon("loading")}
            >
              {isEdit ? tCommon("save") : t("publish")}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

export default PostForm;
