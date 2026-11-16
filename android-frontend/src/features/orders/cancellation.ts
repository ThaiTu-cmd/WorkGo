import type { CancellationDto, CancellationStatus, OrderDto, OrderRole } from '@/api/types';
import { translate } from '@/i18n';

export const NOTE_MIN = 20;
export const NOTE_MAX = 500;

export type CancelMode = 'immediate' | 'request';
type Reason = { code: string; label: string };

// Same codes as the website, so both clients show the same reason.
export const CANCEL_REASONS: Record<OrderRole, Reason[]> = {
  CLIENT: [
    { code: 'CHANGED_MIND', get label() {
    return translate('cancellation.doi_y_khong_con_nhu');
  } },
    { code: 'LATE', get label() {
    return translate('cancellation.chuyen_gia_cham_tien_do');
  } },
    { code: 'QUALITY', get label() {
    return translate('cancellation.chat_luong_khong_nhu_mo');
  } },
    { code: 'NO_CONTACT', get label() {
    return translate('cancellation.khong_lien_lac_duoc_chuyen');
  } },
    { code: 'WRONG_ORDER', get label() {
    return translate('cancellation.dat_nham_goi_dich_vu');
  } },
    { code: 'OTHER', get label() {
    return translate('cancellation.ly_do_khac');
  } },
  ],
  PROVIDER: [
    { code: 'OVERLOADED', get label() {
    return translate('cancellation.qua_tai_lich_khong_kip');
  } },
    { code: 'OUT_OF_SCOPE', get label() {
    return translate('cancellation.yeu_cau_ngoai_pham_vi');
  } },
    { code: 'MISSING_INFO', get label() {
    return translate('cancellation.thieu_thong_tin_tu_khach');
  } },
    { code: 'OTHER', get label() {
    return translate('cancellation.ly_do_khac');
  } },
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
  return noteRequired(mode, reasonCode) && note.trim().length < NOTE_MIN ? translate('cancellation.ghi_chu_can_it_nhat', { p0: NOTE_MIN }) : null;
}

const TITLES: Record<CancellationStatus, string> = {
  get PENDING() {
    return translate('cancellation.yeu_cau_huy_dang_cho');
  },
  get ACCEPTED() {
    return translate('cancellation.don_da_duoc_huy');
  },
  get AUTO_APPROVED() {
    return translate('cancellation.don_da_duoc_huy');
  },
  get REJECTED() {
    return translate('cancellation.yeu_cau_huy_da_bi');
  },
};

export function cancellationTitle(status: CancellationStatus): string {
  return TITLES[status];
}
