import axiosClient from './axiosClient.js';

// Admin-only endpoints. Each service enforces the role required by the operation.
// List endpoints answer ApiResponse<PageResponse{ data, totalElements, totalPages, currentPage }>.
/** @typedef {{reason: string, version: number}} AccountChange */
/** @typedef {AccountChange & {roleName: 'ADMIN' | 'SUPER_ADMIN'}} RoleChange */
/** @typedef {{successFeeRate: number, cancellationFeeRate: number, cancellationFeeCap: number, effectiveFrom?: string, reason: string}} FeeVersion */
/** @typedef {'processing' | 'paid' | 'failed' | 'unknown'} PayoutAction */
/** @typedef {{reason: string, externalReference?: string}} PayoutEvidence */
/** @typedef {{reason: string, externalReference: string, result: 'SUCCEEDED' | 'FAILED'}} TopUpResolution */

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

  /** @param {string} verificationId */
  listVerificationDocuments: (verificationId) =>
    axiosClient.get('/identity/provider-verifications/' + verificationId + '/documents'),
  /** @param {string} verificationId @param {string} documentId */
  downloadVerificationDocument: async (verificationId, documentId) => {
    const res = await axiosClient.get('/identity/provider-verifications/' + verificationId + '/documents/' + documentId + '/download-url');
    const path = '/provider-verifications/documents/' + documentId + '/content';
    const url = res?.result?.url;
    if (typeof url !== 'string' || !url.startsWith(path + '?')) {
      throw new Error('INVALID_VERIFICATION_DOCUMENT_LINK');
    }
    return axiosClient.get('/identity' + url, { responseType: 'blob' });
  },

  listUsers: ({ page = 0, size = 10 } = {}) =>
    axiosClient.get('/identity/users', { params: { page, size } }),
  getUser: (userId) => axiosClient.get(`/identity/users/${userId}`),
  updateUser: (userId, body) => axiosClient.put(`/identity/users/${userId}`, body),
  /** @param {string} userId @param {AccountChange} body */
  deleteUser: (userId, body) => axiosClient.delete(`/identity/users/${userId}`, { data: body }),
  /** @param {string} userId @param {RoleChange} body */
  grantUserRole: (userId, body) => axiosClient.post(`/identity/users/${userId}/roles/grant`, body),
  /** @param {string} userId @param {RoleChange} body */
  revokeUserRole: (userId, body) => axiosClient.post(`/identity/users/${userId}/roles/revoke`, body),

  /** @param {Record<string, string | number>} params */
  listOrders: (params) => axiosClient.get('/order/admin/orders', { params }),
  /** @param {string} orderId */
  getOrder: (orderId) => axiosClient.get(`/order/admin/orders/${orderId}`),
  /** @param {string} orderId @param {number} page */
  getOrderHistory: (orderId, page) => axiosClient.get(`/order/admin/orders/${orderId}/history`, { params: { page } }),

  /** @param {'identity' | 'catalog'} service @param {Record<string, string | number>} params */
  listAuditLogs: (service, params) => axiosClient.get(`/${service}/admin/audit-logs`, { params }),

  /** @param {'identity' | 'catalog'} service @param {Record<string, string>} params */
  exportAuditLogs: (service, params) =>
    axiosClient.get('/' + service + '/admin/audit-logs/export', { params, responseType: 'blob' }),

  listFeeVersions: () => axiosClient.get('/payment/admin/fee-policies'),
  /** @param {FeeVersion} body */
  createFeeVersion: (body) => axiosClient.post('/payment/admin/fee-policies', body),
  /** @param {string} status */
  listFeeAssessments: (status) => axiosClient.get('/payment/admin/fee-assessments', { params: { status } }),

  /** @param {string} status */
  listPayouts: (status) => axiosClient.get('/payment/admin/payouts', { params: { status } }),
  /** @param {string} payoutId @param {PayoutAction} action @param {PayoutEvidence} body */
  markPayout: (payoutId, action, body) => axiosClient.post(`/payment/admin/payouts/${payoutId}/${action}`, body),

  listReconciliationCases: () => axiosClient.get('/payment/admin/reconciliation'),
  /** @param {string} id @param {TopUpResolution} body */
  resolveTopUp: (id, body) => axiosClient.post(`/payment/admin/reconciliation/top-ups/${id}/resolve`, body),
  /** @param {string} orderId @param {{reason: string}} body */
  retryOrderSync: (orderId, body) => axiosClient.post(`/payment/admin/reconciliation/orders/${orderId}/retry-order-sync`, body),

  // catalog-service categories. body: { name, slug, description, parent (categoryId | null) }
  listCategories: ({ page = 0, size = 20 } = {}) =>
    axiosClient.get('/catalog/categories', { params: { page, size } }),
  createCategory: (body) => axiosClient.post('/catalog/categories', body),
  updateCategory: (categoryId, body) => axiosClient.put(`/catalog/categories/${categoryId}`, body),
  deleteCategory: (categoryId) => axiosClient.delete(`/catalog/categories/${categoryId}`),
};

export default adminApi;
