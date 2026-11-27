import axiosClient, { getSessionGeneration } from './axiosClient.js';
import { pendingScoreReviews, scoreReviewHistory, scoreReviewReceipt } from './scoreReviewContract.js';

const springPage = async (request) => {
  const response = await request;
  const page = response?.result;
  if (!page || !Array.isArray(page.content)) throw new Error('Invalid admin page');
  return { ...response, result: {
    data: page.content,
    currentPage: page.number ?? 0,
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  } };
};

// Admin-only endpoints. Each service enforces the role required by the operation.
// List endpoints answer ApiResponse<PageResponse{ data, totalElements, totalPages, currentPage }>.
/** @typedef {{reason: string, version: number}} AccountChange */
/** @typedef {AccountChange & {roleName: 'ADMIN' | 'SUPER_ADMIN'}} RoleChange */
/** @typedef {{successFeeRate: number, cancellationFeeRate: number, cancellationFeeCap: number, effectiveFrom?: string, reason: string}} FeeVersion */
/** @typedef {'processing' | 'paid' | 'failed' | 'unknown'} PayoutAction */
/** @typedef {{reason: string, externalReference?: string, sourceEvidence?: Record<string,string>}} PayoutEvidence */
/** @typedef {{reason: string, externalReference: string, result: 'SUCCEEDED' | 'FAILED', sourceEvidence?: Record<string,string>}} TopUpResolution */

