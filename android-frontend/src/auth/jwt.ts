// Reads the JWT payload for UI decisions only (which areas to show, when to
// refresh). The signature is not checked here; the backend enforces every permission.

export type Role = 'CLIENT' | 'PROVIDER' | 'ADMIN';

export type JwtClaims = {
  sub: string;
  exp: number;
  scope?: string;
  userId?: string;
  providerId?: string | null;
};

// identity-service tokens live 24h and /auth/refresh only accepts a token that
// has not expired yet, so the app refreshes ahead of time.
export const REFRESH_WINDOW_MS = 2 * 60 * 60 * 1000;

export function decodeToken(token: string | null): JwtClaims | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      Array.from(atob(padded), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    );
    const claims = JSON.parse(json) as JwtClaims;
    if (typeof claims?.sub !== 'string' || typeof claims.exp !== 'number') return null;
    return claims;
  } catch {
    return null;
  }
}

// identity-service puts roles in `scope` as "ROLE_ADMIN ROLE_CLIENT ...".
export function hasRole(claims: JwtClaims | null, role: Role): boolean {
  if (typeof claims?.scope !== 'string') return false;
  return claims.scope.split(' ').includes(`ROLE_${role}`);
}

export function isExpired(claims: JwtClaims, nowMs: number): boolean {
  return claims.exp * 1000 <= nowMs;
}

export function needsRefresh(claims: JwtClaims, nowMs: number): boolean {
  return !isExpired(claims, nowMs) && claims.exp * 1000 - nowMs < REFRESH_WINDOW_MS;
}
