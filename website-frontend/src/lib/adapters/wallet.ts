// BLOCKED BY BACKEND: Wallet and Payout endpoints are not yet implemented in backend (xlsx 81.0, 82.0)

import { MOCK_WALLET, MOCK_PAYOUT_ACCOUNTS, MOCK_BANKS, type MockPayoutAccount } from "../mocks/fixtures";
import type { PayoutFormData } from "../schemas/payout";

const localWallet = { ...MOCK_WALLET };
const localAccounts: MockPayoutAccount[] = [...MOCK_PAYOUT_ACCOUNTS];

export const walletApi = {
  async getSummary() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return localWallet;
  },

  async getBanks() {
    return MOCK_BANKS;
  },

  async getPayoutAccounts() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return localAccounts;
  },

  async addPayoutAccount(data: PayoutFormData) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const bank = MOCK_BANKS.find((b) => b.code === data.bankCode);

    if (data.isDefault) {
      localAccounts.forEach((acc) => {
        acc.isDefault = false;
      });
    }

    const newAcc = {
      id: `payout-${Date.now()}`,
      accountType: data.accountType,
      bankCode: data.bankCode,
      bankName: bank ? bank.name : "Ngân hàng liên kết",
      accountNumber: data.accountNumber,
      accountHolderName: data.accountHolderName.toUpperCase(),
      isDefault: Boolean(data.isDefault) || localAccounts.length === 0,
      status: "ACTIVE" as const,
    };

    localAccounts.unshift(newAcc);
    return newAcc;
  },

  async setDefaultPayoutAccount(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    localAccounts.forEach((acc) => {
      acc.isDefault = acc.id === id;
    });
  },
};
