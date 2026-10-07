import type { PaymentFormData } from "../schemas/payment";
import { walletApi } from "./wallet";

export const paymentsApi = {
  async processDeposit(
    data: PaymentFormData,
    idempotencyKey?: string
  ): Promise<{ transactionId: string; status: "SUCCESS" | "FAILED" }> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Boundary check
    if (data.amount < 1000) {
      throw new Error("Số tiền nạp tối thiểu là 1.000 ₫");
    }

    const key =
      idempotencyKey ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-${Date.now()}`);

    const reference = `DEP-${key.slice(0, 8).toUpperCase()}`;
    const txId = `TX-${Date.now()}`;

    // Update live wallet
    walletApi.creditDeposit(data.amount, data.method, reference);

    return {
      transactionId: txId,
      status: "SUCCESS",
    };
  },
};
