import axiosClient from './axiosClient';

// Admin-only endpoints (backend checks hasRole('ADMIN') on the service layer).
// List endpoints answer ApiResponse<PageResponse{ data, totalElements, totalPages, currentPage }>.
export const adminApi = {
  // identity-service provider profiles. `status` is required: the backend
  // filters with an exact match, so a missing status returns nothing.
  listProviders: ({ status = 'PENDING', page = 0, size = 10 } = {}) =>
    axiosClient.get('/identity/providers', { params: { status, page, size } }),
  // status: VERIFIED | REJECTED | SUSPENDED. VERIFIED grants the PROVIDER role
  // (the user must sign in again to get it in the token).
  setProviderStatus: (providerId, status) =>
    axiosClient.put(`/identity/providers/${providerId}/verification`, undefined, { params: { status } }),

  listVerifications: ({ status = 'PENDING', page = 0, size = 10 } = {}) =>
    axiosClient.get('/identity/provider-verifications', { params: { status, page, size } }),
  reviewVerification: (verificationId, verificationStatus) =>
    axiosClient.put(`/identity/provider-verifications/${verificationId}/review`, { verificationStatus }),

  listUsers: ({ page = 0, size = 10 } = {}) =>
    axiosClient.get('/identity/users', { params: { page, size } }),
  getUser: (userId) => axiosClient.get(`/identity/users/${userId}`),

  // catalog-service categories. body: { name, slug, description, parent (categoryId | null) }
  listCategories: ({ page = 0, size = 20 } = {}) =>
    axiosClient.get('/catalog/categories', { params: { page, size } }),
  createCategory: (body) => axiosClient.post('/catalog/categories', body),
  updateCategory: (categoryId, body) => axiosClient.put(`/catalog/categories/${categoryId}`, body),
  deleteCategory: (categoryId) => axiosClient.delete(`/catalog/categories/${categoryId}`),
};

export default adminApi;
