import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { paymentApi } from '@/api/paymentApi';
import type { WalletDto, WalletEntryDto } from '@/api/types';

import { WalletScreen } from '../WalletScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));

jest.mock('@/api/paymentApi', () => ({
  paymentApi: {
    getWallet: jest.fn(),
    getWalletLedger: jest.fn(),
  },
}));

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <WalletScreen />
    </QueryClientProvider>
  );
}

const mockWallet: WalletDto = {
  availableBalance: 12500000,
  heldBalance: 3500000,
  debtBalance: 0,
  currency: 'VND',
};

const mockLedger: WalletEntryDto[] = [
  {
    id: 'w-1',
    type: 'TOPUP',
    amount: 5000000,
    description: 'Nạp tiền qua VNPay',
    createdAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'w-2',
    type: 'HOLD',
    amount: 2500000,
    description: 'Giữ hộ đơn hàng #ORD-1042',
    referenceId: 'ORD-1042',
    createdAt: '2026-11-12T14:30:00Z',
  },
  {
    id: 'w-3',
    type: 'RELEASE',
    amount: 4750000,
    description: 'Giải ngân đơn hàng #ORD-1038',
    referenceId: 'ORD-1038',
    createdAt: '2026-11-14T09:15:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({ result: mockWallet });
  (paymentApi.getWalletLedger as jest.Mock).mockResolvedValue({ result: mockLedger });
});

test('renders empty state when there are no ledger entries', async () => {
  (paymentApi.getWalletLedger as jest.Mock).mockResolvedValue({ result: [] });

  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText('Chưa có giao dịch')).toBeTruthy();
  });
  expect(screen.getByText('Chưa có bút toán nào trong lịch sử ví của bạn.')).toBeTruthy();
});

test('renders Available and Held balances with ledger entries', async () => {
  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText(/12\.500\.000/)).toBeTruthy();
  });

  // Verify balance values
  expect(screen.getByText(/3\.500\.000/)).toBeTruthy();

  // Verify ledger items
  expect(screen.getByText('Nạp tiền qua VNPay')).toBeTruthy();
  expect(screen.getByText('Giữ hộ đơn hàng #ORD-1042')).toBeTruthy();
  expect(screen.getByText('Mã: ORD-1042')).toBeTruthy();
  expect(screen.getByText('+5.000.000 ₫')).toBeTruthy();
  expect(screen.getByText('-2.500.000 ₫')).toBeTruthy();
});

test('displays debt alert card when debtBalance > 0', async () => {
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({
    result: {
      availableBalance: 20000,
      heldBalance: 0,
      debtBalance: 30000,
    },
  });

  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText(/Tài khoản đang có dư nợ: 30\.000/)).toBeTruthy();
  });

  const payDebtBtn = screen.getByText('Nạp bù 30.000 ₫');
  fireEvent.press(payDebtBtn);
  expect(mockPush).toHaveBeenCalledWith('/payment/topup?amount=30000');
});

test('navigates to top-up and payout settings screens', async () => {
  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText('Nạp tiền vào ví')).toBeTruthy();
  });

  fireEvent.press(screen.getByText('Nạp tiền vào ví'));
  expect(mockPush).toHaveBeenCalledWith('/payment/topup');

  fireEvent.press(screen.getByText('Cài đặt rút tiền'));
  expect(mockPush).toHaveBeenCalledWith('/payment/payout-settings');
});
