import axiosClient from './axiosClient.js';

// identity-service provider profiles. providerId = providerProfileId
// (the same id catalog-service stores as ServiceResponse.providerId).
export const providerApi = {
  getProvider: (providerId) => axiosClient.get(`/identity/providers/${providerId}`),
  getMyProfile: () => axiosClient.get('/identity/providers/myProfile'),

  // body: { providerType: 'INDIVIDUAL' | 'COMPANY', businessName, bio }.
  // Creates a PENDING profile; an admin must set it VERIFIED before the user
  // gets the PROVIDER role (and a new login puts providerId in the token).
  createProfile: (body) => axiosClient.post('/identity/providers', body),

  // body: { businessName, bio, isAcceptingOrders }
  updateMyProfile: (body) => axiosClient.put('/identity/providers/myProfile', body),

  deleteMyProfile: () => axiosClient.delete('/identity/providers/myProfile'),

  // Provider Verifications
  submitVerification: (body) => axiosClient.post('/identity/provider-verifications', body),

  getMyVerifications: (page = 0, size = 10) =>
    axiosClient.get('/identity/provider-verifications/my', { params: { page, size } }),

  getVerification: (verificationId) =>
    axiosClient.get(`/identity/provider-verifications/${verificationId}`),

  deleteVerification: (verificationId) =>
    axiosClient.delete(`/identity/provider-verifications/${verificationId}`),
};

export default providerApi;
