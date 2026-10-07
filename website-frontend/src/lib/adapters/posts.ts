// BLOCKED BY BACKEND: Posts domain endpoints are not yet implemented in backend (xlsx 53-61)

import { MOCK_POSTS, type MockPostItem } from "../mocks/fixtures";
import type { Page } from "../api-client";
import type { PostFormData } from "../schemas/post";

export type PostItem = MockPostItem;

const localPosts: MockPostItem[] = [...MOCK_POSTS];

export const postsApi = {
  async list(filters: {
    q?: string;
    category?: string;
    executionType?: string;
    budgetMin?: number;
    budgetMax?: number;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Page<PostItem>> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    let filtered = [...localPosts];

    if (filters.q) {
      const q = filters.q.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      filtered = filtered.filter((p) => p.categoryId === filters.category);
    }

    if (filters.executionType) {
      filtered = filtered.filter((p) => p.executionType === filters.executionType);
    }

    if (filters.budgetMin !== undefined) {
      filtered = filtered.filter((p) => p.budgetMax >= (filters.budgetMin || 0));
    }

    if (filters.budgetMax !== undefined) {
      filtered = filtered.filter((p) => p.budgetMin <= (filters.budgetMax || Infinity));
    }

    if (filters.sort === "budget_high") {
      filtered.sort((a, b) => b.budgetMax - a.budgetMax);
    } else if (filters.sort === "budget_low") {
      filtered.sort((a, b) => a.budgetMin - b.budgetMin);
    } else {
      // Default: newest
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 6;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  async get(id: string): Promise<PostItem | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const found = localPosts.find((p) => p.postId === id);
    return found || null;
  },

  async getMyPosts(): Promise<PostItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return localPosts;
  },

  async create(data: PostFormData): Promise<PostItem> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newPost: PostItem = {
      postId: `post-${Date.now()}`,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      categoryName: data.categoryId === "cat-1" ? "Thiết kế & Đồ họa" : "Dịch vụ chung",
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      executionType: data.executionType,
      locationSnapshot: data.locationSnapshot || "Trực tuyến",
      deadlineAt: new Date(data.deadlineAt).toISOString(),
      attachments: data.attachments || [],
      status: "OPEN",
      client: {
        userId: "current-user",
        name: "Tôi (Bạn)",
        avatarUrl: null,
        ratingAvg: 5.0,
        completedOrders: 0,
        responseTime: "Mới đăng",
      },
      proposalsCount: 0,
      createdAt: new Date().toISOString(),
    };

    localPosts.unshift(newPost);
    return newPost;
  },

  async update(id: string, data: Partial<PostFormData>): Promise<PostItem> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = localPosts.findIndex((p) => p.postId === id);
    if (index === -1) throw new Error("Không tìm thấy bài đăng.");

    localPosts[index] = {
      ...localPosts[index],
      ...data,
      deadlineAt: data.deadlineAt ? new Date(data.deadlineAt).toISOString() : localPosts[index].deadlineAt,
    };
    return localPosts[index];
  },

  async close(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const post = localPosts.find((p) => p.postId === id);
    if (post) {
      post.status = "CLOSED";
    }
  },
};
