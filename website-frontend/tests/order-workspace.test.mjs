import test from 'node:test';
import assert from 'node:assert/strict';
import { orderApi } from '../src/_webapp-mirror/api/orderApi.js';
test('workspace target is loaded by server ID outside the current list page', async () => {
  globalThis.localStorage = { getItem: () => null };
  globalThis.fetch = async url => {
    assert.equal(url, '/api/v1/order/orders/o99');
    return new Response(JSON.stringify({ result: { order: { orderId: 'o99', orderStatus: 'COMPLETED' } } }), { status: 200 });
  };
  assert.deepEqual(await orderApi.getWorkspaceOrder('o99'), { orderId: 'o99', orderStatus: 'COMPLETED' });
});
test('workspace does not substitute demo data when access is denied', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 1008, message: 'Forbidden' }), { status: 403 });
  await assert.rejects(orderApi.getWorkspaceOrder('private'), e => e.status === 403);
});
