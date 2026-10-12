import { apiFetch, ApiError } from './client';

export type ExecutionType =
  | 'DIGITAL'
  | 'ONSITE'
  | 'DELIVERY'
  | 'APPOINTMENT'
  | 'HOURLY'
  | 'PROJECT';

export type PostStatus = 'OPEN' | 'PAUSED' | 'CLOSED';

export interface MobilePostClient {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  ratingAvg?: number;
  completedOrders?: number;
  responseTime?: string;
}

export interface MobilePostItem {
  postId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  budgetMin: number;
  budgetMax: number;
  executionType: ExecutionType;
  locationSnapshot?: string;
  deadlineAt?: string;
  attachments?: string[];
  status: PostStatus;
  client?: MobilePostClient;
  proposalsCount?: number;
  createdAt?: string;
}

export interface MobilePostFilters {
  q?: string;
  category?: string;
  executionType?: string;
  budgetMin?: number;
  budgetMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface MobilePage<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

interface SpringPageResponse<T> {
  content?: T[];
  data?: T[];
  page?: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
  meta?: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
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

function toQuery(f: MobilePostFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.category) p.set('category', f.category);
  if (f.executionType) p.set('executionType', f.executionType);
  if (f.budgetMin !== undefined) p.set('budgetMin', String(f.budgetMin));
  if (f.budgetMax !== undefined) p.set('budgetMax', String(f.budgetMax));
  if (f.sort) p.set('sort', f.sort);
  // Backend Spring Data uses 0-based index
  p.set('page', String(Math.max(0, (f.page ?? 1) - 1)));
  p.set('size', String(f.limit ?? 10));
  return p.toString();
}

export const postsApi = {
  async list(
    filters: MobilePostFilters = {},
    opts?: { signal?: AbortSignal }
  ): Promise<MobilePage<MobilePostItem>> {
    try {
      const qs = toQuery(filters);
      const res = await apiFetch<Envelope<SpringPageResponse<MobilePostItem>> | SpringPageResponse<MobilePostItem>>(
        `/api/v1/posts${qs ? `?${qs}` : ''}`,
        { signal: opts?.signal }
      );
      const page = unwrap(res);
      const rawItems = page?.content || page?.data || [];
      const totalElements = page?.page?.totalElements ?? page?.meta?.total ?? rawItems.length;
      const size = page?.page?.size ?? page?.meta?.size ?? filters.limit ?? 10;
      const totalPages = page?.page?.totalPages ?? page?.meta?.totalPages ?? Math.ceil(totalElements / size);

      return {
        data: rawItems,
        meta: {
          page: (filters.page ?? 1),
          size,
          total: totalElements,
          totalPages,
        },
      };
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return {
          data: [],
          meta: {
            page: filters.page ?? 1,
            size: filters.limit ?? 10,
            total: 0,
            totalPages: 0,
          },
        };
      }
      throw err;
    }
  },

  async get(id: string): Promise<MobilePostItem | null> {
    try {
      const res = await apiFetch<Envelope<MobilePostItem> | MobilePostItem>(
        `/api/v1/posts/${encodeURIComponent(id)}`
      );
      return unwrap(res) ?? null;
    } catch {
      return null;
    }
  },

  async getMyPosts(): Promise<MobilePostItem[]> {
    try {
      const res = await apiFetch<Envelope<MobilePostItem[]> | MobilePostItem[]>(
        '/api/v1/posts/my'
      );
      return unwrap(res) ?? [];
    } catch {
      return [];
    }
  },

  async create(data: Partial<MobilePostItem>): Promise<MobilePostItem> {
    const res = await apiFetch<Envelope<MobilePostItem> | MobilePostItem>(
      '/api/v1/posts',
      { method: 'POST', body: data }
    );
    return unwrap(res);
  },

  async close(id: string): Promise<void> {
    await apiFetch<void>(
      `/api/v1/posts/${encodeURIComponent(id)}/close`,
      { method: 'POST' }
    );
  },
};
