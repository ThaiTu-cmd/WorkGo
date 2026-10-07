import type { Page } from "../api-client";
import type { PostFormData } from "../schemas/post";

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

// Live Persistence Engine for Posts
const livePosts: PostItem[] = [
  {
    postId: "post-101",
    title: "Thiết kế giao diện website thương mại điện tử chuẩn Brand và Responsive",
    description:
      "Cần tìm Senior UI/UX Designer thiết kế hệ thống giao diện 12 màn hình chính cho website thương mại điện tử chuyên đồ gia dụng. Yêu cầu bàn giao Figma Design System và component tokens hoàn chỉnh.",
    categoryId: "cat-1",
    categoryName: "Thiết kế & Đồ họa",
    budgetMin: 5000000,
    budgetMax: 10000000,
    executionType: "DIGITAL",
    locationSnapshot: "Trực tuyến",
    deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: ["spec_v1.pdf", "brand_guidelines.png"],
    status: "OPEN",
    client: {
      userId: "u-client-1",
      name: "Trần Anh Khoa",
      avatarUrl: null,
      ratingAvg: 4.9,
      completedOrders: 14,
      responseTime: "Trong vòng 1 giờ",
    },
    proposalsCount: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    postId: "post-102",
    title: "Phát triển ứng dụng di động Flutter kết nối hệ thống Backend Spring Boot",
    description:
      "Dự án cần phát triển ứng dụng di động đa nền tảng iOS & Android tích hợp thanh toán VnPay, bản đồ định vị thời gian thực và quản lý đơn hàng. Đã có sẵn tài liệu Swagger API chi tiết.",
    categoryId: "cat-2",
    categoryName: "Lập trình & Công nghệ",
    budgetMin: 15000000,
    budgetMax: 25000000,
    executionType: "DIGITAL",
    locationSnapshot: "Trực tuyến",
    deadlineAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: ["swagger_api.json"],
    status: "OPEN",
    client: {
      userId: "u-client-2",
      name: "Nguyễn Minh Châu",
      avatarUrl: null,
      ratingAvg: 5.0,
      completedOrders: 8,
      responseTime: "Trong vòng 30 phút",
    },
    proposalsCount: 5,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    postId: "post-103",
    title: "Bảo dưỡng và vệ sinh 5 máy lạnh công nghiệp tại văn phòng Quận 1",
    description:
      "Yêu cầu thợ kỹ thuật có chứng chỉ điện lạnh đến vệ sinh, nạp gas và kiểm tra toàn diện 5 máy lạnh Daikin âm trần tại toà nhà văn phòng Phường Bến Nghé, Quận 1. Đảm bảo vệ sinh sạch sẽ, không ảnh hưởng sàn gỗ.",
    categoryId: "cat-5",
    categoryName: "Sửa chữa & Kỹ thuật tại nhà",
    budgetMin: 1500000,
    budgetMax: 2500000,
    executionType: "ONSITE",
    locationSnapshot: "Số 36 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    deadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [],
    status: "OPEN",
    client: {
      userId: "u-client-3",
      name: "Công ty Cổ phần TechGo",
      avatarUrl: null,
      ratingAvg: 4.8,
      completedOrders: 25,
      responseTime: "Trong vòng 2 giờ",
    },
    proposalsCount: 2,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

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
    await new Promise((resolve) => setTimeout(resolve, 80));

    let filtered = [...livePosts];

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
    await new Promise((resolve) => setTimeout(resolve, 50));
    const found = livePosts.find((p) => p.postId === id);
    return found || null;
  },

  async getMyPosts(): Promise<PostItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return livePosts;
  },

  async create(data: PostFormData): Promise<PostItem> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const newPost: PostItem = {
      postId: `post-${Date.now()}`,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      categoryName:
        data.categoryId === "cat-1"
          ? "Thiết kế & Đồ họa"
          : data.categoryId === "cat-2"
          ? "Lập trình & Công nghệ"
          : "Dịch vụ chuyên nghiệp",
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

    livePosts.unshift(newPost);
    return newPost;
  },

  async update(id: string, data: Partial<PostFormData>): Promise<PostItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const index = livePosts.findIndex((p) => p.postId === id);
    if (index === -1) throw new Error("Không tìm thấy bài đăng.");

    livePosts[index] = {
      ...livePosts[index],
      ...data,
      deadlineAt: data.deadlineAt
        ? new Date(data.deadlineAt).toISOString()
        : livePosts[index].deadlineAt,
    };
    return livePosts[index];
  },

  async close(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const post = livePosts.find((p) => p.postId === id);
    if (post) {
      post.status = "CLOSED";
    }
  },

  incrementProposalCount(postId: string) {
    const post = livePosts.find((p) => p.postId === postId);
    if (post) {
      post.proposalsCount += 1;
    }
  },
};