export const adminApi = {
  listModerationJobs: (page = 0) => springPage(axiosClient.get('/job/admin/jobs', { params: { page } })),
  getModerationJob: (id) => axiosClient.get(`/job/admin/jobs/${id}`),
  getModerationJobHistory: (id, page = 0) => springPage(axiosClient.get(`/job/admin/jobs/${id}/history`, { params: { page } })),
  moderateJob: (id, body) => axiosClient.put(`/job/admin/jobs/${id}/moderation`, body),
  listModerationReviews: (page = 0) => springPage(axiosClient.get('/trust/admin/reviews', { params: { page } })),
  getModerationReview: (id) => axiosClient.get(`/trust/admin/reviews/${id}`),
  moderateReview: (id, body) => axiosClient.put(`/trust/admin/reviews/${id}/moderation`, body),
  listModerationReports: (page = 0) => springPage(axiosClient.get('/trust/admin/reports', { params: { page } })),
  getModerationReport: (id) => axiosClient.get(`/trust/admin/reports/${id}`),
  updateReport: (id, body) => axiosClient.put(`/trust/admin/reports/${id}/status`, body),
  listModerationDisputes: (page = 0) => springPage(axiosClient.get('/trust/admin/disputes', { params: { page } })),
  getModerationDispute: (id) => axiosClient.get(`/trust/admin/disputes/${id}`),
  getDisputeDecision: (id) => axiosClient.get(`/trust/admin/disputes/${id}/decision`),
  listDisputeEvidence: (id) => axiosClient.get(`/trust/disputes/${id}/evidence`),
  downloadDisputeEvidence: async (id) => {
    const { result } = await axiosClient.get(`/trust/evidence/${id}/download-url`);
    const prefix = `/api/v1/trust/evidence/${id}/content?`;
    if (typeof result?.url !== 'string' || !result.url.startsWith(prefix)) throw new Error('Invalid evidence link');
    return axiosClient.get(result.url.slice('/api/v1'.length), { responseType: 'blob' });
  },
  takeOverDispute: (id, body) => axiosClient.post(`/trust/admin/disputes/${id}/take-over`, body),
  requestDisputeEvidence: (id, body) => axiosClient.post(`/trust/admin/disputes/${id}/evidence-request`, body),
  resolveDispute: (id, body) => axiosClient.post(`/trust/admin/disputes/${id}/resolve`, body),
  initializeProviderReputation: (id, reason) => axiosClient.post(`/identity/providers/${encodeURIComponent(id)}/reputation-initialization`, { reason }),
  securitySupport: () => axiosClient.get('/identity/admin/security-support'),
  listCases: (section, params = {}) => {
    if (!['jobs','reviews','reports','disputes'].includes(section)) throw new Error('Unsupported case section');
    return axiosClient.get(`/${section === 'jobs' ? 'job' : 'trust'}/admin/${section}`, { params });
  },
  getCase: (section, id) => axiosClient.get(`/${section === 'jobs' ? 'job' : 'trust'}/admin/${section}/${encodeURIComponent(id)}`),
  caseAction: (section, id, action, body) => {
    const route = section === 'jobs' ? 'job' : 'trust';
    const allowed = { jobs: ['moderation'], reviews: ['moderation'], reports: ['status'],
      disputes: ['take-over','evidence-request','evidence-extension','resolve'] };
    if (!allowed[section]?.includes(action)) throw new Error('Unsupported case action');
    const path = `/${route}/admin/${section}/${encodeURIComponent(id)}/${action}`;
    return ['moderation','status'].includes(action) ? axiosClient.put(path,body) : axiosClient.post(path,body);
  },
  getCaseDecision: (id) => axiosClient.get(`/trust/admin/disputes/${encodeURIComponent(id)}/decision`),
  retryDecision: (id, body) => axiosClient.post(`/trust/admin/decisions/${encodeURIComponent(id)}/retry`, body),
  listEscrows: (page = 0) => axiosClient.get('/payment/admin/escrows', { params: { page } }),
  createSanction: (id, body) => axiosClient.post(`/identity/providers/${encodeURIComponent(id)}/sanctions`, body),
  pendingSanctionAppeals: () => axiosClient.get('/identity/sanction-appeals/pending'),
  reviewSanctionAppeal: (id, body) => axiosClient.post(`/identity/sanction-appeals/${encodeURIComponent(id)}/review`, body),
  approveRecovery: (id, reason) => axiosClient.post(`/identity/providers/${encodeURIComponent(id)}/recovery-grants`, { reason }),
  completeRecovery: (id, reason) => axiosClient.post(`/identity/providers/${encodeURIComponent(id)}/recovery-completion`, { reason }),
  pendingScoreReviews: () => axiosClient.get('/identity/admin/provider-score-reviews/pending').then(pendingScoreReviews),
  reviewProviderScore: (id, body) => axiosClient.post(`/identity/providers/${encodeURIComponent(id)}/score-review`, body)
    .then(response => scoreReviewReceipt(response, id, body)),
  providerScoreReviews: (id) => axiosClient.get(`/identity/providers/${encodeURIComponent(id)}/score-reviews`)
    .then(response => scoreReviewHistory(response, id)),
  pendingRewardReviews: () => axiosClient.get('/trust/admin/reward-reviews'),
  getRewardReview: (id) => axiosClient.get(`/trust/admin/reward-reviews/${encodeURIComponent(id)}`),
  reviewReward: (id, body) => axiosClient.post(`/trust/admin/reward-reviews/${encodeURIComponent(id)}`, body),
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

  /** @param {'identity' | 'catalog' | 'payment' | 'communication' | 'job' | 'trust'} service @param {Record<string, string | number>} params */
  listAuditLogs: async (service, params) => {
    if (!['identity', 'catalog', 'payment', 'communication', 'job', 'trust'].includes(service)) throw new Error('Unsupported audit source');
    const response = await axiosClient.get(`/${service}/admin/audit-logs`, { params });
    const page = response?.result;
    if (!page) return response;
    const rows = page.data ?? page.content;
    if (!Array.isArray(rows)) throw new Error('Invalid audit page');
    return { ...response, result: { ...page, currentPage: page.currentPage ?? page.number ?? 0,
      pageSize: page.pageSize ?? page.size, data: rows.map(row => ({ ...row, adminActionLogId: row.adminActionLogId ?? row.id })) } };
  },

  /** @param {'identity' | 'catalog' | 'payment' | 'communication' | 'job' | 'trust'} service @param {Record<string, string>} params */
  exportAuditLogs: async (service, params) => {
    if (!['identity', 'catalog', 'payment', 'communication', 'job', 'trust'].includes(service)) throw new Error('Unsupported audit source');
    const generation = getSessionGeneration();
    // A closed interval excludes the audit entries generated by this export itself.
    const upper = new Date(params.to).getTime();
    const selected = upper > Date.now() ? { ...params, to: new Date().toISOString() } : { ...params };
    const parts = [];
    let totalBytes = 0;
    let header = null;
    for (let cursor = 0; cursor < 10; cursor++) {
      if (generation !== getSessionGeneration()) throw new Error('Session changed during audit export');
      const page = await axiosClient.get('/' + service + '/admin/audit-logs/export', {
        params: { ...selected, cursor: String(cursor), limit: '1000' }, responseType: 'audit-page',
      });
      if (generation !== getSessionGeneration()) throw new Error('Session changed during audit export');
      if (!(page?.blob instanceof Blob) || !String(page.contentType).startsWith('text/csv')) throw new Error('Invalid audit export response');
      totalBytes += page.blob.size;
      if (page.blob.size > 2 * 1024 * 1024 || totalBytes > 10 * 1024 * 1024) throw new Error('Audit export too large; narrow the date range');
      const text = await page.blob.text();
      const end = text.indexOf('\n');
      if (end < 0) throw new Error('Invalid audit CSV header');
      const currentHeader = text.slice(0, end + 1);
      if (header !== null && currentHeader !== header) throw new Error('Audit CSV columns changed during export');
      header = currentHeader;
      parts.push(cursor === 0 ? text : text.slice(end + 1));
      if (!page.nextCursor) {
        if (generation !== getSessionGeneration()) throw new Error('Session changed during audit export');
        return new Blob(parts, { type: 'text/csv;charset=utf-8' });
      }
      if (String(cursor + 1) !== page.nextCursor) throw new Error('Invalid audit export continuation');
    }
    throw new Error('Audit export too large; narrow the date range');
  },

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
