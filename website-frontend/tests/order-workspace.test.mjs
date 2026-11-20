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

test('order workspace sends amendments and cash confirmations to the order service', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([options.method, url, options.body]);
    return Response.json({ result: { status: 'AWAITING_PAYMENT' } });
  };
  await orderApi.getAgreement('o1');
  await orderApi.getAmendments('o1');
  await orderApi.proposeAmendment('o1', { newPrice: 125_000, reason: 'Extra work' });
  assert.equal((await orderApi.respondAmendment('o1', 'a1', 'accept')).result.status, 'AWAITING_PAYMENT');
  await orderApi.respondAmendment('o1', 'a1', 'reject');
  await orderApi.respondAmendment('o1', 'a1', 'settle');
  await orderApi.confirmCashReceived('o1');
  assert.deepEqual(calls, [
    ['GET', '/api/v1/order/orders/o1/agreement', undefined],
    ['GET', '/api/v1/order/orders/o1/amendments', undefined],
    ['POST', '/api/v1/order/orders/o1/amendments', JSON.stringify({ newPrice: 125_000, reason: 'Extra work' })],
    ['POST', '/api/v1/order/orders/o1/amendments/a1/accept', undefined],
    ['POST', '/api/v1/order/orders/o1/amendments/a1/reject', undefined],
    ['POST', '/api/v1/order/orders/o1/amendments/a1/settle', undefined],
    ['POST', '/api/v1/order/orders/onsite/o1/cash-received', undefined],
  ]);
});

test('order file flow sends multipart and retrieves signed content via the gateway', async () => {
  globalThis.fetch = async (url, options) => {
    if (options.method === 'POST') {
      assert.equal(url, '/api/v1/order/orders/o1/files');
      assert.equal(options.headers['Content-Type'], undefined);
      assert.equal(options.body.get('context'), 'DELIVERY');
      assert.equal(options.body.get('file').name, 'delivery.pdf');
      return Response.json({ result: { storedFileId: 'f1' } });
    }
    if (url.endsWith('/download-url')) {
      assert.equal(url, '/api/v1/order/orders/o1/files/f1/download-url');
      return Response.json({ result: { url: '/orders/files/f1/content?expires=123&signature=test' } });
    }
    assert.equal(url, '/api/v1/order/orders/files/f1/content?expires=123&signature=test');
    return new Response('pdf-data', { headers: { 'Content-Type': 'application/pdf' } });
  };
  const file = new File(['pdf-data'], 'delivery.pdf', { type: 'application/pdf' });
  assert.equal((await orderApi.uploadFile('o1', 'DELIVERY', file)).result.storedFileId, 'f1');
  const blob = await orderApi.downloadFile('o1', 'f1');
  assert.equal(blob.type, 'application/pdf');
  assert.equal(await blob.text(), 'pdf-data');
});

test('order file download preserves authorization errors and refuses unrelated signed paths', async () => {
  const statuses = [403, 404];
  globalThis.fetch = async url => {
    assert.equal(url, '/api/v1/order/orders/o1/files/f1/download-url');
    const status = statuses.shift();
    return status ? Response.json({ message: 'Access denied' }, { status })
      : Response.json({ result: { url: '/orders/files/other/content?expires=123&signature=test' } });
  };
  await assert.rejects(orderApi.downloadFile('o1', 'f1'), e => e.status === 403);
  await assert.rejects(orderApi.downloadFile('o1', 'f1'), e => e.status === 404);
  await assert.rejects(orderApi.downloadFile('o1', 'f1'));
});
