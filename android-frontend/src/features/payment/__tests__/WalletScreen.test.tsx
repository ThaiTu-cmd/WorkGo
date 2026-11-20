import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { paymentApi } from '@/api/paymentApi';
import type { WalletDto } from '@/api/types';

import { WalletScreen } from '../WalletScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));

jest.mock('@/api/paymentApi', () => ({
  paymentApi: {
    getWallet: jest.fn(),
    getTopUps: jest.fn(),
    getPayouts: jest.fn(),
    getFees: jest.fn(),
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
  balance: 12500000,
  outstandingFee: 0,
  mayStartNewWork: true,
  currency: 'VND',
};

beforeEach(() => {
  jest.clearAllMocks();
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({ result: mockWallet });
  (paymentApi.getTopUps as jest.Mock).mockResolvedValue({ result: [{ topUpId: 't1', topUpCode: 'TOP-1', amount: 5000000, gateway: 'VNPAY', status: 'PENDING' }] });
  (paymentApi.getPayouts as jest.Mock).mockResolvedValue({ result: [{ payoutId: 'p1', payoutCode: 'OUT-1', amount: 100000, bankCode: 'VCB', status: 'REQUESTED' }] });
  (paymentApi.getFees as jest.Mock).mockResolvedValue({ result: [{ feeAssessmentId: 'f1', orderId: 'ORD-1042', amount: 30000, outstandingAmount: 30000, status: 'OUTSTANDING' }] });
});

test('renders empty state when there are no ledger entries', async () => {
  (paymentApi.getTopUps as jest.Mock).mockResolvedValue({ result: [] });
  (paymentApi.getPayouts as jest.Mock).mockResolvedValue({ result: [] });
  (paymentApi.getFees as jest.Mock).mockResolvedValue({ result: [] });

  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText('Chưa có giao dịch')).toBeTruthy();
  });
  expect(screen.getByText('Chưa có bút toán nào trong lịch sử ví của bạn.')).toBeTruthy();
});

test('renders real server top-ups, payouts and fees without treating pending money as settled', async () => {
  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText(/12\.500\.000/)).toBeTruthy();
  });

  expect(await screen.findByText('Mã: TOP-1')).toBeTruthy();
  expect(screen.getByText('Mã: OUT-1')).toBeTruthy();
  expect(screen.getByText('Mã: ORD-1042')).toBeTruthy();
  expect(screen.getByText('PENDING')).toBeTruthy();
  expect(screen.getByText('REQUESTED')).toBeTruthy();
  expect(screen.getByText('OUTSTANDING')).toBeTruthy();
  expect(screen.queryByText('+5.000.000 ₫')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục nạp tiền' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/payment/topup', params: { topUpId: 't1' } });
});

test('displays debt alert when the wallet has outstanding fees', async () => {
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({
    result: {
      balance: 20000,
      outstandingFee: 30000,
      mayStartNewWork: false,
    },
  });

  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText(/Tài khoản đang có dư nợ: 30\.000/)).toBeTruthy();
  });

  const payDebtBtn = screen.getByText('Nạp bù 30.000 ₫');
  await fireEvent.press(payDebtBtn);
  expect(mockPush).toHaveBeenCalledWith('/payment/topup?amount=30000');
});

test('navigates to top-up and payout settings screens', async () => {
  await renderScreen();

  await waitFor(() => {
    expect(screen.getByText('Nạp tiền vào ví')).toBeTruthy();
  });

  await fireEvent.press(screen.getByText('Nạp tiền vào ví'));
  expect(mockPush).toHaveBeenCalledWith('/payment/topup');

  await fireEvent.press(screen.getByText('Cài đặt rút tiền'));
  expect(mockPush).toHaveBeenCalledWith('/payment/payout-settings');
});
