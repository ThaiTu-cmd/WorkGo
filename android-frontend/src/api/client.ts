import { API_BASE_URL } from '@/lib/env';

import { ApiError } from './errors';

type Params = Record<string, string | number | boolean | undefined | null>;

type ClientHooks = {
  getToken: () => string | null;
  onUnauthorized: () => void;
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

async function request<T>(method: string, path: string, { params, data }: { params?: Params; data?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = hooks.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${queryString(params)}`, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new ApiError(0, null);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new ApiError(res.status, body);
    if (error.status === 401 && token) hooks.onUnauthorized();
    throw error;
  }
  return body as T;
}

export const http = {
  get: <T>(path: string, opts: { params?: Params } = {}) => request<T>('GET', path, opts),
  post: <T>(path: string, data?: unknown, opts: { params?: Params } = {}) => request<T>('POST', path, { ...opts, data }),
  put: <T>(path: string, data?: unknown, opts: { params?: Params } = {}) => request<T>('PUT', path, { ...opts, data }),
  delete: <T>(path: string, opts: { params?: Params } = {}) => request<T>('DELETE', path, opts),
};
