import { randomUUID } from 'node:crypto';

const GENERATION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPAQUE = /^[A-Za-z0-9_-]{43}$/;
const reply = (status, body, cookie) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) },
});

/** Same-origin BFF. A cookie belongs to one browser session generation, so a late
 * Set-Cookie from an old request cannot overwrite the next account's credential. */
export async function handleAuth(request, action, fetcher = fetch) {
  const url = new URL(request.url);
  // Next can construct an internal localhost URL. Host is the origin addressed
  // by the browser; TLS-terminating deployments can pin the public origin explicitly.
  const expectedOrigin = process.env.AUTH_WEB_ORIGIN || `${url.protocol}//${request.headers.get('Host') || url.host}`;
  const generation = request.headers.get('X-WorkGo-Session') || '';
  if (request.method !== 'POST' || request.headers.get('Origin') !== expectedOrigin || !GENERATION.test(generation)
      || !['same-origin', 'none', null].includes(request.headers.get('Sec-Fetch-Site'))) {
    return reply(403, { message: 'Invalid auth origin or session' });
  }
  if (!['login', 'refresh', 'logout'].includes(action)) return reply(404, {});
  const name = `wg-refresh-${generation}`;
  const cookie = (request.headers.get('Cookie') || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
  const credential = OPAQUE.test(cookie || '') ? cookie : undefined;
  const secure = process.env.NODE_ENV === 'production' || url.protocol === 'https:' ? '; Secure' : '';
  const serialize = (value, age) => `${name}=${value}; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=${age}${secure}`;
  let body;
  try { body = await request.json(); } catch { return reply(400, { message: 'Invalid JSON' }); }
  if (!body || typeof body !== 'object') return reply(400, { message: 'Invalid request' });
  if (action === 'refresh' && !credential) return reply(401, { message: 'Sign in required' });
  const payload = action === 'login' ? { userName: body.userName, password: body.password }
    : action === 'refresh' ? { refreshToken: credential, requestId: randomUUID() }
    : { token: typeof body.token === 'string' ? body.token : undefined, refreshToken: credential };
  try {
    const gateway = process.env.API_GATEWAY_URL || 'http://localhost:8888';
    const upstream = await fetcher(`${gateway}/api/v1/identity/auth/${action === 'login' ? 'token' : action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const status = upstream.status === 401 || upstream.status === 403 || upstream.status === 400 ? upstream.status : 503;
      return reply(status, { message: status === 503 ? 'Authentication unavailable' : 'Authentication rejected' },
        action === 'logout' || action === 'refresh' && status === 401 ? serialize('', 0) : undefined);
    }
    if (action === 'logout') return reply(200, { code: 1000 }, serialize('', 0));
    const result = data?.result;
    if (data?.code !== 1000 || result?.authenticated !== true || typeof result.token !== 'string' || !result.token
        || !OPAQUE.test(result.refreshToken || '') || !Number.isFinite(Date.parse(result.expiresAt))) {
      return reply(503, { message: 'Invalid authentication response' });
    }
    // Never echo the upstream response wholesale: refresh material stays out of JS and logs.
    return reply(200, { code: 1000, result: { token: result.token, authenticated: true, expiresAt: result.expiresAt } }, serialize(result.refreshToken, 604800));
  } catch {
    return reply(503, { message: 'Authentication unavailable' }, action === 'logout' ? serialize('', 0) : undefined);
  }
}
