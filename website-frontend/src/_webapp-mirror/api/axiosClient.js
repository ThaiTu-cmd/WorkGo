// Live client: calls the API gateway through the Next rewrite at /api/v1.
// Kept the `axiosClient` name/shape (get/post resolving to the response body)
// so existing callers keep working without adding the axios dependency.

const BASE_URL = '/api/v1';
const TOKEN_KEY = 'accessToken';
const GENERATION_KEY = 'workgo.sessionGeneration';
let memoryGeneration = null;
export const getSessionGeneration = () => {
  try { memoryGeneration = localStorage.getItem(GENERATION_KEY) || memoryGeneration; } catch { /* storage unavailable */ }
  if (!memoryGeneration) memoryGeneration = crypto.randomUUID();
  return memoryGeneration;
};

export const getAccessToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

let sessionVersion = 0;
const writeAccessToken = (token) => {
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

export const setAccessToken = (token) => {
  if (!token || getAccessToken() !== token) {
    sessionVersion++;
    memoryGeneration = crypto.randomUUID();
    try { localStorage.setItem(GENERATION_KEY, memoryGeneration); } catch { /* in-memory generation */ }
  }
  writeAccessToken(token);
};
// Rotation/adoption keeps the generation whose HttpOnly cookie the BFF issued.
export const adoptAccessToken = (token) => writeAccessToken(token);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY || event.key === GENERATION_KEY || event.key === null) sessionVersion++;
  });
}

const sessionChanged = () => new ApiError(401, { code: 'SESSION_CHANGED', message: 'Phiên đăng nhập đã thay đổi. Vui lòng tải lại dữ liệu.' });

// Backend answers HTTP 401 both for a bad/expired token and for a missing
// role (code 1007 "You do not have that permission"); tell them apart by code.
export const FORBIDDEN_CODES = [1007];

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

const AUTH_GUARD_PATHS = [
  '/identity/users/myInfo',
  '/identity/providers',
  '/identity/provider-verifications',
];

export function isAuthGuarded(url) {
  return AUTH_GUARD_PATHS.some((path) => url.startsWith(path));
}

let refreshFlight = null;
const ROTATION_KEY = 'workgo.pendingRotation';

async function tryRefreshToken(oldToken, version) {
  if (!refreshFlight || refreshFlight.version !== version) {
    const flight = { version, promise: null };
    const generation = getSessionGeneration();
    refreshFlight = flight;
    flight.promise = (async () => {
      try {
        if (version !== sessionVersion || generation !== getSessionGeneration()) throw sessionChanged();
        if (getAccessToken() !== oldToken) return { token: getAccessToken() };
        try {
          if (localStorage.getItem(ROTATION_KEY) === generation) throw new ApiError(503, { message: 'Refresh outcome unknown. Sign in again.' });
          localStorage.setItem(ROTATION_KEY, generation);
        } catch (error) { if (error instanceof ApiError) throw error; }
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WorkGo-Session': generation },
          body: '{}', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
        });
        if (res.status === 401) return null;
        if (!res.ok) throw new ApiError(res.status, null);
        const body = await res.json().catch(() => null);
        const renewed = body?.result?.token;
        if (!renewed) throw new ApiError(503, null);
        if (version !== sessionVersion || generation !== getSessionGeneration()) throw sessionChanged();
        writeAccessToken(renewed);
        try { if (localStorage.getItem(ROTATION_KEY) === generation) localStorage.removeItem(ROTATION_KEY); } catch { /* storage unavailable */ }
        return body.result;
      } catch (error) {
        throw error instanceof ApiError ? error : new ApiError(0, null);
      } finally {
        if (refreshFlight === flight) refreshFlight = null;
      }
    });
    const locks = globalThis.navigator?.locks;
    flight.promise = locks ? locks.request(`workgo-refresh-${generation}`, flight.promise) : flight.promise();
    return flight.promise;
  }
  return refreshFlight.promise;
}

export async function refreshSession() {
  const result = await tryRefreshToken(getAccessToken(), sessionVersion);
  if (!result) { setAccessToken(null); throw new ApiError(401, null); }
  return { code: 1000, result };
}

const isAuthEndpoint = (url) =>
  url.startsWith('/identity/auth/token') ||
  url.startsWith('/identity/auth/refresh') ||
  url.startsWith('/identity/users/registration');

async function request(method, url, { params, data, headers: extraHeaders, responseType } = {}, isRetry = false) {
  const token = getAccessToken();
  const version = sessionVersion;
  const generation = getSessionGeneration();

  // Guard: Avoid firing unauthenticated requests to protected identity endpoints
  if (!token && isAuthGuarded(url)) {
    return null;
  }

  const query = params ? `?${new URLSearchParams(params)}` : '';
  const multipart = data instanceof FormData;
  const headers = multipart ? { ...extraHeaders } : { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    const authRoute = { '/identity/auth/token': 'login', '/identity/auth/refresh': 'refresh', '/identity/auth/logout': 'logout' }[url];
    if (authRoute) headers['X-WorkGo-Session'] = extraHeaders?.['X-WorkGo-Session'] || generation;
    res = await fetch(authRoute ? `/api/auth/${authRoute}` : `${BASE_URL}${url}${query}`, {
      method,
      headers,
      body: authRoute === 'refresh' ? '{}' : multipart || data === undefined ? data : JSON.stringify(data),
      credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(0, null);
  }
  const contentType = res.headers.get('content-type') || '';
  const body = (responseType === 'blob' || responseType === 'audit-page') && res.ok ? await res.blob() : await res.json().catch(() => null);
  if (version !== sessionVersion || generation !== getSessionGeneration()) throw sessionChanged();
  if (!res.ok) {
    const error = new ApiError(res.status, body, contentType);
    if (error.status === 401) {
      if (token && !isRetry && !isAuthEndpoint(url)) {
        const newToken = getAccessToken() !== token ? getAccessToken() : (await tryRefreshToken(token, version))?.token;
        if (version !== sessionVersion || generation !== getSessionGeneration()) throw sessionChanged();
        if (newToken) {
          writeAccessToken(newToken);
          return request(method, url, { params, data, headers: extraHeaders, responseType }, true);
        }
      }
      if (token) setAccessToken(null);
      // Suppress unhandled 401 rejection only for GET background/guest reads to guarded identity endpoints
      if (method.toUpperCase() === 'GET' && isAuthGuarded(url)) {
        return null;
      }
    }
    throw error;
  }
  return responseType === 'audit-page' ? { blob: body, nextCursor: res.headers.get('X-Next-Cursor'), contentType } : body;
}

const axiosClient = {
  get: (url, config = {}) => request('GET', url, config),
  post: (url, data, config = {}) => request('POST', url, { ...config, data }),
  put: (url, data, config = {}) => request('PUT', url, { ...config, data }),
  patch: (url, data, config = {}) => request('PATCH', url, { ...config, data }),
  delete: (url, config = {}) => request('DELETE', url, config),
};

export default axiosClient;
