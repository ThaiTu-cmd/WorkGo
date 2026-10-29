// Builds an unsigned JWT-shaped string for tests (signature is never checked client-side).
export function makeToken(payload: Record<string, unknown>): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${enc({ alg: 'HS512' })}.${enc(payload)}.sig`;
}

export const HOUR = 60 * 60 * 1000;

export function tokenExpiringIn(ms: number, extra: Record<string, unknown> = {}): string {
  return makeToken({ sub: 'an', scope: 'ROLE_CLIENT', exp: Math.floor((Date.now() + ms) / 1000), ...extra });
}
