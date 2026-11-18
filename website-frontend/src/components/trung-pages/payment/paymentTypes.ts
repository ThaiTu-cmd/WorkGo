export type WalletEntryType =
  | "HOLD"
  | "RELEASE"
  | "TOPUP"
  | "REFUND"
  | "FEE_DEBT"
  | "PAYOUT"
  | "ADJUSTMENT";

export type WalletEntry = {
  id: string;
  type: WalletEntryType;
  amount: number;
  balanceAfter?: number;
  label: string;
  referenceId?: string;
  at: string;
  status?: "COMPLETED" | "PENDING" | "UNKNOWN" | "FAILED";
};

export type WalletState = {
  available: number;
  held: number;
  debt: number;
  currency?: string;
  history: WalletEntry[];
};

export type SavedPayout = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
};

export type TopUpStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "UNKNOWN";

export type TopUpRecord = {
  topUpId: string;
  amount: number;
  gateway: "VNPAY" | "MOMO" | "MOCK" | string;
  status: TopUpStatus;
  paymentUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
  expiresAt?: string;
  createdAt?: string;
};
