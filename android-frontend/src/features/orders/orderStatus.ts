import { pageItems } from '@/api/adapters';
import type { BookingSlotDto, ExecutionDto, OnsiteStatus, OrderDto, OrderHistoryDto, OrderRole, OrderStatus } from '@/api/types';
import type { Tone } from '@/ui';
import { translate } from '@/i18n';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  get PENDING_PAYMENT() {
    return translate('orderStatus.cho_thanh_toan');
  },
  get CONFIRMED() {
    return translate('orderStatus.da_xac_nhan');
  },
  get IN_PROGRESS() {
    return translate('orderStatus.dang_thuc_hien');
  },
  get DELIVERED() {
    return translate('orderStatus.da_ban_giao');
  },
  get COMPLETED() {
    return translate('orderStatus.hoan_thanh');
  },
  get CANCELLED() {
    return translate('orderStatus.da_huy');
  },
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const ONSITE_STATUS_LABEL: Record<OnsiteStatus, string> = {
  get SCHEDULED() {
    return translate('orderStatus.da_hen_lich');
  },
  get IN_SERVICE() {
    return translate('orderStatus.dang_lam_tai_nha');
  },
  get SERVICE_DONE() {
    return translate('orderStatus.da_lam_xong');
  },
  get ACCEPT() {
    return translate('orderStatus.khach_da_nghiem_thu');
  },
  get CANCELLED() {
    return translate('orderStatus.da_huy');
  },
};

// Mirrors the checks order-service runs before accepting work evidence.
export function canAddEvidence(order: OrderDto, execution: ExecutionDto | null, viewerRole: OrderRole): boolean {
  return (
    viewerRole === 'PROVIDER' &&
    order.executionType === 'ONSITE' &&
    order.orderStatus === 'IN_PROGRESS' &&
    execution?.onsite?.status === 'IN_SERVICE'
  );
}

const FINISHED: OrderStatus[] = ['COMPLETED', 'CANCELLED'];

// The order the home screen surfaces: newest one still in flight.
export function pickActiveOrder(orders: OrderDto[]): OrderDto | null {
  const active = orders.filter((o) => !FINISHED.includes(o.orderStatus));
  active.sort((a, b) => Date.parse(b.createdAt ?? b.placedAt ?? '') - Date.parse(a.createdAt ?? a.placedAt ?? ''));
  return active[0] ?? null;
}

// /orders/{id}/history may answer a plain list or a page.
export function historyItems(res: unknown): OrderHistoryDto[] {
  const result = (res as { result?: unknown } | null | undefined)?.result;
  return Array.isArray(result) ? (result as OrderHistoryDto[]) : pageItems<OrderHistoryDto>(res);
}

export function upcomingAvailableSlots(slots: BookingSlotDto[], nowMs: number): BookingSlotDto[] {
  return slots
    .filter((s) => s.status === 'AVAILABLE' && Date.parse(s.startedAt) > nowMs)
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
}
