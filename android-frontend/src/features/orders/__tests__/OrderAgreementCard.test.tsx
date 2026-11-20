import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { orderApi } from '@/api/orderApi';
import type { OrderDto, OrderRole } from '@/api/types';

import { OrderAgreementCard } from '../OrderAgreementCard';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/api/orderApi', () => ({
  orderApi: { getAgreement: jest.fn(), getAmendments: jest.fn(), respondAmendment: jest.fn(), settleAmendment: jest.fn() },
}));

const order: OrderDto = { orderId: 'o1', serviceId: 's1', title: 'Logo', orderStatus: 'IN_PROGRESS', executionType: 'DIGITAL' };
const pending = { amendmentId: 'a1', proposedByRole: 'PROVIDER', status: 'PENDING', newPrice: 1000000 };
function renderAgreement(role: OrderRole) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(<QueryClientProvider client={client}><OrderAgreementCard order={order} role={role} /></QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  (orderApi.getAgreement as jest.Mock).mockResolvedValue({ result: [
    { agreementVersionId: 'v1', versionNo: 1, scope: 'Initial design', price: 500000 },
    { agreementVersionId: 'v2', versionNo: 2, scope: 'Design and print', price: 800000 },
  ] });
  (orderApi.getAmendments as jest.Mock).mockResolvedValue({ result: [pending] });
  (orderApi.respondAmendment as jest.Mock).mockResolvedValue({ result: { ...pending, status: 'AWAITING_PAYMENT' } });
  (orderApi.settleAmendment as jest.Mock).mockResolvedValue({ result: { ...pending, status: 'APPLIED' } });
});

test('shows the latest server agreement and lets the other party accept an amendment', async () => {
  await renderAgreement('CLIENT');
  expect(await screen.findByText('Design and print')).toBeTruthy();
  await fireEvent.press(await screen.findByRole('button', { name: 'Chấp nhận phụ lục' }));
  expect(orderApi.respondAmendment).toHaveBeenCalledWith('o1', 'a1', 'accept');
});

test('only the client can settle a price increase', async () => {
  (orderApi.getAmendments as jest.Mock).mockResolvedValue({ result: [{ ...pending, status: 'AWAITING_PAYMENT' }] });
  await renderAgreement('PROVIDER');
  await screen.findByText('Chờ thanh toán chênh lệch');
  expect(screen.queryByRole('button', { name: 'Thanh toán chênh lệch' })).toBeNull();
});

test('client settles the increase using the amendment ID', async () => {
  (orderApi.getAmendments as jest.Mock).mockResolvedValue({ result: [{ ...pending, status: 'AWAITING_PAYMENT' }] });
  await renderAgreement('CLIENT');
  await fireEvent.press(await screen.findByRole('button', { name: 'Thanh toán chênh lệch' }));
  expect(orderApi.settleAmendment).toHaveBeenCalledWith('o1', 'a1');
});
