import { apiFetch } from './client';

export interface MobileProposalInput {
  price: number;
  estimatedDays: number;
  message: string;
}

interface Envelope<T> {
  code?: number;
  message?: string;
  result?: T;
}

function unwrap<T>(res: Envelope<T> | T): T {
  if (res && typeof res === 'object' && 'result' in (res as object)) {
    return (res as Envelope<T>).result as T;
  }
  return res as T;
}

export const proposalsApi = {
  async hasApplied(postId: string): Promise<boolean> {
    try {
      const res = await apiFetch<Envelope<boolean> | boolean>(
        `/api/v1/posts/${encodeURIComponent(postId)}/proposals/applied`
      );
      return Boolean(unwrap(res));
    } catch {
      return false;
    }
  },

  async submit(postId: string, data: MobileProposalInput): Promise<void> {
    await apiFetch(
      `/api/v1/posts/${encodeURIComponent(postId)}/proposals`,
      {
        method: 'POST',
        body: {
          price: data.price,
          estimated_days: data.estimatedDays,
          estimatedDays: data.estimatedDays,
          message: data.message,
        },
      }
    );
  },

  async myApplications(status?: string): Promise<unknown[]> {
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await apiFetch<Envelope<unknown[]> | unknown[]>(
        `/api/v1/proposals/my${qs}`
      );
      return (unwrap(res) as unknown[]) ?? [];
    } catch {
      return [];
    }
  },
};
