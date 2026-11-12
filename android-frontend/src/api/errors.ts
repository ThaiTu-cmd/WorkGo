// Error model shared by every API module. Rules mirror the web client
// (website-frontend/src/_webapp-mirror/api/axiosClient.js).

// No JSON body on a 5xx / a failed fetch means the gateway or service never
// answered, not a business error from the API.
export const UNREACHABLE_MESSAGE = 'Không kết nối được máy chủ. Vui lòng thử lại.';

const GENERIC_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

// Backend answers HTTP 401 both for a bad/expired token and for a missing
// role (code 1007 "You do not have that permission"); tell them apart by code.
const FORBIDDEN_CODES = [1007];

// Catalog provider endpoints answer 1007 until the account is a VERIFIED provider
// and has a token carrying the PROVIDER role.
export const NOT_PROVIDER_MESSAGE =
  'Tài khoản chưa có quyền Chuyên gia. Hãy gửi hồ sơ ở mục "Làm Provider" và chờ admin duyệt; ' +
  'nếu vừa được duyệt, hãy bấm "Cập nhật quyền".';

type ErrorBody = { code?: number; message?: string } | null | undefined;

export class ApiError extends Error {
  status: number;
  code?: number;

  constructor(status: number, body: ErrorBody) {
    super(body?.message || (status >= 500 || status === 0 ? UNREACHABLE_MESSAGE : `HTTP ${status}`));
    this.name = 'ApiError';
    this.code = body?.code;
    this.status = status === 401 && this.code !== undefined && FORBIDDEN_CODES.includes(this.code) ? 403 : status;
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return GENERIC_MESSAGE;
}

// order-service error codes → messages a provider can act on.
const EVIDENCE_MESSAGES: Record<number, string> = {
  1008: 'Chỉ chuyên gia nhận đơn này mới được gửi bằng chứng.',
  2004: 'Bằng chứng chỉ áp dụng cho dịch vụ tại nhà.',
  2021: 'Chỉ gửi được bằng chứng khi đơn đang được thực hiện tại nhà.',
  2022: 'Vui lòng chọn giai đoạn của bằng chứng.',
  2023: 'Vui lòng chụp hoặc chọn một ảnh.',
};

const CANCELLATION_MESSAGES: Record<number, string> = {
  2005: 'Không thể huỷ đơn ở trạng thái hiện tại.',
  3014: 'Vui lòng chọn lý do huỷ.',
  3015: 'Đơn này đã có yêu cầu huỷ.',
  3016: 'Đơn này chưa có yêu cầu huỷ.',
  3017: 'Yêu cầu huỷ này đã được xử lý.',
  3018: 'Bạn không thể tự phản hồi yêu cầu huỷ của mình.',
  3019: 'Vui lòng chọn đồng ý hoặc từ chối.',
};

// payment-service codes. Its 3xxx range overlaps order-service's, so this map
// stays apart from the order ones (same copy as the web client's paymentApi.js).
const PAYMENT_MESSAGES: Record<number, string> = {
  1005: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  1008: 'Bạn không có quyền thanh toán đơn này.',
  2001: 'Không tìm thấy đơn hàng cần thanh toán.',
  2002: 'Dịch vụ đơn hàng đang bận. Vui lòng thử lại sau ít phút.',
  3001: 'Không tìm thấy giao dịch thanh toán.',
  3002: 'Đơn này không còn ở trạng thái chờ thanh toán.',
  3003: 'Đơn này đã được thanh toán.',
  3005: 'Yêu cầu thanh toán bị trùng. Vui lòng thử lại.',
  3007: 'Cổng thanh toán này chưa được hỗ trợ.',
  3009: 'Khung giờ đã hết thời gian giữ chỗ. Vui lòng đặt đơn mới.',
  3012: 'Số tiền nằm ngoài hạn mức của cổng thanh toán này. Hãy chọn cổng khác.',
  3301: 'Cổng thanh toán tạm thời không phản hồi. Vui lòng thử lại hoặc chọn cổng khác.',
};

// catalog-service codes for rules, slots, service status and ownership.
const CATALOG_MESSAGES: Record<number, string> = {
  1017: 'Giờ kết thúc phải sau giờ bắt đầu.',
  1021: 'Khung giờ này không còn trống. Vui lòng chọn khung giờ khác.',
  1022: 'Khung giờ này đã qua.',
  1024: 'Khung giờ vừa có người đặt. Vui lòng chọn lại.',
  1025: 'Bạn không phải chủ dịch vụ này.',
  1026: 'Trạng thái dịch vụ không hợp lệ.',
  1027: 'Thời lượng mỗi lượt phải lớn hơn 0.',
  1028: 'Ngày trong tuần không hợp lệ.',
};

function mappedMessage(err: unknown, messages: Record<number, string>, fallback: string): string {
  const apiErr = err instanceof ApiError ? err : null;
  return (apiErr?.code !== undefined && messages[apiErr.code]) || (err instanceof Error && err.message) || fallback;
}

export function evidenceErrorMessage(err: unknown): string {
  return mappedMessage(err, EVIDENCE_MESSAGES, 'Không gửi được bằng chứng. Vui lòng thử lại.');
}

export function cancellationErrorMessage(err: unknown): string {
  return mappedMessage(err, CANCELLATION_MESSAGES, 'Không xử lý được yêu cầu huỷ. Vui lòng thử lại.');
}

export function catalogErrorMessage(err: unknown): string {
  return mappedMessage(err, CATALOG_MESSAGES, 'Không lưu được thay đổi. Vui lòng thử lại.');
}

// 403 also means "not the owner of this service" (1025); only a missing
// role (1007, or no code) means the account is not a provider yet.
export function isNotProvider(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403 && (err.code === undefined || FORBIDDEN_CODES.includes(err.code));
}

export function paymentErrorMessage(err: unknown): string {
  return mappedMessage(err, PAYMENT_MESSAGES, 'Không thực hiện được thanh toán. Vui lòng thử lại.');
}
