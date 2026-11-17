import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import client, { getAccessToken, setAccessToken } from '../src/_webapp-mirror/api/axiosClient.js';

const response = (status, body = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  setAccessToken('user-a');
});

test('a new account does not join the previous account refresh flight', async () => {
  const oldRefresh = deferred();
  const refreshStarted = deferred();
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/refresh')) {
      if (JSON.parse(init.body).token === 'user-a') { refreshStarted.resolve(); return oldRefresh.promise; }
      return response(200, { result: { token: 'fresh-b' } });
    }
    return init.headers.Authorization === 'Bearer fresh-b' ? response(200, { result: 'b' }) : response(401);
  };
  const a = client.get('/order/orders').catch(error => error);
  await refreshStarted.promise;
  setAccessToken('user-b');
  const b = client.get('/order/orders');
  const bResult = await Promise.race([b, new Promise(resolve => setTimeout(() => resolve('waited for old account'), 100))]);
  oldRefresh.resolve(response(200, { result: { token: 'fresh-a' } }));
  assert.equal((await a).code, 'SESSION_CHANGED');
  await b.catch(() => {});
  assert.deepEqual(bResult, { result: 'b' });
  assert.equal(getAccessToken(), 'fresh-b');
});

test('late success from an old session cannot expose its data to the new account', async () => {
  const pending = deferred();
  globalThis.fetch = () => pending.promise;
  const result = client.get('/order/orders');
  setAccessToken('user-b');
  pending.resolve(response(200, { result: ['private-a'] }));
  await assert.rejects(result, error => error.code === 'SESSION_CHANGED');
  assert.equal(getAccessToken(), 'user-b');
});

test('refresh landing after logout cannot restore the old session or replay a mutation', async () => {
  const pending = deferred();
  const calls = [];
  globalThis.fetch = async (url) => { calls.push(url); return url.endsWith('/refresh') ? pending.promise : response(401); };
  const result = client.post('/order/orders', { serviceId: 's1' });
  await new Promise(resolve => setImmediate(resolve));
  setAccessToken(null);
  pending.resolve(response(200, { result: { token: 'refreshed-a' } }));
  await assert.rejects(result, error => error.code === 'SESSION_CHANGED');
  assert.equal(getAccessToken(), null);
  assert.equal(calls.length, 2);
});

test('an old unauthorized response cannot log out a newly signed-in account', async () => {
  const pending = deferred();
  let calls = 0;
  globalThis.fetch = () => { calls++; return pending.promise; };
  const result = client.get('/order/orders');
  setAccessToken('user-b');
  pending.resolve(response(401));
  await assert.rejects(result, error => error.code === 'SESSION_CHANGED');
  assert.equal(getAccessToken(), 'user-b');
  assert.equal(calls, 1);
});

test('native 403 and 409 preserve the session and never refresh', async () => {
  let calls = 0;
  for (const status of [403, 409]) {
    globalThis.fetch = async () => { calls++; return response(status, { code: status === 403 ? 1007 : 3015 }); };
    await assert.rejects(client.post('/identity/users/u1', {}), e => e.status === status);
    assert.equal(getAccessToken(), 'user-a');
  }
  assert.equal(calls, 2);
});

test('concurrent 401s share one refresh and replay each original request with the same key', async () => {
  const pending = deferred();
  let refreshes = 0;
  const keys = [];
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/refresh')) { refreshes++; return pending.promise; }
    keys.push(init.headers['Idempotency-Key']);
    return init.headers.Authorization === 'Bearer user-a' ? response(401) : response(200, { result: 'ok' });
  };
  const results = Promise.all([client.post('/order/orders', {}, { headers: { 'Idempotency-Key': 'k1' } }), client.post('/order/orders', {}, { headers: { 'Idempotency-Key': 'k2' } })]);
  await new Promise(resolve => setImmediate(resolve));
  pending.resolve(response(200, { result: { token: 'fresh-a' } }));
  assert.deepEqual(await results, [{ result: 'ok' }, { result: 'ok' }]);
  assert.equal(refreshes, 1);
  assert.deepEqual(keys.sort(), ['k1', 'k1', 'k2', 'k2']);
});
