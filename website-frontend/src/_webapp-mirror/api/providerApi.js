import axiosClient from './axiosClient';

// identity-service provider profiles. providerId = providerProfileId
// (the same id catalog-service stores as ServiceResponse.providerId).
export const providerApi = {
  getProvider: (providerId) => axiosClient.get(`/identity/providers/${providerId}`),
  getMyProfile: () => axiosClient.get('/identity/providers/myProfile'),

  // body: { providerType: 'INDIVIDUAL' | 'COMPANY', businessName, bio }.
  // Creates a PENDING profile; an admin must set it VERIFIED before the user
  // gets the PROVIDER role (and a new login puts providerId in the token).
  createProfile: (body) => axiosClient.post('/identity/providers', body),
};

export default providerApi;
