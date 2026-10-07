import { API_BASE_URL } from "./env";

export class ApiError extends Error {
  code: string | number;
  messageVi: string;
  messageEn: string;
  status: number;
  details?: unknown;

  constructor(
    code: string | number,
    messageVi: string,
    messageEn: string,
    status: number,
    details?: unknown
  ) {
    super(messageVi);
    this.name = "ApiError";
    this.code = code;
    this.messageVi = messageVi;
    this.messageEn = messageEn;
    this.status = status;
    this.details = details;
  }
}

export interface Envelope<T> {
  code: number;
  message: string;
  result?: T;
}

export interface Page<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SpringPageResponse<T> {
  totalPages: number;
  pageSize: number;
  totalElements: number;
  currentPage: number;
  data: T[];
}

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  idempotency?: boolean;
  token?: string;
  baseUrl?: string;
  _isRetry?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    cache = "no-store",
    idempotency = false,
    token,
    baseUrl = API_BASE_URL,
    _isRetry = false,
  } = options;

  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (idempotency && typeof crypto !== "undefined" && crypto.randomUUID) {
    reqHeaders["Idempotency-Key"] = crypto.randomUUID();
  }

  let url: string;
  const isBrowser = typeof window !== "undefined";

  if (path.startsWith("http")) {
    url = path;
  } else if (isBrowser) {
    // In browser: Route through BFF proxy to avoid CORS and inject httpOnly session cookie
    if (path.startsWith("/api/auth/")) {
      url = path;
    } else if (path.startsWith("/api/proxy/")) {
      url = path;
    } else if (path.startsWith("/api/")) {
      url = `/api/proxy/${path.slice(5)}`;
    } else if (path.startsWith("/catalog/")) {
      url = `/api/proxy${path}`;
    } else {
      url = path.startsWith("/") ? `/api/proxy${path}` : `/api/proxy/${path}`;
    }
  } else {
    // Server-side
    url = `${baseUrl}${path}`;
  }

  const credentialsMode: RequestCredentials = isBrowser && url.startsWith("/")
    ? "same-origin"
    : "omit";

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      cache,
      credentials: credentialsMode,
    });
  } catch (err) {
    throw new ApiError(
      "NETWORK_ERROR",
      "Không thể kết nối máy chủ.",
      "Cannot reach server.",
      0,
      err
    );
  }

  // Handle 401 Unauthorized with automatic token refresh
  if (response.status === 401) {
    if (isBrowser && !_isRetry && !path.includes("/api/auth/")) {
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json().catch(() => null);
          if (refreshData && refreshData.code !== "REFRESH_UNSUPPORTED" && refreshData.code !== 1006) {
            // Retry request once with new session cookie
            return await apiFetch<T>(path, { ...options, _isRetry: true });
          }
        }
      } catch {
        // Refresh failed, fall through to redirect
      }

      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        const locale = currentPath.split("/")[1] || "vi";
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/${locale}/login?next=${encodeURIComponent(currentPath)}`;
      }
    }

    throw new ApiError(
      1006,
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      "Session expired. Please log in again.",
      401
    );
  }

  let json: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errorBody = json as { code?: number | string; message?: string } | null;
    const errCode = errorBody?.code ?? response.status;
    const msg = errorBody?.message || "Yêu cầu không thành công.";
    throw new ApiError(errCode, msg, msg, response.status, json);
  }

  // Handle envelope responses
  if (json && typeof json === "object") {
    // If Spring ApiResponse envelope: { code: 1000, message: "...", result: T }
    if ("code" in json && "result" in json) {
      const envelope = json as Envelope<T>;
      if (envelope.code !== 1000) {
        throw new ApiError(
          envelope.code,
          envelope.message || "Yêu cầu thất bại.",
          envelope.message || "Request failed.",
          response.status,
          envelope
        );
      }
      return envelope.result as T;
    }
  }

  return json as T;
}

export function normalizeSpringPage<T>(springPage: SpringPageResponse<T>): Page<T> {
  return {
    data: springPage.data || [],
    meta: {
      page: springPage.currentPage,
      limit: springPage.pageSize,
      total: springPage.totalElements,
      totalPages: springPage.totalPages,
    },
  };
}
