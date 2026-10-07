import { apiFetch, normalizeSpringPage, type Envelope, type Page, type SpringPageResponse } from "../api-client";
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

export type BackendRole = string | { roleName?: string };

export interface RawBackendUser {
  userId?: string | number;
  firstName?: string;
  lastName?: string;
  userName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  roles?: BackendRole[];
}

export function normalizeUserRoles(rawRoles?: unknown): string[] {
  if (!rawRoles || !Array.isArray(rawRoles)) return ["USER"];
  return rawRoles.map((r: unknown) => {
    if (typeof r === "string") return r.replace(/^ROLE_/, "");
    if (r && typeof r === "object" && "roleName" in r && typeof (r as { roleName?: unknown }).roleName === "string") {
      return ((r as { roleName: string }).roleName).replace(/^ROLE_/, "");
    }
    return "USER";
  });
}

export function normalizeUserResponse(raw: unknown): UserResponse {
  const envelope = raw as Envelope<RawBackendUser> | undefined;
  const result = (envelope && typeof envelope === "object" && "result" in envelope && envelope.result
    ? envelope.result
    : raw) as RawBackendUser;

  return {
    userId: String(result?.userId || ""),
    firstName: result?.firstName || "",
    lastName: result?.lastName || "",
    userName: result?.userName || "",
    phone: result?.phone || "",
    email: result?.email || "",
    avatarUrl: result?.avatarUrl || undefined,
    roles: normalizeUserRoles(result?.roles),
  };
}

export const identityApi = {
  async getMyInfo(token?: string): Promise<UserResponse> {
    const res = await apiFetch<Envelope<RawBackendUser> | RawBackendUser>("/api/v1/identity/users/myInfo", { token });
    return normalizeUserResponse(res);
  },

  async updateMyInfo(
    userId: string,
    data: Partial<UserProfileFormData> & { avatarUrl?: string },
    token?: string
  ): Promise<UserResponse> {
    const res = await apiFetch<Envelope<RawBackendUser> | RawBackendUser>(`/api/v1/identity/users/${userId}`, {
      method: "PUT",
      body: data,
      token,
    });
    return normalizeUserResponse(res);
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
    const res = await apiFetch<Envelope<AddressResponse> | AddressResponse>("/api/v1/identity/addresses", {
      method: "POST",
      body: data,
      token,
    });
    return (res && "result" in res && res.result ? res.result : res) as AddressResponse;
  },

  async updateAddress(
    id: string,
    data: AddressFormData,
    token?: string
  ): Promise<AddressResponse> {
    const res = await apiFetch<Envelope<AddressResponse> | AddressResponse>(`/api/v1/identity/addresses/${id}`, {
      method: "PUT",
      body: data,
      token,
    });
    return (res && "result" in res && res.result ? res.result : res) as AddressResponse;
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
    const res = await apiFetch<Envelope<ProviderProfileResponse> | ProviderProfileResponse>("/api/v1/identity/providers", {
      method: "POST",
      body: data,
      token,
    });
    return (res && "result" in res && res.result ? res.result : res) as ProviderProfileResponse;
  },

  async getMyProviderProfile(token?: string): Promise<ProviderProfileResponse | null> {
    try {
      const res = await apiFetch<Envelope<ProviderProfileResponse> | ProviderProfileResponse>(
        "/api/v1/identity/providers/myProfile",
        { token }
      );
      return (res && "result" in res && res.result ? res.result : (res as ProviderProfileResponse)) || null;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err && (err as { status: unknown }).status === 404) {
        return null;
      }
      throw err;
    }
  },

  async getProviderProfile(id: string): Promise<ProviderProfileResponse> {
    const res = await apiFetch<Envelope<ProviderProfileResponse> | ProviderProfileResponse>(`/api/v1/identity/providers/${id}`);
    return (res && "result" in res && res.result ? res.result : res) as ProviderProfileResponse;
  },

  async updateMyProviderProfile(
    data: Partial<ProviderProfileFormData>,
    token?: string
  ): Promise<ProviderProfileResponse> {
    const res = await apiFetch<Envelope<ProviderProfileResponse> | ProviderProfileResponse>(
      "/api/v1/identity/providers/myProfile",
      {
        method: "PUT",
        body: data,
        token,
      }
    );
    return (res && "result" in res && res.result ? res.result : res) as ProviderProfileResponse;
  },
};
