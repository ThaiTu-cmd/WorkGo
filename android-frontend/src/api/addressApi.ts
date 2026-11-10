import type { fromAddressForm } from './adapters';
import { http } from './client';
import type { AddressDto, ApiResponse, Paged } from './types';

type AddressBody = ReturnType<typeof fromAddressForm>;

// identity-service addresses via gateway (/api/v1/identity/addresses/**).
export const addressApi = {
  getMy: (page = 0, size = 50) => http.get<Paged<AddressDto>>('/identity/addresses/my', { params: { page, size } }),
  create: (body: AddressBody) => http.post<ApiResponse<AddressDto>>('/identity/addresses', body),
  update: (addressId: string, body: AddressBody) => http.put<ApiResponse<AddressDto>>(`/identity/addresses/${addressId}`, body),
  remove: (addressId: string) => http.delete<ApiResponse<unknown>>(`/identity/addresses/${addressId}`),
};
