// Read-only smoke checks: safe against the existing local DB. No account,
// order, conversation, payment or notification is created/changed here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@stomp/stompjs';

const gateway = (process.env.GATEWAY_URL || 'http://localhost:8888/api/v1').replace(/\/$/, '');
const web = (process.env.WEB_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
async function read(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  return { status: response.status, body: await response.json() };
}

test('Catalog categories and pagination use the released response contract through Gateway', async () => {
  const categories = await read(`${gateway}/catalog/categories/roots`);
  assert.equal(categories.status, 200);
  assert.equal(categories.body.code, 1000);
  assert.ok(Array.isArray(categories.body.result.data));
  for (const category of categories.body.result.data) assert.equal(typeof category.categoryId, 'string');
  const services = await read(`${gateway}/catalog/services?page=0&size=2`);
  assert.equal(services.status, 200);
  const page = services.body.result;
  assert.ok(Array.isArray(page.data));
  assert.ok(page.data.length <= 2);
  assert.equal(page.currentPage, 0);
  assert.ok(Number.isInteger(page.totalElements));
  for (const item of page.data) {
    const detail = await read(`${gateway}/catalog/services/${encodeURIComponent(item.serviceId)}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.result.serviceId, item.serviceId);
    assert.equal(typeof detail.body.result.basePrice, 'number');
  }
});
test('Next rewrite returns the same Catalog page as Gateway', async () => {
  const path = '/catalog/services?page=0&size=2';
  const direct = await read(`${gateway}${path}`);
  const throughWeb = await read(`${web}/api/v1${path}`);
  assert.equal(throughWeb.status, 200);
  assert.deepEqual(throughWeb.body.result, direct.body.result);
});
test('Identity introspection of an empty token is denied without creating a session', async () => {
  const result = await read(`${gateway}/identity/auth/introspect`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: '' }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.result.valid, false);
});
test('anonymous and malformed-token requests cannot access private frontend resources', async () => {
  for (const path of ['/identity/users/my-info', '/order/orders', '/communication/conversations', '/communication/notifications', '/trust/reviews/my-reviews']) {
    for (const headers of [{}, { Authorization: 'Bearer invalid-smoke-token' }]) {
      const result = await read(`${gateway}${path}`, { headers });
      assert.equal(result.status, 401, path);
      assert.equal(result.body.result ?? null, null, `Private data exposed: ${path}`);
    }
  }
});

test('STOMP reaches Gateway and rejects invalid CONNECT credentials', async () => {
  let socket;
  let deadline;
  try {
    await new Promise((resolve, reject) => {
      deadline = setTimeout(() => reject(new Error('STOMP authentication response timed out')), 12000);
      socket = new Client({
        brokerURL: `${gateway.replace(/^http/, 'ws')}/communication/ws`,
        connectHeaders: { Authorization: 'Bearer invalid-smoke-token' },
        forceBinaryWSFrames: true,
        reconnectDelay: 0,
        connectionTimeout: 5000,
        heartbeatIncoming: 0,
        heartbeatOutgoing: 0,
        onConnect: () => reject(new Error('Invalid STOMP credentials were accepted')),
        onStompError: frame => {
          try { assert.equal(frame.command, 'ERROR'); resolve(); } catch (error) { reject(error); }
        },
        onWebSocketError: () => reject(new Error('WebSocket handshake failed before STOMP authentication')),
      });
      socket.activate();
    });
  } finally {
    clearTimeout(deadline);
    await socket?.deactivate();
  }
});
