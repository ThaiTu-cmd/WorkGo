// website-frontend/src/lib/adapters/backend-routes.ts
// Single source of truth cho backend paths.
// LƯU Ý: posts/wallet/payments CHƯA có backend (job/payment-service còn skeleton, gateway chỉ route identity).
// Adapter gọi đúng route này; khi gateway trả 404/503 thì UI Empty/Error trung thực — CẤM fallback dữ liệu giả.
export const API_V1 = "/api/v1" as const;

export const backendRoutes = {
  posts: {
    base: `${API_V1}/posts`,
    list: (qs: string) => `${API_V1}/posts${qs ? `?${qs}` : ""}`,
    detail: (id: string) => `${API_V1}/posts/${encodeURIComponent(id)}`,
    my: `${API_V1}/posts/my`,
    close: (id: string) => `${API_V1}/posts/${encodeURIComponent(id)}/close`,
  },
  proposals: {
    base: `${API_V1}/proposals`,
    forPost: (postId: string) => `${API_V1}/posts/${encodeURIComponent(postId)}/proposals`,
    myApplications: (qs: string) => `${API_V1}/proposals/my${qs ? `?${qs}` : ""}`,
    detail: (id: string) => `${API_V1}/proposals/${encodeURIComponent(id)}`,
    accept: (id: string) => `${API_V1}/proposals/${encodeURIComponent(id)}/accept`,
    reject: (id: string) => `${API_V1}/proposals/${encodeURIComponent(id)}/reject`,
    hasApplied: (postId: string) => `${API_V1}/posts/${encodeURIComponent(postId)}/proposals/applied`,
  },
  wallet: {
    summary: `${API_V1}/wallet/summary`,
    banks: `${API_V1}/wallet/banks`,
    payoutAccounts: `${API_V1}/wallet/payout-accounts`,
    payoutDefault: (id: string) => `${API_V1}/wallet/payout-accounts/${encodeURIComponent(id)}/default`,
  },
  payments: {
    deposit: `${API_V1}/payments/deposit`,
  },
} as const;
