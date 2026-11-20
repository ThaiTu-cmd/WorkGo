import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { paymentApi } from '@/api/paymentApi';

import { TopUpScreen } from '../TopUpScreen';

const mockBack = jest.fn();
const mockSetParams = jest.fn();
let mockParams: Record<string, string>;
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ canGoBack: () => true, back: mockBack, setParams: mockSetParams, replace: jest.fn() }),
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/api/paymentApi', () => ({ paymentApi: { createTopUp: jest.fn(), getTopUp: jest.fn() } }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

function renderTopUp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(<QueryClientProvider client={client}><TopUpScreen /></QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { orderId: 'o1', amount: '5000' };
  const topUp = { result: { topUpId: 'top1', topUpCode: 'TOP-1', gateway: 'VNPAY', status: 'SUCCEEDED', amount: 10000 } };
  (paymentApi.createTopUp as jest.Mock).mockResolvedValue(topUp);
  (paymentApi.getTopUp as jest.Mock).mockResolvedValue(topUp);
});

test('preselects the 10000 VND minimum and returns to the order after a server-confirmed top-up', async () => {
  await renderTopUp();
  await fireEvent.press(screen.getByRole('button', { name: /Nạp 10.000/ }));
  expect(paymentApi.createTopUp).toHaveBeenCalledWith({ amount: 10000, gateway: 'VNPAY', paymentMethod: 'QR' }, expect.any(String));
  expect(mockSetParams).toHaveBeenCalledWith({ topUpId: 'top1' });
  await fireEvent.press(await screen.findByRole('button', { name: 'Quay lại thanh toán đơn' }));
  expect(mockBack).toHaveBeenCalled();
});

test('rejects a manually entered amount below 10000 VND', async () => {
  await renderTopUp();
  await fireEvent.changeText(screen.getByLabelText('Hoặc nhập số tiền khác'), '9999');
  await fireEvent.press(screen.getByRole('button', { name: /Nạp 9.999/ }));
  expect(await screen.findByText('Số tiền nạp tối thiểu là 10.000 ₫.')).toBeTruthy();
  expect(paymentApi.createTopUp).not.toHaveBeenCalled();
});

test.each(['-10000', '10000.5', '10000abc', '1e5', '9007199254740992'])('rejects invalid amount %s without changing its meaning', async (value) => {
  await renderTopUp();
  await fireEvent.changeText(screen.getByLabelText('Hoặc nhập số tiền khác'), value);
  await fireEvent.press(screen.getByRole('button', { name: /^(Nạp |Tiến hành nạp tiền)/ }));
  expect(paymentApi.createTopUp).not.toHaveBeenCalled();
});

test('reopening a receipt reloads its server-confirmed status instead of creating another top-up', async () => {
  mockParams = { topUpId: 'top1' };
  await renderTopUp();
  expect(await screen.findByText('Nạp tiền thành công!')).toBeTruthy();
  expect(paymentApi.getTopUp).toHaveBeenCalledWith('top1');
  expect(paymentApi.createTopUp).not.toHaveBeenCalled();
});
