import { http } from './client';
import type { ApiResponse } from './types';
import { translate } from '@/i18n';

export type UserDto = {
  userId: string;
  userName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type RegisterBody = {
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string;
  phone: string;
};

export type AuthTokens = { token: string; refreshToken: string; expiresAt: string; rotationPending?: boolean };
type TokenResult = ApiResponse<Partial<AuthTokens> & { authenticated?: boolean }>;

function tokenOf(res: TokenResult | null): AuthTokens {
  const token = res?.result?.token;
  const refreshToken = res?.result?.refreshToken;
  const expiresAt = res?.result?.expiresAt;
  if (res?.code !== 1000 || res.result?.authenticated !== true || !token
      || !refreshToken || !/^[A-Za-z0-9_-]{43}$/.test(refreshToken) || !expiresAt || !Number.isFinite(Date.parse(expiresAt))) {
    throw new Error(translate('authApi.khong_nhan_duoc_token_tu'));
  }
  return { token, refreshToken, expiresAt };
}

// identity-service via gateway (/api/v1/identity/**). token/registration/logout/refresh are public.
// Unlike the web client, nothing here stores the token: AuthProvider owns the session.
export const authApi = {
  login: async (userName: string, password: string): Promise<AuthTokens> =>
    tokenOf(await http.post<TokenResult>('/identity/auth/token', { userName, password })),

  register: (body: RegisterBody) => http.post<ApiResponse<UserDto>>('/identity/users/registration', body),

  logout: async (token: string | null, refreshToken: string | null): Promise<void> => {
    try {
      await http.post('/identity/auth/logout', { token, refreshToken });
    } catch {
      // token already dropped locally; server-side invalidation is best effort
    }
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> =>
    tokenOf(await http.post<TokenResult>('/identity/auth/refresh', { refreshToken, requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}` })),

  getMyInfo: () => http.get<ApiResponse<UserDto>>('/identity/users/myInfo'),

  // Partial update of the signed-in user: null fields are left as is.
  updateMyInfo: (body: Partial<Pick<UserDto, 'firstName' | 'lastName' | 'email' | 'phone' | 'avatarUrl'>>) =>
    http.put<ApiResponse<UserDto>>('/identity/users/myInfo', body),
};
