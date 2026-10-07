// BLOCKED BY BACKEND: Payment and Escrow endpoints are not yet implemented in backend (xlsx 80.0)

import type { PaymentFormData } from "../schemas/payment";
import { walletApi } from "./wallet";

export const paymentsApi = {
  async processDeposit(
    data: PaymentFormData,
    idempotencyKey?: string
  ): Promise<{ transactionId: string; status: "SUCCESS" | "FAILED" }> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Simulate validation
    if (data.amount < 1000) {
      throw new Error("Số tiền nạp tối thiểu là 1.000 ₫");
    }

    const key = idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`);

    // Update wallet
    const summary = await walletApi.getSummary();
    summary.availableBalance += data.amount;
    summary.transactions.unshift({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      type: "DEPOSIT",
      amount: data.amount,
      balanceAfter: summary.availableBalance,
      reference: `DEP-${key.slice(0, 8).toUpperCase()}`,
      description: `Nạp tiền qua phương thức ${data.method}`,
    });

    return {
      transactionId: `TX-${Date.now()}`,
      status: "SUCCESS",
    };
  },
};
