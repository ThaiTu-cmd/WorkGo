import { fireEvent, render, screen } from '@testing-library/react-native';

import { useOrderDetail } from '../hooks';
import { OrderDetailScreen } from '../OrderDetailScreen';

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('../hooks', () => ({ useOrderDetail: jest.fn() }));
jest.mock('../CancellationCard', () => ({ CancellationCard: () => null }));
jest.mock('../EvidenceGrid', () => ({ EvidenceGrid: () => null }));
jest.mock('@/features/payment/EscrowCard', () => {
  const { Text } = jest.requireActual('react-native');
  return { EscrowCard: ({ role }: { role: string }) => <Text>{`escrow:${role}`}</Text> };
});

const q = (data: unknown) => ({ data, isPending: false, isError: false, refetch: jest.fn(), isRefetching: false });

function withOrder(orderStatus: string) {
  (useOrderDetail as jest.Mock).mockReturnValue({
    order: q({ orderId: 'o1', title: 'Thiết kế logo', executionType: 'DIGITAL', orderStatus, totalAmount: 550000 }),
    history: q([]),
    execution: q(null),
    cancellation: q(null),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 'o1', role: 'CLIENT' };
});

test('client can pay an order waiting for payment', async () => {
  withOrder('PENDING_PAYMENT');
  await render(<OrderDetailScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Thanh toán' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/payment/[orderId]', params: { orderId: 'o1' } });
  expect(screen.queryByText(/phiên bản sau/)).toBeNull();
  expect(screen.queryByText(/^escrow:/)).toBeNull();
});

test('provider gets no pay button', async () => {
  mockParams = { id: 'o1', role: 'PROVIDER' };
  withOrder('PENDING_PAYMENT');
  await render(<OrderDetailScreen />);
  expect(screen.queryByRole('button', { name: 'Thanh toán' })).toBeNull();
});

test('a paid order shows the escrow card for the viewer role', async () => {
  mockParams = { id: 'o1', role: 'PROVIDER' };
  withOrder('CONFIRMED');
  await render(<OrderDetailScreen />);
  expect(screen.getByText('escrow:PROVIDER')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Thanh toán' })).toBeNull();
});
