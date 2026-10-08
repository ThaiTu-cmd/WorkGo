"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { addressSchema, type AddressFormData, type AddressFormInput } from "@/lib/schemas/address";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { AddressResponse } from "@/lib/adapters/identity";

export interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressToEdit?: AddressResponse | null;
  onSubmit: (data: AddressFormData) => Promise<void>;
}

export function AddressDialog({
  open,
  onOpenChange,
  addressToEdit,
  onSubmit,
}: AddressDialogProps) {
  const t = useTranslations("addresses");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput, unknown, AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      contactName: "",
      contactPhone: "",
      line1: "",
      ward: "",
      district: "",
      city: "",
      countryCode: "VN",
      note: "",
    },
  });

  React.useEffect(() => {
    if (addressToEdit) {
      reset({
        label: addressToEdit.label,
        contactName: addressToEdit.contactName,
        contactPhone: addressToEdit.contactPhone,
        line1: addressToEdit.line1,
        ward: addressToEdit.ward,
        district: addressToEdit.district,
        city: addressToEdit.city,
        countryCode: addressToEdit.countryCode || "VN",
        note: addressToEdit.note || "",
      });
    } else {
      reset({
        label: "",
        contactName: "",
        contactPhone: "",
        line1: "",
        ward: "",
        district: "",
        city: "",
        countryCode: "VN",
        note: "",
      });
    }
  }, [addressToEdit, reset, open]);

  const handleFormSubmit = async (data: AddressFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {addressToEdit ? t("editAddress") : t("addAddress")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5">
          <Field
            label={t("label")}
            required
            error={errors.label?.message ? tVal(errors.label.message as never) : undefined}
          >
            <Input
              {...register("label")}
              placeholder={t("labelPlaceholder")}
              disabled={isSubmitting}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={t("contactName")}
              required
              error={errors.contactName?.message ? tVal(errors.contactName.message as never) : undefined}
            >
              <Input
                {...register("contactName")}
                placeholder="Nguyễn Văn A"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label={t("contactPhone")}
              required
              error={errors.contactPhone?.message ? tVal(errors.contactPhone.message as never) : undefined}
            >
              <Input
                {...register("contactPhone")}
                type="tel"
                placeholder="0912345678"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field
            label={t("line1")}
            required
            error={errors.line1?.message ? tVal(errors.line1.message as never) : undefined}
          >
            <Input
              {...register("line1")}
              placeholder="123 Đường Nguyễn Trãi"
              disabled={isSubmitting}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label={t("city")}
              required
              error={errors.city?.message ? tVal(errors.city.message as never) : undefined}
            >
              <Input
                {...register("city")}
                placeholder="TP. Hồ Chí Minh"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label={t("district")}
              required
              error={errors.district?.message ? tVal(errors.district.message as never) : undefined}
            >
              <Input
                {...register("district")}
                placeholder="Quận 1"
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label={t("ward")}
              required
              error={errors.ward?.message ? tVal(errors.ward.message as never) : undefined}
            >
              <Input
                {...register("ward")}
                placeholder="Phường Bến Nghé"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field label={t("note")} error={errors.note?.message}>
            <Input
              {...register("note")}
              placeholder="Ghi chú thêm chỉ dẫn đường đi..."
              disabled={isSubmitting}
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
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
