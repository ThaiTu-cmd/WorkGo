import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { orderApi } from '@/api/orderApi';

import { useOrderDetail } from '../hooks';
import { OrderDetailScreen } from '../OrderDetailScreen';

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/api/orderApi', () => ({ orderApi: { confirmCashReceived: jest.fn(), acceptOnsite: jest.fn() } }));
jest.mock('../hooks', () => ({ useOrderDetail: jest.fn() }));
jest.mock('../CancellationCard', () => ({ CancellationCard: () => null }));
jest.mock('../EvidenceGrid', () => ({ EvidenceGrid: () => null }));
jest.mock('../DigitalDeliveryCard', () => ({ DigitalDeliveryCard: () => null }));
jest.mock('../OrderAgreementCard', () => ({ OrderAgreementCard: () => null }));
jest.mock('@/features/payment/EscrowCard', () => {
  const { Text } = jest.requireActual('react-native');
  return { EscrowCard: ({ role }: { role: string }) => <Text>{`escrow:${role}`}</Text> };
});

const q = (data: unknown) => ({ data, isPending: false, isError: false, refetch: jest.fn(), isRefetching: false });

function withOrder(orderStatus: string, cash = false, cashReceivedAt?: string) {
  (useOrderDetail as jest.Mock).mockReturnValue({
    order: q({ orderId: 'o1', title: 'Thiết kế logo', executionType: cash ? 'ONSITE' : 'DIGITAL', paymentMethod: cash ? 'CASH' : 'WALLET', orderStatus, totalAmount: 550000 }),
    history: q([]),
    execution: q(cash ? { onsite: { status: 'SERVICE_DONE', cashReceivedAt } } : null),
    cancellation: q(null),
  });
}

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(<QueryClientProvider client={client}><OrderDetailScreen /></QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 'o1', role: 'CLIENT' };
});

test('client can pay an order waiting for payment', async () => {
  withOrder('PENDING_PAYMENT');
  await renderDetail();
  await fireEvent.press(screen.getByRole('button', { name: 'Thanh toán' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/payment/[orderId]', params: { orderId: 'o1' } });
  expect(screen.queryByText(/phiên bản sau/)).toBeNull();
  expect(screen.queryByText(/^escrow:/)).toBeNull();
});

test('provider gets no pay button', async () => {
  mockParams = { id: 'o1', role: 'PROVIDER' };
  withOrder('PENDING_PAYMENT');
  await renderDetail();
  expect(screen.queryByRole('button', { name: 'Thanh toán' })).toBeNull();
});

test('a paid order shows the escrow card for the viewer role', async () => {
  mockParams = { id: 'o1', role: 'PROVIDER' };
  withOrder('CONFIRMED');
  await renderDetail();
  expect(screen.getByText('escrow:PROVIDER')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Thanh toán' })).toBeNull();
});

test('an onsite cash order lets the provider confirm receipt without escrow', async () => {
  mockParams = { id: 'o1', role: 'PROVIDER' };
  withOrder('DELIVERED', true);
  (orderApi.confirmCashReceived as jest.Mock).mockResolvedValue({ result: { cashReceivedAt: '2026-11-18T10:00:00Z' } });
  await renderDetail();
  await fireEvent.press(screen.getByRole('button', { name: 'Xác nhận đã nhận tiền mặt' }));
  expect(orderApi.confirmCashReceived).toHaveBeenCalledWith('o1');
  expect(screen.queryByText(/^escrow:/)).toBeNull();
});

test('a confirmed cash receipt is read from execution and cannot be submitted again', async () => {
  mockParams = { id: 'o1', role: 'PROVIDER' };
  withOrder('DELIVERED', true, '2026-11-18T10:00:00Z');
  await renderDetail();
  expect(screen.getByText(/Đã nhận tiền mặt lúc/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Xác nhận đã nhận tiền mặt' })).toBeNull();
});

test('the client can see cash status without confirming receipt for the provider', async () => {
  withOrder('DELIVERED', true);
  (orderApi.acceptOnsite as jest.Mock).mockResolvedValue({ result: { status: 'ACCEPT' } });
  await renderDetail();
  expect(screen.getByText('Chưa xác nhận nhận tiền mặt')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Xác nhận đã nhận tiền mặt' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Nghiệm thu dịch vụ' }));
  expect(orderApi.acceptOnsite).toHaveBeenCalledWith('o1');
  expect(orderApi.confirmCashReceived).not.toHaveBeenCalled();
});
