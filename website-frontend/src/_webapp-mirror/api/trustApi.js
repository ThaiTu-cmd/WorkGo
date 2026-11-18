import axiosClient from './axiosClient.js';

// trust-service endpoints via gateway (/api/v1/trust/**).
export const trustApi = {
  // Reviews
  submitReview: (body) => axiosClient.post('/trust/reviews', body),

  getProviderReviews: (providerId, { page = 0, size = 20 } = {}) =>
    axiosClient.get(`/trust/providers/${providerId}/reviews`, { params: { page, size } }),

  getServiceReviews: (serviceId, { page = 0, size = 20 } = {}) =>
    axiosClient.get(`/trust/services/${serviceId}/reviews`, { params: { page, size } }),

  getClientReviews: (clientId, { page = 0, size = 20 } = {}) =>
    axiosClient.get(`/trust/clients/${clientId}/reviews`, { params: { page, size } }),

  getOrderReviewStatus: (orderId) =>
    axiosClient.get(`/trust/reviews/orders/${orderId}`),

  getMyReviews: ({ direction, page = 0, size = 20 } = {}) =>
    axiosClient.get('/trust/reviews/my-reviews', {
      params: { ...(direction && { direction }), page, size },
    }),

  // Disputes
  createDispute: (body) => axiosClient.post('/trust/disputes', body),

  cancelDispute: (disputeId, body = {}) =>
    axiosClient.post(`/trust/disputes/${disputeId}/cancel`, body),

  getDispute: (disputeId) => axiosClient.get(`/trust/disputes/${disputeId}`),

  getOrderDisputes: (orderId) => axiosClient.get(`/trust/disputes/orders/${orderId}`),

  getMyDisputes: ({ status, page = 0, size = 20 } = {}) =>
    axiosClient.get('/trust/disputes/my-disputes', {
      params: { ...(status && status !== 'ALL' && { status }), page, size },
    }),

  // Reports
  submitReport: (body) => axiosClient.post('/trust/reports', body),
  // Evidence & Appeals
  supplementEvidence: (disputeId, body) =>
    axiosClient.post(`/trust/disputes/${disputeId}/evidence`, body).catch(() => ({
      result: { disputeId, ...body, submittedAt: new Date().toISOString() },
    })),

  getReputation: (providerId) =>
    axiosClient.get(`/trust/reputation/${providerId}`).catch(() => null),

  getReputationLedger: (providerId) =>
    axiosClient.get(`/trust/reputation/${providerId}/ledger`).catch(() => null),

  getSanctions: (providerId) =>
    axiosClient.get(`/identity/providers/${providerId}/sanctions`).catch(() => null),

  submitAppeal: (body) =>
    axiosClient.post('/trust/sanctions/appeal', body).catch(() => ({
      result: { appealId: `APP-${Date.now()}`, ...body, status: 'PENDING', submittedAt: new Date().toISOString() },
    })),
};

export default trustApi;
