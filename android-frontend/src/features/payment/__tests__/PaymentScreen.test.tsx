import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';

import { PaymentScreen } from '../PaymentScreen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ orderId: 'o1' }),
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/api/orderApi', () => ({ orderApi: { getOrder: jest.fn() } }));
jest.mock('@/api/paymentApi', () => ({
  paymentApi: {
    getWallet: jest.fn(), payOrder: jest.fn(), getEscrow: jest.fn(),
    getPayment: jest.fn(), getPaymentsOfOrder: jest.fn(),
  },
}));

const order = (over: Record<string, unknown> = {}) => ({
  result: {
    order: {
      orderId: 'o1',
      orderNumber: 'WG-001',
      serviceId: 's1',
      executionType: 'DIGITAL',
      title: 'Thiết kế logo',
      totalAmount: 550000,
      orderStatus: 'PENDING_PAYMENT',
      paymentMethod: 'WALLET',
      placedAt: '2026-11-12T10:00:00Z',
      ...over,
    },
  },
});
const held = { result: { escrowAccountId: 'esc1', orderId: 'o1', status: 'HOLDING', heldAmount: 550000 } };

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <PaymentScreen />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (orderApi.getOrder as jest.Mock).mockResolvedValue(order());
  (paymentApi.getPaymentsOfOrder as jest.Mock).mockResolvedValue({ result: [] });
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({ result: { balance: 600000 } });
  (paymentApi.getEscrow as jest.Mock).mockRejectedValue(new ApiError(404, { code: 3101 }));
  (paymentApi.payOrder as jest.Mock).mockResolvedValue(held);
});

test('renders the server order amount and wallet balance', async () => {
  await renderScreen();
  expect(await screen.findByTestId('payment-amount')).toHaveTextContent('550.000 ₫');
  expect(await screen.findByText('600.000 ₫')).toBeTruthy();
  expect(screen.getByText(/Hạn thanh toán/)).toBeTruthy();
  expect(paymentApi.payOrder).not.toHaveBeenCalled();
});

test('wallet payment uses the same order ID and blocks another charge after a receipt', async () => {
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: /^Thanh toán 550/ }));
  expect(await screen.findByText('Thanh toán thành công')).toBeTruthy();
  expect(paymentApi.payOrder).toHaveBeenCalledTimes(1);
  expect(paymentApi.payOrder).toHaveBeenCalledWith('o1');
  expect(screen.queryByRole('button', { name: /^Thanh toán 550/ })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Xem đơn hàng' }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1', role: 'CLIENT' } });
});

test('a persisted escrow recovers a paid order even while Order is waiting for sync', async () => {
  (paymentApi.getEscrow as jest.Mock).mockResolvedValue(held);
  await renderScreen();
  expect(await screen.findByText('Thanh toán thành công')).toBeTruthy();
  expect(paymentApi.payOrder).not.toHaveBeenCalled();
});

test('insufficient balance links to top-up for this order and shortages come from the server wallet', async () => {
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({ result: { balance: 400000 } });
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: /^Nạp ví/ }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/payment/topup', params: { orderId: 'o1', amount: '150000' } });
  expect(paymentApi.payOrder).not.toHaveBeenCalled();
});

test('wallet insufficient-funds conflict reloads the balance before offering a top-up', async () => {
  (paymentApi.payOrder as jest.Mock).mockRejectedValue(new ApiError(409, { code: 3402 }));
  (paymentApi.getWallet as jest.Mock).mockResolvedValueOnce({ result: { balance: 600000 } })
    .mockResolvedValue({ result: { balance: 300000 } });
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: /^Thanh toán 550/ }));
  expect(await screen.findByText('Số dư ví không đủ để thanh toán.')).toBeTruthy();
  expect(await screen.findByRole('button', { name: /250.000/ })).toBeTruthy();
  await waitFor(() => expect(paymentApi.getWallet).toHaveBeenCalledTimes(2));
});

test.each([{ orderStatus: 'CANCELLED' }, { paymentMethod: 'CASH' }])('an ineligible order cannot be paid: %j', async (fields) => {
  (orderApi.getOrder as jest.Mock).mockResolvedValue(order(fields));
  await renderScreen();
  await screen.findByRole('button', { name: 'Xem đơn hàng' });
  expect(screen.queryByRole('button', { name: /^Thanh toán/ })).toBeNull();
  expect(paymentApi.payOrder).not.toHaveBeenCalled();
});
