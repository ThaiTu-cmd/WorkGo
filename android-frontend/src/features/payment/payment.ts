import type { EscrowStatus, OrderDto, PaymentDto, PaymentGateway, PaymentMethod } from '@/api/types';
import { translate } from '@/i18n';

// Mirrors order-service `order.payment-timeout-minutes`: an unpaid order is
// cancelled (and its booking slot released) this long after it was placed.
export const ORDER_PAYMENT_TIMEOUT_MINUTES = 30;

// VNPay / MoMo confirm through their server-to-server IPN, which can lag the
// moment the user closes the browser: poll every 3 s for about 2 minutes.
export const POLL_INTERVAL_MS = 3000;
export const POLL_LIMIT = 40;

export type PaymentOption = {
  id: string;
  gateway: PaymentGateway;
  paymentMethod?: PaymentMethod;
  name: string;
  description: string;
};

const MOCK_OPTION: PaymentOption = {
  id: 'mock',
  gateway: 'MOCK',
  get name() {
    return translate('payment.thanh_toan_thu_nghiem');
  },
  get description() {
    return translate('payment.moi_truong_dev_gia_lap');
  },
};

const REAL_OPTIONS: PaymentOption[] = [
  {
    id: 'vnpay-qr',
    gateway: 'VNPAY',
    paymentMethod: 'QR',
    name: 'VNPay QR',
    get description() {
      return translate('payment.quet_ma_qr_bang_ung');
    },
  },
  {
    id: 'vnpay-card',
    gateway: 'VNPAY',
    paymentMethod: 'INTL_CARD',
    get name() {
      return translate('payment.the_quoc_te');
    },
    description: 'Visa, Mastercard, JCB qua VNPay',
  },
  {
    id: 'momo',
    gateway: 'MOMO',
    paymentMethod: 'WALLET',
    get name() {
      return translate('payment.vi_momo');
    },
    get description() {
      return translate('payment.thanh_toan_bang_vi_momo');
    },
  },
];

// The MOCK gateway only exists while payment-service runs with the "dev"
// profile. EXPO_PUBLIC_ENABLE_MOCK_PAYMENT=true|false overrides the build type.
export function isMockPaymentEnabled(flag: string | undefined, isDev: boolean): boolean {
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return isDev;
}

export const MOCK_PAYMENT_ENABLED = isMockPaymentEnabled(process.env.EXPO_PUBLIC_ENABLE_MOCK_PAYMENT, __DEV__);

export function paymentOptions(mockEnabled: boolean): PaymentOption[] {
  return mockEnabled ? [MOCK_OPTION, ...REAL_OPTIONS] : REAL_OPTIONS;
}

export function findPaymentOption(id: string | undefined, mockEnabled: boolean): PaymentOption {
  const options = paymentOptions(mockEnabled);
  return options.find((o) => o.id === id) ?? options[0];
}

export function newIdempotencyKey(): string {
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand()}-${rand()}`;
}

export function paymentDeadline(order: Pick<OrderDto, 'placedAt' | 'createdAt'>): Date | null {
  const start = order.placedAt ?? order.createdAt;
  if (!start) return null;
  const t = new Date(start).getTime();
  return Number.isNaN(t) ? null : new Date(t + ORDER_PAYMENT_TIMEOUT_MINUTES * 60_000);
}

export const isPaymentWaiting = (p: PaymentDto | null | undefined): boolean => p?.status === 'INITIATED' || p?.status === 'PENDING';

// The newest payment still waiting for a result, so reopening the screen
// continues it instead of starting another one.
export function pickResumablePayment(payments: PaymentDto[] | null | undefined): PaymentDto | null {
  const waiting = (payments ?? []).filter(isPaymentWaiting);
  waiting.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  return waiting[0] ?? null;
}

// React Query `refetchInterval`: MOCK is settled by the user's own tap, so
// only real gateways are polled.
export function pollInterval(payment: PaymentDto | null | undefined, polls: number): number | false {
  if (!payment || payment.gateway === 'MOCK' || !isPaymentWaiting(payment)) return false;
  return polls < POLL_LIMIT ? POLL_INTERVAL_MS : false;
}

export const ESCROW_STATUS_LABEL: Record<EscrowStatus, string> = {
  get PENDING() {
    return translate('payment.dang_cho');
  },
  get HOLDING() {
    return translate('payment.dang_giu_tien');
  },
  get RELEASED() {
    return translate('payment.da_giai_ngan');
  },
  get REFUNDED() {
    return translate('payment.da_hoan_tien');
  },
  get PARTIALLY_REFUNDED() {
    return translate('payment.hoan_tien_mot_phan');
  },
  get FROZEN() {
    return translate('payment.tam_khoa');
  },
};
