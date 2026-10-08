export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  addresses: {
    all: ["addresses"] as const,
    list: (page = 0, size = 10) => ["addresses", "list", { page, size }] as const,
    detail: (id: string) => ["addresses", "detail", id] as const,
  },
  provider: {
    myProfile: ["provider", "myProfile"] as const,
    detail: (id: string) => ["provider", "detail", id] as const,
  },
  catalog: {
    categories: ["catalog", "categories"] as const,
  },
  posts: {
    all: ["posts"] as const,
    list: (filters: Record<string, unknown>) => ["posts", "list", filters] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
    myPosts: ["posts", "myPosts"] as const,
  },
  proposals: {
    forPost: (postId: string) => ["proposals", "forPost", postId] as const,
    myApplications: (filters: Record<string, unknown>) =>
      ["proposals", "myApplications", filters] as const,
  },
  wallet: {
    summary: ["wallet", "summary"] as const,
    transactions: ["wallet", "transactions"] as const,
    payoutAccounts: ["wallet", "payoutAccounts"] as const,
  },
  trust: {
    orderContext: (orderId: string) => ["trust", "orderContext", orderId] as const,
    disputeDetail: (id: string) => ["trust", "dispute", id] as const,
  },
};
