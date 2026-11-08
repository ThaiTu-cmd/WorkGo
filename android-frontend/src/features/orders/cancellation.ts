import type { CancellationDto, CancellationStatus, OrderDto, OrderRole } from '@/api/types';

export const NOTE_MIN = 20;
export const NOTE_MAX = 500;

export type CancelMode = 'immediate' | 'request';
type Reason = { code: string; label: string };

// Same codes as the website, so both clients show the same reason.
export const CANCEL_REASONS: Record<OrderRole, Reason[]> = {
  CLIENT: [
    { code: 'CHANGED_MIND', label: 'Đổi ý / không còn nhu cầu' },
    { code: 'LATE', label: 'Chuyên gia chậm tiến độ' },
    { code: 'QUALITY', label: 'Chất lượng không như mô tả' },
    { code: 'NO_CONTACT', label: 'Không liên lạc được chuyên gia' },
    { code: 'WRONG_ORDER', label: 'Đặt nhầm gói / dịch vụ' },
    { code: 'OTHER', label: 'Lý do khác' },
  ],
  PROVIDER: [
    { code: 'OVERLOADED', label: 'Quá tải lịch, không kịp nhận đơn' },
    { code: 'OUT_OF_SCOPE', label: 'Yêu cầu ngoài phạm vi gói' },
    { code: 'MISSING_INFO', label: 'Thiếu thông tin từ khách hàng' },
    { code: 'OTHER', label: 'Lý do khác' },
  ],
};

const REASON_LABELS = new Map([...CANCEL_REASONS.CLIENT, ...CANCEL_REASONS.PROVIDER].map((r) => [r.code, r.label]));

export function reasonLabel(code: string): string {
  return REASON_LABELS.get(code) ?? code;
}

// Mirrors order-service: unpaid orders cancel at once, paid ones wait for the
// other side, and an order holds one request ever, rejected or not.
export function cancelMode(order: OrderDto, role: OrderRole, cancellation: CancellationDto | null): CancelMode | null {
  if (cancellation) return null;
  if (order.orderStatus === 'PENDING_PAYMENT') return role === 'CLIENT' ? 'immediate' : null;
  return order.orderStatus === 'CONFIRMED' || order.orderStatus === 'IN_PROGRESS' ? 'request' : null;
}

export function canRespond(cancellation: CancellationDto | null, role: OrderRole): boolean {
  return cancellation?.status === 'PENDING' && cancellation.requestedByRole !== role;
}

export function noteRequired(mode: CancelMode, reasonCode: string): boolean {
  return mode === 'request' || reasonCode === 'OTHER';
}

export function noteError(mode: CancelMode, reasonCode: string, note: string): string | null {
  return noteRequired(mode, reasonCode) && note.trim().length < NOTE_MIN ? `Ghi chú cần ít nhất ${NOTE_MIN} ký tự.` : null;
}

const TITLES: Record<CancellationStatus, string> = {
  PENDING: 'Yêu cầu huỷ đang chờ phản hồi',
  ACCEPTED: 'Đơn đã được huỷ',
  AUTO_APPROVED: 'Đơn đã được huỷ',
  REJECTED: 'Yêu cầu huỷ đã bị từ chối',
};

export function cancellationTitle(status: CancellationStatus): string {
  return TITLES[status];
}
