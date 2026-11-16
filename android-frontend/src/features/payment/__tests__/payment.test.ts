import type { PaymentDto } from '@/api/types';

import {
  ESCROW_STATUS_LABEL,
  findPaymentOption,
  isMockPaymentEnabled,
  newIdempotencyKey,
  ORDER_PAYMENT_TIMEOUT_MINUTES,
  paymentDeadline,
  paymentOptions,
  pickResumablePayment,
  POLL_INTERVAL_MS,
  POLL_LIMIT,
  pollInterval,
} from '../payment';

const payment = (over: Partial<PaymentDto> = {}): PaymentDto => ({
  paymentId: 'p1',
  paymentCode: 'PAY-1',
  orderId: 'o1',
  gateway: 'VNPAY',
  status: 'PENDING',
  ...over,
});

test('MOCK is on in dev builds and off in release builds by default', () => {
  expect(isMockPaymentEnabled(undefined, true)).toBe(true);
  expect(isMockPaymentEnabled(undefined, false)).toBe(false);
});

test('EXPO_PUBLIC_ENABLE_MOCK_PAYMENT overrides the build type', () => {
  expect(isMockPaymentEnabled('false', true)).toBe(false);
  expect(isMockPaymentEnabled('true', false)).toBe(true);
});

test('options mirror the web client; MOCK is listed first only when enabled', () => {
  expect(paymentOptions(false).map((o) => o.id)).toEqual(['vnpay-qr', 'vnpay-card', 'momo']);
  expect(paymentOptions(true).map((o) => o.id)).toEqual(['mock', 'vnpay-qr', 'vnpay-card', 'momo']);
  expect(findPaymentOption('momo', false)).toMatchObject({ gateway: 'MOMO', paymentMethod: 'WALLET' });
  expect(findPaymentOption('vnpay-card', false)).toMatchObject({ gateway: 'VNPAY', paymentMethod: 'INTL_CARD' });
  expect(findPaymentOption('mock', true).gateway).toBe('MOCK');
  expect(findPaymentOption('mock', true).paymentMethod).toBeUndefined();
});

test('an unknown or disabled option falls back to the first option', () => {
  expect(findPaymentOption('mock', false).id).toBe('vnpay-qr');
  expect(findPaymentOption(undefined, true).id).toBe('mock');
});

test('idempotency keys are unique per attempt', () => {
  const keys = new Set(Array.from({ length: 50 }, () => newIdempotencyKey()));
  expect(keys.size).toBe(50);
});

test('deadline is placedAt + 30 minutes, falling back to createdAt', () => {
  expect(ORDER_PAYMENT_TIMEOUT_MINUTES).toBe(30);
  expect(paymentDeadline({ placedAt: '2026-11-12T10:00:00Z' })?.toISOString()).toBe('2026-11-12T10:30:00.000Z');
  expect(paymentDeadline({ placedAt: null, createdAt: '2026-11-12T10:00:00Z' })?.toISOString()).toBe('2026-11-12T10:30:00.000Z');
  expect(paymentDeadline({})).toBeNull();
});

test('resumes the newest waiting payment, ignoring settled ones', () => {
  const list = [
    payment({ paymentId: 'old', status: 'PENDING', createdAt: '2026-11-12T10:00:00Z' }),
    payment({ paymentId: 'new', status: 'INITIATED', createdAt: '2026-11-12T10:05:00Z' }),
    payment({ paymentId: 'failed', status: 'FAILED', createdAt: '2026-11-12T10:09:00Z' }),
  ];
  expect(pickResumablePayment(list)?.paymentId).toBe('new');
  expect(pickResumablePayment([payment({ status: 'FAILED' })])).toBeNull();
  expect(pickResumablePayment(undefined)).toBeNull();
});

test('polls a waiting real-gateway payment until the limit', () => {
  expect(pollInterval(payment({ status: 'PENDING' }), 0)).toBe(POLL_INTERVAL_MS);
  expect(pollInterval(payment({ status: 'PENDING' }), POLL_LIMIT)).toBe(false);
});

test('never polls settled or MOCK payments', () => {
  expect(pollInterval(payment({ status: 'SUCCEEDED' }), 0)).toBe(false);
  expect(pollInterval(payment({ status: 'PENDING', gateway: 'MOCK' }), 0)).toBe(false);
  expect(pollInterval(undefined, 0)).toBe(false);
});

test('escrow labels match the web copy', () => {
  expect(ESCROW_STATUS_LABEL.HOLDING).toBe('Đang giữ tiền');
  expect(ESCROW_STATUS_LABEL.RELEASED).toBe('Đã giải ngân');
});
