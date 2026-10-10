"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { CreditCard, QrCode, Smartphone, Wallet, ShieldCheck, AlertCircle } from "lucide-react";
import { paymentSchema, type PaymentFormData } from "@/lib/schemas/payment";
import { paymentsApi } from "@/lib/adapters/payments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { formatVND } from "@/lib/format";

export interface PaymentPanelProps {
  onSuccess?: (transactionId: string) => void;
  onError?: (error: Error) => void;
  defaultAmount?: number;
  fixedAmount?: boolean;
  locale?: string;
  isEmbed?: boolean; // For handing over to Thien's checkout flow
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}`;
}

const PAYMENT_METHODS = [
  {
    id: "BANK",
    label: "Chuyển khoản Ngân hàng (QR Code)",
    desc: "Tự động xác nhận giao dịch qua VietQR trong 30 giây",
    icon: QrCode,
  },
  {
    id: "EWALLET",
    label: "Ví điện tử MoMo / ZaloPay",
    desc: "Thanh toán an toàn qua cổng liên kết",
    icon: Smartphone,
  },
  {
    id: "CARD",
    label: "Thẻ Visa / MasterCard / JCB",
    desc: "Hỗ trợ thẻ thanh toán quốc tế và nội địa",
    icon: CreditCard,
  },
  {
    id: "BALANCE",
    label: "Số dư ví khả dụng",
    desc: "Thanh toán trực tiếp từ tiền trong ví WorkGo",
    icon: Wallet,
  },
] as const;

export function PaymentPanel({
  onSuccess,
  onError,
  defaultAmount = 500000,
  fixedAmount = false,
  locale = "vi",
}: PaymentPanelProps) {
  const t = useTranslations("payment");
  const tVal = useTranslations("validation");

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "BANK",
      amount: defaultAmount,
    },
  });

  const selectedMethod = useWatch({ control, name: "method" });
  const amountValue = useWatch({ control, name: "amount" }) || 0;

  const onSubmit = async (data: PaymentFormData) => {
    setErrorMessage(null);
    try {
      const idempotencyKey = generateIdempotencyKey();

      const res = await paymentsApi.processDeposit(data, idempotencyKey);
      if (res.status === "SUCCESS") {
        onSuccess?.(res.transactionId);
      } else {
        throw new Error(t("failed"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("failed");
      setErrorMessage(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-base text-fg">{t("selectMethod")}</h3>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-control bg-danger-bg border border-danger/30 text-danger text-sm flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
            <p className="text-xs text-danger/90 mt-0.5">Vui lòng thử lại hoặc chọn phương thức khác.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Payment Methods Radio List */}
        <div className="grid grid-cols-1 gap-2.5">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <label
                key={method.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-card border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary-subtle/30 ring-1 ring-primary"
                    : "border-border bg-surface hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  value={method.id}
                  {...register("method")}
                  className="mt-1 h-4 w-4 text-primary"
                  disabled={isSubmitting}
                />
                <div className="p-2 rounded-control bg-surface border border-border text-fg shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-fg leading-tight">{method.label}</p>
                  <p className="text-xs text-fg-secondary mt-0.5">{method.desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Amount Input */}
        {!fixedAmount ? (
          <Field
            label={t("amount")}
            required
            error={errors.amount?.message ? tVal(errors.amount.message as never) : undefined}
          >
            <Input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              placeholder={t("amountPlaceholder")}
              disabled={isSubmitting}
              suffix="₫"
            />
          </Field>
        ) : (
          <div className="p-3 rounded-card bg-muted flex items-center justify-between text-sm">
            <span className="text-fg-secondary">Số tiền thanh toán:</span>
            <span className="font-bold text-primary text-base">
              {formatVND(defaultAmount, locale)}
            </span>
          </div>
        )}

        {/* Security Assurance */}
        <div className="p-3 rounded-card bg-muted/40 border border-border flex items-center gap-2.5 text-xs text-fg-secondary">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          <span>Thanh toán mã hóa 256-bit chuẩn PCI-DSS. Không lưu trữ thông tin thẻ.</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-base font-semibold shadow-sm"
          isLoading={isSubmitting}
          loadingText={t("processing")}
        >
          {t("payNow")} ({formatVND(amountValue, locale)})
        </Button>
      </form>
    </div>
  );
}
