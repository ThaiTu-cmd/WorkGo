import { apiFetch, setStoredToken, removeStoredToken } from './client';

export interface UserInfo {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: { name: string }[];
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  authenticated?: boolean;
}

export interface RegisterPayload {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export const authApi = {
  async login(userName: string, password: string): Promise<LoginResponse> {
    const res = await apiFetch<LoginResponse>('/api/v1/identity/auth/token', {
      method: 'POST',
      body: { userName, password },
    });

    if (res.token) {
      await setStoredToken('wg_at', res.token);
    }
    if (res.refreshToken) {
      await setStoredToken('wg_rt', res.refreshToken);
    }

    return res;
  },

  async register(payload: RegisterPayload): Promise<void> {
    await apiFetch('/api/v1/identity/users/registration', {
      method: 'POST',
      body: payload,
    });
  },

  async me(): Promise<UserInfo> {
    const raw = await apiFetch<{
      id: string;
      userName: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      roles?: { name: string }[];
    }>('/api/v1/identity/users/myInfo');

    const roleName = raw.roles?.[0]?.name?.replace('ROLE_', '') || 'CLIENT';
    const role = (roleName === 'PROVIDER' || roleName === 'ADMIN' ? roleName : 'CLIENT') as 'CLIENT' | 'PROVIDER' | 'ADMIN';

    return {
      ...raw,
      roles: raw.roles || [{ name: role }],
      role,
    };
  },

  async logout(): Promise<void> {
    await removeStoredToken('wg_at');
    await removeStoredToken('wg_rt');
  },
};
