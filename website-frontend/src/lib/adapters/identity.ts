import { apiFetch, normalizeSpringPage, type Page, type SpringPageResponse } from "../api-client";
import type { AddressFormData } from "../schemas/address";
import type { UserProfileFormData, ProviderProfileFormData } from "../schemas/profile";

export interface UserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  userName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  roles?: string[];
}

export interface AddressResponse {
  addressId: string;
  label: string;
  contactName: string;
  contactPhone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
  countryCode: string;
  latitude?: string;
  longitude?: string;
  note?: string;
  isDefault?: boolean;
}

export interface ProviderProfileResponse {
  providerProfileId: string;
  providerType: "INDIVIDUAL" | "COMPANY";
  businessName: string;
  bio: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  ratingAvg: number;
  ratingCount: number;
  completedOrderCount: number;
  isAcceptingOrders: boolean;
  joinedAt: string;
  userId: string;
}

export const identityApi = {
  async getMyInfo(token?: string): Promise<UserResponse> {
    return apiFetch<UserResponse>("/api/v1/identity/users/myInfo", { token });
  },

  async updateMyInfo(
    userId: string,
    data: Partial<UserProfileFormData> & { avatarUrl?: string },
    token?: string
  ): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/api/v1/identity/users/${userId}`, {
      method: "PUT",
      body: data,
      token,
    });
  },

  async getMyAddresses(page = 0, size = 10, token?: string): Promise<Page<AddressResponse>> {
    // AddressController.getMyAddresses returns PageResponse directly
    const res = await apiFetch<SpringPageResponse<AddressResponse>>(
      `/api/v1/identity/addresses/my?page=${page}&size=${size}`,
      { token }
    );
    return normalizeSpringPage(res);
  },

  async createAddress(data: AddressFormData, token?: string): Promise<AddressResponse> {
    return apiFetch<AddressResponse>("/api/v1/identity/addresses", {
      method: "POST",
      body: data,
      token,
    });
  },

  async updateAddress(
    id: string,
    data: AddressFormData,
    token?: string
  ): Promise<AddressResponse> {
    return apiFetch<AddressResponse>(`/api/v1/identity/addresses/${id}`, {
      method: "PUT",
      body: data,
      token,
    });
  },

  async deleteAddress(id: string, token?: string): Promise<void> {
    return apiFetch<void>(`/api/v1/identity/addresses/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async createProviderProfile(
    data: Omit<ProviderProfileFormData, "isAcceptingOrders">,
    token?: string
  ): Promise<ProviderProfileResponse> {
    return apiFetch<ProviderProfileResponse>("/api/v1/identity/providers", {
      method: "POST",
      body: data,
      token,
    });
  },

  async getMyProviderProfile(token?: string): Promise<ProviderProfileResponse | null> {
    try {
      return await apiFetch<ProviderProfileResponse>(
        "/api/v1/identity/providers/myProfile",
        { token }
      );
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async getProviderProfile(id: string): Promise<ProviderProfileResponse> {
    return apiFetch<ProviderProfileResponse>(`/api/v1/identity/providers/${id}`);
  },

  async updateMyProviderProfile(
    data: Partial<ProviderProfileFormData>,
    token?: string
  ): Promise<ProviderProfileResponse> {
    return apiFetch<ProviderProfileResponse>(
      "/api/v1/identity/providers/myProfile",
      {
        method: "PUT",
        body: data,
        token,
      }
    );
  },
};
