import { API_BASE_URL } from '@/lib/env';

import { ApiError } from './errors';

type Params = Record<string, string | number | boolean | undefined | null>;

type ClientHooks = {
  getToken: () => string | null;
  getSessionVersion?: () => number;
  // Receives the token the failed request carried, which may already have
  // been replaced by a refresh.
  onUnauthorized: (sentToken: string) => void;
};

// The session layer plugs in here (AuthProvider), so this module never
// imports auth state.
let hooks: ClientHooks = { getToken: () => null, onUnauthorized: () => {} };

export function configureClient(next: ClientHooks): void {
  hooks = next;
}

function queryString(params?: Params): string {
  if (!params) return '';
  const pairs = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (pairs.length === 0) return '';
  return `?${new URLSearchParams(pairs.map(([k, v]) => [k, String(v)]))}`;
}

export type RequestOpts = { params?: Params; headers?: Record<string, string>; timeoutMs?: number; signal?: AbortSignal };

const DEFAULT_TIMEOUT_MS = 15_000;

async function request<T>(
  method: string,
  path: string,
  { params, data, headers: extra, timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal }: RequestOpts & { data?: unknown } = {}
): Promise<T> {
  const multipart = data instanceof FormData;
  const headers: Record<string, string> = multipart ? { ...extra } : { 'Content-Type': 'application/json', ...extra };
  const token = hooks.getToken();
  const session = hooks.getSessionVersion?.() ?? token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  else callerSignal?.addEventListener('abort', abort);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${queryString(params)}`, {
      method,
      headers,
      body: multipart ? data : JSON.stringify(data),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, null);
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abort);
  }

  const body = await res.json().catch(() => null);
  if (session !== (hooks.getSessionVersion?.() ?? hooks.getToken())) throw new ApiError(401, { message: 'Session changed' });
  if (!res.ok) {
    const error = new ApiError(res.status, body);
    if (error.status === 401 && token) hooks.onUnauthorized(token);
    throw error;
  }
  return body as T;
}

export const http = {
  get: <T>(path: string, opts: RequestOpts = {}) => request<T>('GET', path, opts),
  post: <T>(path: string, data?: unknown, opts: RequestOpts = {}) => request<T>('POST', path, { ...opts, data }),
  put: <T>(path: string, data?: unknown, opts: RequestOpts = {}) => request<T>('PUT', path, { ...opts, data }),
  patch: <T>(path: string, data?: unknown, opts: RequestOpts = {}) => request<T>('PATCH', path, { ...opts, data }),
  delete: <T>(path: string, opts: RequestOpts = {}) => request<T>('DELETE', path, opts),
};
