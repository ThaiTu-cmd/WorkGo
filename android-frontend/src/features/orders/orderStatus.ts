import { pageItems } from '@/api/adapters';
import type { BookingSlotDto, ExecutionDto, OnsiteStatus, OrderDto, OrderHistoryDto, OrderRole, OrderStatus } from '@/api/types';
import type { Tone } from '@/ui';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã bàn giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
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
  SCHEDULED: 'Đã hẹn lịch',
  IN_SERVICE: 'Đang làm tại nhà',
  SERVICE_DONE: 'Đã làm xong',
  ACCEPT: 'Khách đã nghiệm thu',
  CANCELLED: 'Đã huỷ',
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
