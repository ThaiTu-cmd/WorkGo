// Reads the JWT payload for UI decisions only (show/hide admin entry points).
// The signature is not checked here; the backend enforces every permission.
export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      Array.from(atob(padded), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// identity-service puts roles in `scope` as "ROLE_ADMIN ROLE_CLIENT ...".
export function hasRole(token, role) {
  const scope = decodeToken(token)?.scope;
  if (typeof scope !== 'string') return false;
  return scope.split(' ').includes(`ROLE_${role}`);
}
