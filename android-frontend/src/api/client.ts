import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8888';

export class ApiError extends Error {
  constructor(
    public code: string,
    public messageVi: string,
    public status: number
  ) {
    super(messageVi);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export async function getStoredToken(key: string): Promise<string | null> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {
    // secure store fallback
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

export async function setStoredToken(key: string, value: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    // secure store fallback
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

export async function removeStoredToken(key: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch {
    // secure store fallback
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getStoredToken('wg_rt');
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE_URL}/api/v1/identity/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!res.ok) {
        await removeStoredToken('wg_at');
        await removeStoredToken('wg_rt');
        return null;
      }

      const json = (await res.json()) as ApiResponse<{ token: string; refreshToken?: string }>;
      if (json.code === 1000 && json.result?.token) {
        await setStoredToken('wg_at', json.result.token);
        if (json.result.refreshToken) {
          await setStoredToken('wg_rt', json.result.refreshToken);
        }
        return json.result.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  opts: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    idempotencyKey?: string;
    timeoutMs?: number;
    retryCount?: number;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    idempotencyKey,
    timeoutMs = 8000,
    retryCount = 0,
    signal,
  } = opts;

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const token = await getStoredToken('wg_at');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 token refresh once
    if (res.status === 401 && retryCount === 0) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, { ...opts, retryCount: retryCount + 1 });
      }
      throw new ApiError('AUTH_UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }

    if (!res.ok) {
      let errorMsg = `Lỗi máy chủ (${res.status})`;
      try {
        const errorJson = await res.json();
        if (errorJson.message) errorMsg = errorJson.message;
      } catch {
        // ignore
      }
      throw new ApiError(`HTTP_${res.status}`, errorMsg, res.status);
    }

    const json = (await res.json()) as ApiResponse<T>;
    if (json.code !== 1000) {
      throw new ApiError(
        String(json.code),
        json.message || 'Hệ thống phản hồi không thành công',
        res.status
      );
    }

    return json.result;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (signal?.aborted) {
      throw new ApiError('ABORTED', 'Yêu cầu đã bị hủy.', 0);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'Yêu cầu hết thời gian chờ (timeout). Vui lòng thử lại.', 408);
    }
    const message = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
    throw new ApiError('NETWORK_ERROR', message, 0);
  }
}
