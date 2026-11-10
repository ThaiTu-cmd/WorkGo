// Live client: calls the API gateway through the Next rewrite at /api/v1.
// Kept the `axiosClient` name/shape (get/post resolving to the response body)
// so existing callers keep working without adding the axios dependency.

const BASE_URL = '/api/v1';
const TOKEN_KEY = 'accessToken';

export const getAccessToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked — token lives only for this request cycle
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('workgo-auth-changed'));
  }
};

// Backend answers HTTP 401 both for a bad/expired token and for a missing
// role (code 1007 "You do not have that permission"); tell them apart by code.
const FORBIDDEN_CODES = [1007];

// Catalog provider endpoints answer 1007 until the account is a VERIFIED provider
// and has signed in again (the PROVIDER role and providerId live in the token).
export const NOT_PROVIDER_MESSAGE =
  'Tài khoản chưa có quyền Chuyên gia. Hãy gửi hồ sơ ở mục "Làm Provider" và chờ admin duyệt; ' +
  'nếu vừa được duyệt, hãy đăng xuất rồi đăng nhập lại.';

// No JSON body on a 5xx means the gateway / service never answered
// (e.g. backend not running), not a business error from the API.
const UNREACHABLE_MESSAGE = 'Không kết nối được máy chủ. Vui lòng kiểm tra backend rồi thử lại.';

const API_NOT_FOUND_MESSAGE =
  'Không tìm thấy API (HTTP 404). Có thể API Gateway đang trỏ tới một dịch vụ khác ' +
  'hoặc identity-service chưa chạy. Vui lòng kiểm tra API Gateway và identity-service.';

export function buildApiErrorMessage(status, body, contentType = '') {
  if (body?.message) return body.message;
  if (status === 0 || status >= 500) return UNREACHABLE_MESSAGE;
  if (status === 404 && !String(contentType).includes('application/json')) {
    return API_NOT_FOUND_MESSAGE;
  }
  return `HTTP ${status}`;
}

export class ApiError extends Error {
  constructor(status, body, contentType = '') {
    super(buildApiErrorMessage(status, body, contentType));
    this.code = body?.code;
    this.status = status === 401 && FORBIDDEN_CODES.includes(this.code) ? 403 : status;
  }
}

async function request(method, url, { params, data } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${url}${query}`, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new ApiError(0, null);
  }
  const contentType = res.headers.get('content-type') || '';
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new ApiError(res.status, body, contentType);
    if (error.status === 401 && token) setAccessToken(null);
    throw error;
  }
  return body;
}

const axiosClient = {
  get: (url, config = {}) => request('GET', url, config),
  post: (url, data, config = {}) => request('POST', url, { ...config, data }),
  put: (url, data, config = {}) => request('PUT', url, { ...config, data }),
  delete: (url, config = {}) => request('DELETE', url, config),
};

export default axiosClient;
