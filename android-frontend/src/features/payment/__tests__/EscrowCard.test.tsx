import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { paymentApi } from '@/api/paymentApi';

import { EscrowCard } from '../EscrowCard';

jest.mock('@/api/paymentApi', () => ({ paymentApi: { getEscrow: jest.fn() } }));

function renderCard(role: 'CLIENT' | 'PROVIDER') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <EscrowCard orderId="o1" role={role} />
    </QueryClientProvider>
  );
}

const escrow = (over: Record<string, unknown> = {}) => ({
  result: { escrowAccountId: 'e1', orderId: 'o1', status: 'HOLDING', heldAmount: 550000, providerNetAmount: 500000, ...over },
});

beforeEach(() => jest.clearAllMocks());

test('client sees the held amount and that money is released after acceptance', async () => {
  (paymentApi.getEscrow as jest.Mock).mockResolvedValue(escrow());
  await renderCard('CLIENT');
  expect(await screen.findByText('Đang giữ tiền')).toBeTruthy();
  expect(screen.getByText('550.000 ₫')).toBeTruthy();
  expect(screen.getByText('Tiền được giữ an toàn và chỉ chuyển cho chuyên gia sau khi bạn nghiệm thu đơn.')).toBeTruthy();
});

test('provider sees what they will receive', async () => {
  (paymentApi.getEscrow as jest.Mock).mockResolvedValue(escrow());
  await renderCard('PROVIDER');
  expect(await screen.findByText('Bạn nhận 500.000 ₫ sau khi khách nghiệm thu đơn.')).toBeTruthy();
});

test('released escrow shows the released amount', async () => {
  (paymentApi.getEscrow as jest.Mock).mockResolvedValue(escrow({ status: 'RELEASED', releasedAmount: 500000 }));
  await renderCard('CLIENT');
  expect(await screen.findByText('Đã giải ngân')).toBeTruthy();
  expect(screen.getByText('Đã chuyển cho chuyên gia')).toBeTruthy();
});

test('renders nothing while the order has no escrow yet (3101)', async () => {
  (paymentApi.getEscrow as jest.Mock).mockRejectedValue(new ApiError(404, { code: 3101 }));
  const view = await renderCard('CLIENT');
  await waitFor(() => expect(paymentApi.getEscrow).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
  expect(view.toJSON()).toBeNull();
});

test('a 404 is not retried, other errors are retried once', async () => {
  (paymentApi.getEscrow as jest.Mock).mockRejectedValue(new ApiError(404, { code: 3101 }));
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0, gcTime: Infinity } } });
  await render(
    <QueryClientProvider client={client}>
      <EscrowCard orderId="o1" role="CLIENT" />
    </QueryClientProvider>
  );
  await waitFor(() => expect(client.getQueryState(['escrow', 'o1'])?.status).toBe('error'));
  expect(paymentApi.getEscrow).toHaveBeenCalledTimes(1);

  (paymentApi.getEscrow as jest.Mock).mockClear().mockRejectedValue(new ApiError(503, null));
  await client.resetQueries({ queryKey: ['escrow', 'o1'] });
  await waitFor(() => expect(client.getQueryState(['escrow', 'o1'])?.status).toBe('error'));
  expect(paymentApi.getEscrow).toHaveBeenCalledTimes(2);
});
