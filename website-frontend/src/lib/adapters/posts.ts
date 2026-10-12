import { apiFetch, normalizeSpringPage, type Envelope, type Page, type SpringPageResponse } from "../api-client";
import type { PostFormData } from "../schemas/post";
import { backendRoutes } from "./backend-routes";

export type ExecutionType =
  | "DIGITAL"
  | "ONSITE"
  | "DELIVERY"
  | "APPOINTMENT"
  | "HOURLY"
  | "PROJECT";

export type PostStatus = "OPEN" | "PAUSED" | "CLOSED";

export interface PostClientInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
  ratingAvg: number;
  completedOrders: number;
  responseTime: string;
}

export interface PostItem {
  postId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  budgetMin: number;
  budgetMax: number;
  executionType: ExecutionType;
  locationSnapshot: string;
  deadlineAt: string;
  attachments: string[];
  status: PostStatus;
  client: PostClientInfo;
  proposalsCount: number;
  createdAt: string;
}

export interface PostFilters {
  q?: string;
  category?: string;
  executionType?: string;
  budgetMin?: number;
  budgetMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

function toQuery(f: PostFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.executionType) p.set("executionType", f.executionType);
  if (f.budgetMin !== undefined) p.set("budgetMin", String(f.budgetMin));
  if (f.budgetMax !== undefined) p.set("budgetMax", String(f.budgetMax));
  if (f.sort) p.set("sort", f.sort);
  p.set("page", String((f.page ?? 1) - 1));
  p.set("size", String(f.limit ?? 6));
  return p.toString();
}

function unwrap<T>(res: Envelope<T> | T): T {
  return (res && typeof res === "object" && "result" in (res as object) ? (res as Envelope<T>).result as T : res as T);
}

export const postsApi = {
  async list(filters: PostFilters = {}, token?: string, opts?: { signal?: AbortSignal }): Promise<Page<PostItem>> {
    const res = await apiFetch<Envelope<SpringPageResponse<PostItem>> | SpringPageResponse<PostItem>>(
      backendRoutes.posts.list(toQuery(filters)),
      { token, signal: opts?.signal }
    );
    const page = unwrap(res);
    const normalized = normalizeSpringPage(page);
    return { data: normalized.data, meta: { ...normalized.meta, page: normalized.meta.page + 1 } };
  },
  async get(id: string, token?: string): Promise<PostItem | null> {
    try {
      const res = await apiFetch<Envelope<PostItem> | PostItem>(backendRoutes.posts.detail(id), { token });
      return unwrap(res) ?? null;
    } catch (e: unknown) {
      if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 404) return null;
      throw e;
    }
  },
  // FIX CỐT LÕI cho bug "tài khoản mới có 3 bài": gọi scope /my kèm auth, không trả mảng toàn cục.
  async getMyPosts(token?: string): Promise<PostItem[]> {
    const res = await apiFetch<Envelope<PostItem[]> | PostItem[]>(backendRoutes.posts.my, { token });
    return unwrap(res) ?? [];
  },
  async create(data: PostFormData, token?: string): Promise<PostItem> {
    const res = await apiFetch<Envelope<PostItem> | PostItem>(backendRoutes.posts.base, { method: "POST", body: data, token });
    return unwrap(res);
  },
  async update(id: string, data: Partial<PostFormData>, token?: string): Promise<PostItem> {
    const res = await apiFetch<Envelope<PostItem> | PostItem>(backendRoutes.posts.detail(id), { method: "PUT", body: data, token });
    return unwrap(res);
  },
  async close(id: string, token?: string): Promise<void> {
    await apiFetch<void>(backendRoutes.posts.close(id), { method: "POST", token });
  },
  incrementProposalCount(_postId: string): void {
    void _postId;
    // Deprecated no-op: server là nguồn đếm duy nhất. Giữ để không vỡ import cũ ở proposals.ts/UI.
  },
};
