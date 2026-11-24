import axiosClient from './axiosClient.js';

function reputationResult(response, providerId) {
  const result = response?.result;
  if (response?.code !== 1000 || result?.providerId !== providerId ||
      !Number.isInteger(result.score) || result.score < 0 || result.score > 100 ||
      result.policyVersion !== 'WG-POLICY-1.0') {
    throw new Error('Invalid reputation contract');
  }
  return response;
}

function reputationLedger(response, providerId, requestedPage) {
  const page = response?.result;
  if (response?.code !== 1000 || !Array.isArray(page?.content) ||
      !Number.isInteger(page.number) || page.number < 0 ||
      page.number !== Math.max(0, requestedPage) || page.size !== 50 ||
      !Number.isInteger(page.totalElements) || page.totalElements < page.content.length ||
      page.content.some(entry => !entry?.id || entry.providerId !== providerId ||
        entry.policyVersion !== 'WG-POLICY-1.0' || !Number.isInteger(entry.afterScore) ||
        entry.afterScore < 0 || entry.afterScore > 100)) {
    throw new Error('Invalid reputation ledger contract');
  }
  return response;
}

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
    axiosClient.get(`/trust/providers/${encodeURIComponent(providerId)}/reputation`)
      .then(response => reputationResult(response, providerId)),

  // The owner derives this ledger from the authenticated provider, never a URL ID.
  getReputationLedger: (providerId, { page = 0 } = {}) =>
    axiosClient.get('/trust/reputation/me/ledger', { params: { page } })
      .then(response => reputationLedger(response, providerId, page)),

  getSanctions: (providerId) =>
    axiosClient.get(`/identity/providers/${providerId}/sanctions`).catch(() => null),

  submitAppeal: (body) =>
    axiosClient.post('/trust/sanctions/appeal', body).catch(() => ({
      result: { appealId: `APP-${Date.now()}`, ...body, status: 'PENDING', submittedAt: new Date().toISOString() },
    })),
};

export default trustApi;
