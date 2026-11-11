import { http } from './client';
import type { ApiResponse } from './types';

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

type TokenResult = ApiResponse<{ token?: string; authenticated?: boolean }>;

function tokenOf(res: TokenResult | null): string {
  const token = res?.result?.token;
  if (!token) throw new Error('Không nhận được token từ máy chủ.');
  return token;
}

// identity-service via gateway (/api/v1/identity/**). token/registration/logout/refresh are public.
// Unlike the web client, nothing here stores the token: AuthProvider owns the session.
export const authApi = {
  login: async (userName: string, password: string): Promise<string> =>
    tokenOf(await http.post<TokenResult>('/identity/auth/token', { userName, password })),

  register: (body: RegisterBody) => http.post<ApiResponse<UserDto>>('/identity/users/registration', body),

  logout: async (token: string): Promise<void> => {
    try {
      await http.post('/identity/auth/logout', { token });
    } catch {
      // token already dropped locally; server-side invalidation is best effort
    }
  },

  // Only accepts a token that has not expired yet; the old token is invalidated.
  refresh: async (token: string): Promise<string> =>
    tokenOf(await http.post<TokenResult>('/identity/auth/refresh', { token })),

  getMyInfo: () => http.get<ApiResponse<UserDto>>('/identity/users/myInfo'),

  // Partial update of the signed-in user: null fields are left as is.
  updateMyInfo: (body: Partial<Pick<UserDto, 'firstName' | 'lastName' | 'email' | 'phone' | 'avatarUrl'>>) =>
    http.put<ApiResponse<UserDto>>('/identity/users/myInfo', body),
};
