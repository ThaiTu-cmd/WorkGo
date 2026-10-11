import { apiFetch, type Envelope } from "../api-client";
import type { PaymentFormData } from "../schemas/payment";
import { backendRoutes } from "./backend-routes";

export const paymentsApi = {
  async processDeposit(
    data: PaymentFormData,
    idempotencyKey?: string
  ): Promise<{ transactionId: string; status: "SUCCESS" | "FAILED" }> {
    if (data.amount < 1000) throw new Error("Số tiền nạp tối thiểu là 1.000 ₫");
    const res = await apiFetch<
      Envelope<{ transactionId: string; status: "SUCCESS" | "FAILED" }> | { transactionId: string; status: "SUCCESS" | "FAILED" }
    >(backendRoutes.payments.deposit, {
      method: "POST",
      body: { amount: data.amount, method: data.method },
      idempotency: true,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    });
    const v = (res && typeof res === "object" && "result" in (res as object)
      ? (res as Envelope<{ transactionId: string; status: "SUCCESS" | "FAILED" }>).result
      : res) as { transactionId: string; status: "SUCCESS" | "FAILED" };
    return v;
  },
};
