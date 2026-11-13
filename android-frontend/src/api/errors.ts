import { translate } from '@/i18n';

// Error model shared by every API module. Rules mirror the web client
// (website-frontend/src/_webapp-mirror/api/axiosClient.js).

// No JSON body on a 5xx / a failed fetch means the gateway or service never
// answered, not a business error from the API.
export const unreachableMessage = () => translate('errors.khong_ket_noi_duoc_may');

const genericMessage = () => translate('errors.da_co_loi_xay_ra');

// Backend answers HTTP 401 both for a bad/expired token and for a missing
// role (code 1007 "You do not have that permission"); tell them apart by code.
const FORBIDDEN_CODES = [1007];

// Catalog provider endpoints answer 1007 until the account is a VERIFIED provider
// and has a token carrying the PROVIDER role.
export const notProviderMessage = () =>
  translate('errors.tai_khoan_chua_co_quyen');

type ErrorBody = { code?: number; message?: string } | null | undefined;

export class ApiError extends Error {
  status: number;
  code?: number;

  constructor(status: number, body: ErrorBody) {
    super(body?.message || (status >= 500 || status === 0 ? unreachableMessage() : `HTTP ${status}`));
    this.name = 'ApiError';
    this.code = body?.code;
    this.status = status === 401 && this.code !== undefined && FORBIDDEN_CODES.includes(this.code) ? 403 : status;
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return genericMessage();
}

// order-service error codes → messages a provider can act on.
const EVIDENCE_MESSAGES: Record<number, string> = {
  get 1008() {
    return translate('errors.chi_chuyen_gia_nhan_don');
  },
  get 2004() {
    return translate('errors.bang_chung_chi_ap_dung');
  },
  get 2021() {
    return translate('errors.chi_gui_duoc_bang_chung');
  },
  get 2022() {
    return translate('errors.vui_long_chon_giai_doan');
  },
  get 2023() {
    return translate('errors.vui_long_chup_hoac_chon');
  },
};

const CANCELLATION_MESSAGES: Record<number, string> = {
  get 2005() {
    return translate('errors.khong_the_huy_don_o');
  },
  get 3014() {
    return translate('errors.vui_long_chon_ly_do');
  },
  get 3015() {
    return translate('errors.don_nay_da_co_yeu');
  },
  get 3016() {
    return translate('errors.don_nay_chua_co_yeu');
  },
  get 3017() {
    return translate('errors.yeu_cau_huy_nay_da');
  },
  get 3018() {
    return translate('errors.ban_khong_the_tu_phan');
  },
  get 3019() {
    return translate('errors.vui_long_chon_dong_y');
  },
};

// payment-service codes. Its 3xxx range overlaps order-service's, so this map
// stays apart from the order ones (same copy as the web client's paymentApi.js).
const PAYMENT_MESSAGES: Record<number, string> = {
  get 1005() {
    return translate('errors.phien_dang_nhap_da_het');
  },
  get 1008() {
    return translate('errors.ban_khong_co_quyen_thanh');
  },
  get 2001() {
    return translate('errors.khong_tim_thay_don_hang');
  },
  get 2002() {
    return translate('errors.dich_vu_don_hang_dang');
  },
  get 3001() {
    return translate('errors.khong_tim_thay_giao_dich');
  },
  get 3002() {
    return translate('errors.don_nay_khong_con_o');
  },
  get 3003() {
    return translate('errors.don_nay_da_duoc_thanh');
  },
  get 3005() {
    return translate('errors.yeu_cau_thanh_toan_bi');
  },
  get 3007() {
    return translate('errors.cong_thanh_toan_nay_chua');
  },
  get 3009() {
    return translate('errors.khung_gio_da_het_thoi');
  },
  get 3012() {
    return translate('errors.so_tien_nam_ngoai_han');
  },
  get 3301() {
    return translate('errors.cong_thanh_toan_tam_thoi');
  },
};

// catalog-service codes for rules, slots, service status and ownership.
const CATALOG_MESSAGES: Record<number, string> = {
  get 1017() {
    return translate('errors.gio_ket_thuc_phai_sau');
  },
  get 1021() {
    return translate('errors.khung_gio_nay_khong_con');
  },
  get 1022() {
    return translate('errors.khung_gio_nay_da_qua');
  },
  get 1024() {
    return translate('errors.khung_gio_vua_co_nguoi');
  },
  get 1025() {
    return translate('errors.ban_khong_phai_chu_dich');
  },
  get 1026() {
    return translate('errors.trang_thai_dich_vu_khong');
  },
  get 1027() {
    return translate('errors.thoi_luong_moi_luot_phai');
  },
  get 1028() {
    return translate('errors.ngay_trong_tuan_khong_hop');
  },
};

function mappedMessage(err: unknown, messages: Record<number, string>, fallback: string): string {
  const apiErr = err instanceof ApiError ? err : null;
  return (apiErr?.code !== undefined && messages[apiErr.code]) || (err instanceof Error && err.message) || fallback;
}

export function evidenceErrorMessage(err: unknown): string {
  return mappedMessage(err, EVIDENCE_MESSAGES, translate('errors.khong_gui_duoc_bang_chung'));
}

export function cancellationErrorMessage(err: unknown): string {
  return mappedMessage(err, CANCELLATION_MESSAGES, translate('errors.khong_xu_ly_duoc_yeu'));
}

export function catalogErrorMessage(err: unknown): string {
  return mappedMessage(err, CATALOG_MESSAGES, translate('errors.khong_luu_duoc_thay_doi'));
}

// 403 also means "not the owner of this service" (1025); only a missing
// role (1007, or no code) means the account is not a provider yet.
export function isNotProvider(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403 && (err.code === undefined || FORBIDDEN_CODES.includes(err.code));
}

export function paymentErrorMessage(err: unknown): string {
  return mappedMessage(err, PAYMENT_MESSAGES, translate('errors.khong_thuc_hien_duoc_thanh'));
}
