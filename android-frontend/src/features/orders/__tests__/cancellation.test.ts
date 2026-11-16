import type { CancellationDto, OrderDto, OrderStatus } from '@/api/types';

import { canRespond, cancelMode, cancellationTitle, noteError, reasonLabel } from '../cancellation';

const order = (orderStatus: OrderStatus) => ({ orderStatus }) as OrderDto;
const request = (over: Partial<CancellationDto> = {}): CancellationDto => ({
  cancellationRequestId: 'c1',
  orderId: 'o1',
  requestedByRole: 'CLIENT',
  reasonCode: 'CHANGED_MIND',
  status: 'PENDING',
  createdAt: '2026-11-06T02:00:00Z',
  ...over,
});

test('an unpaid order is cancelled at once by the client only', () => {
  expect(cancelMode(order('PENDING_PAYMENT'), 'CLIENT', null)).toBe('immediate');
  expect(cancelMode(order('PENDING_PAYMENT'), 'PROVIDER', null)).toBeNull();
});

test('a paid order needs a request from either side', () => {
  for (const status of ['CONFIRMED', 'IN_PROGRESS'] as const) {
    expect(cancelMode(order(status), 'CLIENT', null)).toBe('request');
    expect(cancelMode(order(status), 'PROVIDER', null)).toBe('request');
  }
});

test('delivered and finished orders cannot be cancelled', () => {
  for (const status of ['DELIVERED', 'COMPLETED', 'CANCELLED'] as const) {
    expect(cancelMode(order(status), 'CLIENT', null)).toBeNull();
  }
});

test('an order allows one request, even after it was rejected', () => {
  expect(cancelMode(order('CONFIRMED'), 'CLIENT', request())).toBeNull();
  expect(cancelMode(order('CONFIRMED'), 'CLIENT', request({ status: 'REJECTED' }))).toBeNull();
});

test('only the other side answers a pending request', () => {
  expect(canRespond(request(), 'PROVIDER')).toBe(true);
  expect(canRespond(request(), 'CLIENT')).toBe(false);
  expect(canRespond(request({ status: 'REJECTED' }), 'PROVIDER')).toBe(false);
  expect(canRespond(null, 'PROVIDER')).toBe(false);
});

test('a request needs a note of at least 20 characters', () => {
  expect(noteError('request', 'LATE', ' quá ngắn ')).toBe('Ghi chú cần ít nhất 20 ký tự.');
  expect(noteError('request', 'LATE', 'Chuyên gia không phản hồi hai ngày')).toBeNull();
});

test('an immediate cancel needs a note only for the OTHER reason', () => {
  expect(noteError('immediate', 'CHANGED_MIND', '')).toBeNull();
  expect(noteError('immediate', 'OTHER', '')).toBe('Ghi chú cần ít nhất 20 ký tự.');
});

test('reason codes read as Vietnamese and unknown codes pass through', () => {
  expect(reasonLabel('CHANGED_MIND')).toBe('Đổi ý / không còn nhu cầu');
  expect(reasonLabel('OVERLOADED')).toBe('Quá tải lịch, không kịp nhận đơn');
  expect(reasonLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
});

test('the title follows the request status', () => {
  expect(cancellationTitle('PENDING')).toBe('Yêu cầu huỷ đang chờ phản hồi');
  expect(cancellationTitle('ACCEPTED')).toBe('Đơn đã được huỷ');
  expect(cancellationTitle('AUTO_APPROVED')).toBe('Đơn đã được huỷ');
  expect(cancellationTitle('REJECTED')).toBe('Yêu cầu huỷ đã bị từ chối');
});
