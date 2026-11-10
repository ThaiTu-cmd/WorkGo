export type WalletEntryType = "HOLD" | "RELEASE" | "TOPUP" | "PAYOUT";

export type WalletEntry = {
  id: string;
  type: WalletEntryType;
  amount: number;
  label: string;
  at: string;
};

export type WalletState = {
  held: number;
  released: number;
  history: WalletEntry[];
};

export const mockWallet: WalletState = {
  held: 3500000,
  released: 12750000,
  history: [
    {
      id: "w-1",
      type: "HOLD",
      amount: 2500000,
      label: "Giữ hộ đơn hàng #ORD-1042",
      at: "2026-10-09",
    },
    {
      id: "w-2",
      type: "RELEASE",
      amount: 4750000,
      label: "Giải ngân đơn hàng #ORD-1038",
      at: "2026-10-06",
    },
    {
      id: "w-3",
      type: "TOPUP",
      amount: 5000000,
      label: "Nạp tiền qua VNPay (mock)",
      at: "2026-10-01",
    },
    {
      id: "w-4",
      type: "PAYOUT",
      amount: 8000000,
      label: "Rút về Vietcombank ****1234",
      at: "2026-09-28",
    },
  ],
};
