import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { qk } from '@/api/queryKeys';
import type { CancellationDto, OrderDto, OrderRole } from '@/api/types';

import { CancellationCard } from '../CancellationCard';
import { fetchCancellation } from '../hooks';

jest.mock('@/api/orderApi', () => ({
  orderApi: { cancelOrder: jest.fn(), respondCancellation: jest.fn(), getCancellation: jest.fn() },
}));

const order = (over: Partial<OrderDto> = {}) =>
  ({ orderId: 'o1', serviceId: 's1', orderStatus: 'CONFIRMED', ...over }) as OrderDto;

const pending: CancellationDto = {
  cancellationRequestId: 'c1',
  orderId: 'o1',
  requestedByRole: 'CLIENT',
  reasonCode: 'CHANGED_MIND',
  note: 'Tôi không còn nhu cầu nữa',
  status: 'PENDING',
  createdAt: '2026-11-06T02:00:00Z',
};

async function renderCard(o: OrderDto, role: OrderRole, cancellation: CancellationDto | null, isSuccess = true) {
  // gcTime Infinity: no garbage-collection timers left running after the test.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  await render(
    <QueryClientProvider client={client}>
      <CancellationCard order={o} role={role} cancellation={{ data: cancellation, isSuccess }} />
    </QueryClientProvider>
  );
  return { invalidate };
}

beforeEach(() => jest.clearAllMocks());

test('client cancels an unpaid order without a note', async () => {
  (orderApi.cancelOrder as jest.Mock).mockResolvedValue({ result: { status: 'AUTO_APPROVED' } });
  const { invalidate } = await renderCard(order({ orderStatus: 'PENDING_PAYMENT' }), 'CLIENT', null);

  await fireEvent.press(screen.getByRole('button', { name: 'Huỷ đơn' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Đặt nhầm gói / dịch vụ' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Xác nhận huỷ đơn' }));

  await waitFor(() =>
    expect(orderApi.cancelOrder).toHaveBeenCalledWith('o1', { reasonCode: 'WRONG_ORDER', note: undefined })
  );
  await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.slots('s1') }));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.orders('CLIENT') });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.orderCancellation('o1') });
});

test('a paid order stays unsendable until the note is long enough', async () => {
  (orderApi.cancelOrder as jest.Mock).mockResolvedValue({ result: pending });
  await renderCard(order(), 'CLIENT', null);

  await fireEvent.press(screen.getByRole('button', { name: 'Yêu cầu huỷ' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Chuyên gia chậm tiến độ' }));
  const send = screen.getByRole('button', { name: 'Gửi yêu cầu huỷ' });
  expect(send).toBeDisabled();

  await fireEvent.changeText(screen.getByLabelText('Ghi chú (bắt buộc)'), 'Chuyên gia không phản hồi hai ngày');
  expect(send).toBeEnabled();
  await fireEvent.press(send);
  await waitFor(() =>
    expect(orderApi.cancelOrder).toHaveBeenCalledWith('o1', {
      reasonCode: 'LATE',
      note: 'Chuyên gia không phản hồi hai ngày',
    })
  );
});

test('provider picks from the provider reasons', async () => {
  await renderCard(order({ orderStatus: 'IN_PROGRESS' }), 'PROVIDER', null);
  await fireEvent.press(screen.getByRole('button', { name: 'Yêu cầu huỷ' }));
  expect(screen.getByRole('radio', { name: 'Quá tải lịch, không kịp nhận đơn' })).toBeOnTheScreen();
  expect(screen.queryByRole('radio', { name: 'Chuyên gia chậm tiến độ' })).toBeNull();
});

test('shows the backend reason in Vietnamese when sending fails', async () => {
  (orderApi.cancelOrder as jest.Mock).mockRejectedValue(new ApiError(400, { code: 3015, message: 'raw' }));
  await renderCard(order({ orderStatus: 'PENDING_PAYMENT' }), 'CLIENT', null);

  await fireEvent.press(screen.getByRole('button', { name: 'Huỷ đơn' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Đặt nhầm gói / dịch vụ' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Xác nhận huỷ đơn' }));

  expect(await screen.findByText('Đơn này đã có yêu cầu huỷ.')).toBeOnTheScreen();
});

test('the other side accepts a pending request', async () => {
  (orderApi.respondCancellation as jest.Mock).mockResolvedValue({ result: { ...pending, status: 'ACCEPTED' } });
  await renderCard(order(), 'PROVIDER', pending);

  expect(screen.getByText('Yêu cầu huỷ đang chờ phản hồi')).toBeOnTheScreen();
  expect(screen.getByText('Đổi ý / không còn nhu cầu')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Đồng ý huỷ đơn' }));

  await waitFor(() => expect(orderApi.respondCancellation).toHaveBeenCalledWith('o1', { accept: true }));
});

test('the other side rejects a pending request', async () => {
  (orderApi.respondCancellation as jest.Mock).mockResolvedValue({ result: { ...pending, status: 'REJECTED' } });
  await renderCard(order(), 'PROVIDER', pending);

  await fireEvent.press(screen.getByRole('button', { name: 'Từ chối huỷ đơn' }));

  await waitFor(() => expect(orderApi.respondCancellation).toHaveBeenCalledWith('o1', { accept: false }));
});

test('the requester only waits, and cannot ask again', async () => {
  await renderCard(order(), 'CLIENT', pending);

  expect(screen.getByText('Đang chờ bên còn lại phản hồi.')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Đồng ý huỷ đơn' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Yêu cầu huỷ' })).toBeNull();
});

test('a rejected request offers no further action', async () => {
  await renderCard(order(), 'CLIENT', { ...pending, status: 'REJECTED' });

  expect(screen.getByText('Yêu cầu huỷ đã bị từ chối')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Yêu cầu huỷ' })).toBeNull();
});

test('no button until the existing request has loaded', async () => {
  await renderCard(order(), 'CLIENT', null, false);
  expect(screen.queryByRole('button', { name: 'Yêu cầu huỷ' })).toBeNull();
});

test('a 404 from the server means no request exists', async () => {
  (orderApi.getCancellation as jest.Mock).mockRejectedValue(new ApiError(404, { code: 3016 }));
  await expect(fetchCancellation('o1')).resolves.toBeNull();
});

test('other failures loading the request stay errors', async () => {
  (orderApi.getCancellation as jest.Mock).mockRejectedValue(new ApiError(500, null));
  await expect(fetchCancellation('o1')).rejects.toBeInstanceOf(ApiError);
});
