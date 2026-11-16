import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';

import { ApiError } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import type { PaymentDto } from '@/api/types';

import { PaymentScreen } from '../PaymentScreen';

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/api/orderApi', () => ({ orderApi: { getOrder: jest.fn() } }));
jest.mock('@/api/paymentApi', () => ({
  paymentApi: { createPayment: jest.fn(), getPayment: jest.fn(), getPaymentsOfOrder: jest.fn(), simulateMock: jest.fn() },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

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
      placedAt: '2026-11-12T10:00:00Z',
      ...over,
    },
  },
});

const payment = (over: Partial<PaymentDto> = {}): PaymentDto => ({
  paymentId: 'p1',
  paymentCode: 'PAY-1',
  orderId: 'o1',
  amount: 550000,
  gateway: 'MOCK',
  status: 'PENDING',
  createdAt: '2026-11-12T10:01:00Z',
  ...over,
});

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
  mockParams = { orderId: 'o1' };
  (orderApi.getOrder as jest.Mock).mockResolvedValue(order());
  (paymentApi.getPaymentsOfOrder as jest.Mock).mockResolvedValue({ result: [] });
});

test('shows the amount to pay and the payment deadline', async () => {
  await renderScreen();
  expect(await screen.findByTestId('payment-amount')).toHaveTextContent('550.000 ₫');
  expect(screen.getByText(/Hạn thanh toán/)).toBeTruthy();
});

test('MOCK is preselected in dev; paying creates a MOCK payment and offers simulated results without a browser', async () => {
  (paymentApi.createPayment as jest.Mock).mockResolvedValue({ result: payment() });
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: /^Thanh toán/ }));

  expect(await screen.findByRole('button', { name: 'Giả lập thành công' })).toBeTruthy();
  expect(paymentApi.createPayment).toHaveBeenCalledWith({ orderId: 'o1', gateway: 'MOCK', paymentMethod: undefined }, expect.any(String));
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

test('simulated success shows the result and leads back to the order', async () => {
  (paymentApi.getPaymentsOfOrder as jest.Mock).mockResolvedValue({ result: [payment()] });
  (paymentApi.getPayment as jest.Mock).mockResolvedValue({ result: payment() });
  (paymentApi.simulateMock as jest.Mock).mockResolvedValue({ result: payment({ status: 'SUCCEEDED' }) });
  await renderScreen();

  await fireEvent.press(await screen.findByRole('button', { name: 'Giả lập thành công' }));
  expect(await screen.findByText('Thanh toán thành công')).toBeTruthy();
  expect(paymentApi.simulateMock).toHaveBeenCalledWith('PAY-1', true);
  expect(paymentApi.createPayment).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: 'Xem đơn hàng' }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1', role: 'CLIENT' } });
});

test('simulated failure lets the user pay again', async () => {
  (paymentApi.getPaymentsOfOrder as jest.Mock).mockResolvedValue({ result: [payment()] });
  (paymentApi.getPayment as jest.Mock).mockResolvedValue({ result: payment() });
  (paymentApi.simulateMock as jest.Mock).mockResolvedValue({ result: payment({ status: 'FAILED', failureMessage: 'Mock payment failed' }) });
  await renderScreen();

  await fireEvent.press(await screen.findByRole('button', { name: 'Giả lập thất bại' }));
  expect(await screen.findByText('Thanh toán không thành công')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Thử thanh toán lại' })).toBeTruthy();
});

test('VNPay opens the gateway page, then checks the payment once the browser closes', async () => {
  (paymentApi.createPayment as jest.Mock).mockResolvedValue({
    result: payment({ gateway: 'VNPAY', paymentMethod: 'QR', paymentUrl: 'https://sandbox.vnpayment.vn/pay?x=1' }),
  });
  (paymentApi.getPayment as jest.Mock).mockResolvedValue({ result: payment({ gateway: 'VNPAY', status: 'SUCCEEDED' }) });
  (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });
  await renderScreen();

  await fireEvent.press(await screen.findByRole('radio', { name: 'VNPay QR' }));
  await fireEvent.press(screen.getByRole('button', { name: /^Thanh toán/ }));

  expect(await screen.findByText('Thanh toán thành công')).toBeTruthy();
  expect(paymentApi.createPayment).toHaveBeenCalledWith({ orderId: 'o1', gateway: 'VNPAY', paymentMethod: 'QR' }, expect.any(String));
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://sandbox.vnpayment.vn/pay?x=1');
  expect(paymentApi.getPayment).toHaveBeenCalledWith('p1');
});

test('start=1 from checkout starts the payment with the chosen option right away', async () => {
  mockParams = { orderId: 'o1', option: 'momo', start: '1' };
  (paymentApi.createPayment as jest.Mock).mockResolvedValue({
    result: payment({ gateway: 'MOMO', paymentMethod: 'WALLET', paymentUrl: 'https://test-payment.momo.vn/pay' }),
  });
  (paymentApi.getPayment as jest.Mock).mockResolvedValue({ result: payment({ gateway: 'MOMO' }) });
  (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });
  await renderScreen();

  await waitFor(() =>
    expect(paymentApi.createPayment).toHaveBeenCalledWith({ orderId: 'o1', gateway: 'MOMO', paymentMethod: 'WALLET' }, expect.any(String))
  );
  expect(paymentApi.createPayment).toHaveBeenCalledTimes(1);
  expect(await screen.findByText('Đang chờ xác nhận thanh toán…')).toBeTruthy();
});

test('a create error shows the payment-service message', async () => {
  (paymentApi.createPayment as jest.Mock).mockRejectedValue(new ApiError(409, { code: 3003, message: 'Order already paid' }));
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: /^Thanh toán/ }));
  expect(await screen.findByText('Đơn này đã được thanh toán.')).toBeTruthy();
});

test('an order that is no longer waiting for payment cannot be paid', async () => {
  (orderApi.getOrder as jest.Mock).mockResolvedValue(order({ orderStatus: 'CANCELLED' }));
  await renderScreen();
  expect(await screen.findByText('Đơn này không còn ở trạng thái chờ thanh toán.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Thanh toán/ })).toBeNull();
});
