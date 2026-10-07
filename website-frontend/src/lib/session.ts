import { cookies } from "next/headers";

export const COOKIE_ACCESS_TOKEN = "wg_at";
export const COOKIE_REFRESH_TOKEN = "wg_rt";
export const COOKIE_USER_ROLE = "wg_role";

export interface SessionData {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value || null;
  const role = cookieStore.get(COOKIE_USER_ROLE)?.value || null;

  return {
    token,
    role,
    isAuthenticated: Boolean(token),
  };
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_ACCESS_TOKEN)?.value || null;
}
