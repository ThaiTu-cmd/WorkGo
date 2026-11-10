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

export function evidenceErrorMessage(err: unknown): string {
  const apiErr = err instanceof ApiError ? err : null;
  return (
    (apiErr?.code !== undefined && EVIDENCE_MESSAGES[apiErr.code]) ||
    (err instanceof Error && err.message) ||
    'Không gửi được bằng chứng. Vui lòng thử lại.'
  );
}
