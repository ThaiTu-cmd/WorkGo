import type { PayoutFormData } from "../schemas/payout";

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

export const SUPPORTED_BANKS: BankInfo[] = [
  { code: "VCB", name: "Vietcombank (Ngoại thương)" },
  { code: "TCB", name: "Techcombank (Kỹ thương)" },
  { code: "MB", name: "MBBank (Quân đội)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "BIDV", name: "BIDV (Đầu tư và Phát triển)" },
  { code: "CTG", name: "VietinBank (Công thương)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
];

const liveWallet: WalletSummary = {
  availableBalance: 12500000,
  escrowBalance: 7500000,
  earnedBalance: 48000000,
  transactions: [
    {
      id: "tx-1",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: "DEPOSIT",
      amount: 5000000,
      balanceAfter: 12500000,
      reference: "DEP-928172",
      description: "Nạp tiền qua Chuyển khoản QR ngân hàng",
    },
    {
      id: "tx-2",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      type: "ORDER_PAYMENT",
      amount: -7500000,
      balanceAfter: 7500000,
      reference: "ORD-55102",
      description: "Thanh toán tạm giữ Escrow cho đơn hàng ORD-55102",
    },
    {
      id: "tx-3",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      type: "ORDER_RELEASE",
      amount: 15000000,
      balanceAfter: 15000000,
      reference: "ORD-44910",
      description: "Giải ngân tiền dịch vụ hoàn thành đơn hàng ORD-44910",
    },
  ],
};

const liveAccounts: PayoutAccount[] = [
  {
    id: "payout-1",
    accountType: "BANK",
    bankCode: "VCB",
    bankName: "Ngân hàng Ngoại thương Việt Nam (Vietcombank)",
    accountNumber: "0071001234567",
    accountHolderName: "TRAN HUU TRUNG",
    isDefault: true,
    status: "ACTIVE",
  },
];

export const walletApi = {
  async getSummary(): Promise<WalletSummary> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return liveWallet;
  },

  async getBanks(): Promise<BankInfo[]> {
    return SUPPORTED_BANKS;
  },

  async getPayoutAccounts(): Promise<PayoutAccount[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return liveAccounts;
  },

  async addPayoutAccount(data: PayoutFormData): Promise<PayoutAccount> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const bank = SUPPORTED_BANKS.find((b) => b.code === data.bankCode);

    if (data.isDefault) {
      liveAccounts.forEach((acc) => {
        acc.isDefault = false;
      });
    }

    const newAcc: PayoutAccount = {
      id: `payout-${Date.now()}`,
      accountType: data.accountType,
      bankCode: data.bankCode,
      bankName: bank ? bank.name : "Ngân hàng liên kết",
      accountNumber: data.accountNumber,
      accountHolderName: data.accountHolderName.toUpperCase(),
      isDefault: Boolean(data.isDefault) || liveAccounts.length === 0,
      status: "ACTIVE",
    };

    liveAccounts.unshift(newAcc);
    return newAcc;
  },

  async setDefaultPayoutAccount(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    liveAccounts.forEach((acc) => {
      acc.isDefault = acc.id === id;
    });
  },

  creditDeposit(amount: number, method: string, reference: string) {
    liveWallet.availableBalance += amount;
    liveWallet.transactions.unshift({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      type: "DEPOSIT",
      amount,
      balanceAfter: liveWallet.availableBalance,
      reference,
      description: `Nạp tiền qua phương thức ${method}`,
    });
  },
};
