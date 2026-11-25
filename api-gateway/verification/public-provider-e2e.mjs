import test from 'node:test';
import assert from 'node:assert/strict';

const gateway = (process.env.GATEWAY_URL || 'http://localhost:8888/api/v1').replace(/\/$/, '');
const identity = (process.env.IDENTITY_URL || 'http://localhost:8081/identity').replace(/\/$/, '');
const providerId = '99999999-9999-9999-9999-999999999999';

async function status(url, method = 'GET') {
  const response = await fetch(url, { method, signal: AbortSignal.timeout(10000) });
  return response.status;
}

test('public Provider UUID detail matches Identity while private Provider routes stay protected', async () => {
  const path = `/providers/${providerId}`;
  const direct = await status(identity + path);
  const throughGateway = await status(gateway + '/identity' + path);
  assert.equal(throughGateway, direct);
  assert.notEqual(throughGateway, 401);
  for (const privatePath of ['/providers/myProfile', '/providers', '/providers/not-a-uuid']) {
    assert.equal(await status(gateway + '/identity' + privatePath), 401, privatePath);
  }
  assert.equal(await status(gateway + '/identity' + path, 'PUT'), 401);
});
