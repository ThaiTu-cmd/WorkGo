import axiosClient from './axiosClient.js';

// identity-service provider verifications via gateway (/api/v1/identity/provider-verifications/**).
export const verificationApi = {
  // body: { verificationType: 'IDENTITY'|'BUSINESS', documentType: string }
  submit: (body) => axiosClient.post('/identity/provider-verifications', body),

  getMy: (page = 0, size = 10) =>
    axiosClient.get('/identity/provider-verifications/my', { params: { page, size } }),

  getById: (verificationId) =>
    axiosClient.get(`/identity/provider-verifications/${verificationId}`),

  listByStatus: ({ status = 'PENDING', page = 0, size = 10 } = {}) =>
    axiosClient.get('/identity/provider-verifications', { params: { status, page, size } }),

  review: (verificationId, verificationStatus) =>
    axiosClient.put(`/identity/provider-verifications/${verificationId}/review`, { verificationStatus }),

  remove: (verificationId) =>
    axiosClient.delete(`/identity/provider-verifications/${verificationId}`),
};

export default verificationApi;
