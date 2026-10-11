import { apiFetch, type Envelope } from "../api-client";
import type { PayoutFormData } from "../schemas/payout";
import { backendRoutes } from "./backend-routes";

export interface WalletTransaction {
  id: string;
  date: string;
  type:
    | "DEPOSIT"
    | "PAYOUT"
    | "ORDER_PAYMENT"
    | "ORDER_RELEASE"
    | "REFUND";
  amount: number;
  balanceAfter: number;
  reference: string;
  description: string;
}

export interface WalletSummary {
  availableBalance: number;
  escrowBalance: number;
  earnedBalance: number;
  transactions: WalletTransaction[];
}

export interface PayoutAccount {
  id: string;
  accountType: "BANK" | "WALLET";
  bankCode?: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  status: "ACTIVE" | "PENDING";
}

export interface BankInfo {
  code: string;
  name: string;
}

function unwrap<T>(res: Envelope<T> | T): T {
  return (res && typeof res === "object" && "result" in (res as object) ? (res as Envelope<T>).result as T : res as T);
}

export const walletApi = {
  // Tài khoản mới → server trả { availableBalance:0, escrowBalance:0, earnedBalance:0, transactions:[] }.
  async getSummary(token?: string): Promise<WalletSummary> {
    const res = await apiFetch<Envelope<WalletSummary> | WalletSummary>(backendRoutes.wallet.summary, { token });
    const v = unwrap(res);
    return {
      availableBalance: v?.availableBalance ?? 0,
      escrowBalance: v?.escrowBalance ?? 0,
      earnedBalance: v?.earnedBalance ?? 0,
      transactions: v?.transactions ?? [],
    };
  },
  async getBanks(token?: string): Promise<BankInfo[]> {
    const res = await apiFetch<Envelope<BankInfo[]> | BankInfo[]>(backendRoutes.wallet.banks, { token });
    return unwrap(res) ?? [];
  },
  async getPayoutAccounts(token?: string): Promise<PayoutAccount[]> {
    const res = await apiFetch<Envelope<PayoutAccount[]> | PayoutAccount[]>(backendRoutes.wallet.payoutAccounts, { token });
    return unwrap(res) ?? [];
  },
  async addPayoutAccount(data: PayoutFormData, token?: string): Promise<PayoutAccount> {
    const res = await apiFetch<Envelope<PayoutAccount> | PayoutAccount>(backendRoutes.wallet.payoutAccounts, { method: "POST", body: data, token });
    return unwrap(res);
  },
  async setDefaultPayoutAccount(id: string, token?: string): Promise<void> {
    await apiFetch<void>(backendRoutes.wallet.payoutDefault(id), { method: "POST", token });
  },
};
