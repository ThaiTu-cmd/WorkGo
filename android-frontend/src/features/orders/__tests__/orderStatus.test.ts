import type { ExecutionDto, OrderDto } from '@/api/types';

import { canAddEvidence, historyItems, ORDER_STATUS_LABEL, pickActiveOrder, upcomingAvailableSlots } from '../orderStatus';

const order = (over: Partial<OrderDto> = {}): OrderDto => ({
  orderId: 'o1',
  serviceId: 's1',
  executionType: 'ONSITE',
  title: 'Sửa máy lạnh',
  orderStatus: 'IN_PROGRESS',
  ...over,
});
const exec = (status: NonNullable<ExecutionDto['onsite']>['status']): ExecutionDto => ({
  executionType: 'ONSITE',
  onsite: { status },
});

test('canAddEvidence only for provider on ONSITE IN_PROGRESS + IN_SERVICE', () => {
  expect(canAddEvidence(order(), exec('IN_SERVICE'), 'PROVIDER')).toBe(true);
  expect(canAddEvidence(order(), exec('IN_SERVICE'), 'CLIENT')).toBe(false);
  expect(canAddEvidence(order({ executionType: 'DIGITAL' }), exec('IN_SERVICE'), 'PROVIDER')).toBe(false);
  expect(canAddEvidence(order({ orderStatus: 'CONFIRMED' }), exec('IN_SERVICE'), 'PROVIDER')).toBe(false);
  expect(canAddEvidence(order(), exec('SCHEDULED'), 'PROVIDER')).toBe(false);
  expect(canAddEvidence(order(), null, 'PROVIDER')).toBe(false);
});

test('ORDER_STATUS_LABEL covers every status in Vietnamese', () => {
  expect(ORDER_STATUS_LABEL.PENDING_PAYMENT).toBe('Chờ thanh toán');
  expect(ORDER_STATUS_LABEL.CANCELLED).toBe('Đã huỷ');
});

test('historyItems reads a plain list, a page, or nothing', () => {
  const h = { toStatus: 'CONFIRMED' as const, createdAt: '2026-01-01T00:00:00Z' };
  expect(historyItems({ result: [h] })).toEqual([h]);
  expect(historyItems({ result: { data: [h] } })).toEqual([h]);
  expect(historyItems(undefined)).toEqual([]);
});

test('upcomingAvailableSlots keeps future AVAILABLE slots sorted by start', () => {
  const now = Date.parse('2026-10-30T00:00:00Z');
  const slots = [
    { bookingSlotId: 'b', startedAt: '2026-11-02T02:00:00Z', endAt: '2026-11-02T03:00:00Z', status: 'AVAILABLE' as const },
    { bookingSlotId: 'past', startedAt: '2026-10-29T02:00:00Z', endAt: '2026-10-29T03:00:00Z', status: 'AVAILABLE' as const },
    { bookingSlotId: 'held', startedAt: '2026-11-01T02:00:00Z', endAt: '2026-11-01T03:00:00Z', status: 'HELD' as const },
    { bookingSlotId: 'a', startedAt: '2026-11-01T01:00:00Z', endAt: '2026-11-01T02:00:00Z', status: 'AVAILABLE' as const },
  ];
  expect(upcomingAvailableSlots(slots, now).map((s) => s.bookingSlotId)).toEqual(['a', 'b']);
});

test('pickActiveOrder returns the newest order that is not finished', () => {
  const orders = [
    order({ orderId: 'done', orderStatus: 'COMPLETED', createdAt: '2026-10-05T00:00:00Z' }),
    order({ orderId: 'older', orderStatus: 'IN_PROGRESS', createdAt: '2026-10-01T00:00:00Z' }),
    order({ orderId: 'newer', orderStatus: 'PENDING_PAYMENT', createdAt: '2026-10-03T00:00:00Z' }),
    order({ orderId: 'cancel', orderStatus: 'CANCELLED', createdAt: '2026-10-04T00:00:00Z' }),
  ];
  expect(pickActiveOrder(orders)?.orderId).toBe('newer');
});

test('pickActiveOrder returns null when every order is finished or there are none', () => {
  expect(pickActiveOrder([order({ orderStatus: 'COMPLETED' }), order({ orderStatus: 'CANCELLED' })])).toBeNull();
  expect(pickActiveOrder([])).toBeNull();
});
