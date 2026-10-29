import { http } from './client';
import type { ApiResponse, ProviderProfileDto } from './types';

// identity-service provider profiles. providerId = providerProfileId
// (the same id catalog-service stores as ServiceResponse.providerId).
export const providerApi = {
  // Needs a token: guests get 401 and the UI falls back to a default name.
  getProvider: (providerId: string) => http.get<ApiResponse<ProviderProfileDto>>(`/identity/providers/${providerId}`),

  getMyProfile: () => http.get<ApiResponse<ProviderProfileDto>>('/identity/providers/myProfile'),

  // Creates a PENDING profile; an admin must set it VERIFIED before the user
  // gets the PROVIDER role (picked up by refreshing the token).
  createProfile: (body: { providerType: 'INDIVIDUAL' | 'COMPANY'; businessName: string; bio: string }) =>
    http.post<ApiResponse<ProviderProfileDto>>('/identity/providers', body),
};
