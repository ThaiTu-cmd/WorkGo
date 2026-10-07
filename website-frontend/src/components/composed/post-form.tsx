"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Upload, X, FileText } from "lucide-react";
import { postSchema, EXECUTION_TYPES, type PostFormData } from "@/lib/schemas/post";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
  isEdit = false,
}: PostFormProps) {
  const t = useTranslations("jobForm");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? t("editTitle") : t("createTitle")}</CardTitle>
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
              className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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

          {/* Execution Type */}
          <Field label={t("executionType")} required>
            <select
              {...register("executionType")}
              className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                    ? "Theo lịch hẹn (Appointment)"
                    : type === "HOURLY"
                    ? "Theo giờ (Hourly)"
                    : "Trọn gói dự án (Project)"}
                </option>
              ))}
            </select>
          </Field>

          {/* Location Snapshot (Only visible if ONSITE or DELIVERY) */}
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
                      className="text-fg-tertiary hover:text-danger p-1"
                      aria-label="Xóa tệp đính kèm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-0 bg-surface/95 backdrop-blur-xs border-t border-border p-4 rounded-card shadow-md flex items-center justify-end gap-3">
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
    </form>
  );
}
