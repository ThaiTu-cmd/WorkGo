import test from 'node:test';
import assert from 'node:assert/strict';
import * as notifications from '../src/_webapp-mirror/api/notificationApi.js';

test('unread is derived from readAt, not an invented boolean flag', () => {
  assert.equal(notifications.isUnread({ id: 'a', readAt: null }), true);
  assert.equal(notifications.isUnread({ id: 'b', readAt: '2026-11-17T00:00:00Z' }), false);
});

test('notification targets use reference IDs and never execute arbitrary URLs', () => {
  assert.deepEqual(notifications.notificationTarget({ referenceType: 'ORDER', referenceId: 'o1' }), { page: 'orders', params: { orderId: 'o1' } });
  assert.deepEqual(notifications.notificationTarget({ referenceType: 'SERVICE', referenceId: 's1' }), { page: 'detail', params: { serviceId: 's1' } });
  assert.equal(notifications.notificationTarget({ referenceType: 'UNKNOWN', referenceId: 'https://evil.example' }), null);
  assert.equal(notifications.notificationTarget({ referenceType: 'ORDER', referenceId: null }), null);
});

test('unread total includes notifications outside the displayed page', async () => {
  globalThis.localStorage = { getItem: () => null };
  globalThis.fetch = async url => new Response(JSON.stringify({ result: url.includes('unreadOnly=true') ? { data: [{ id: 'a', readAt: null }], totalElements: 28 } : { data: [{ id: 'b', readAt: '2026-11-17T00:00:00Z' }], totalElements: 100 } }), { status: 200 });
  assert.deepEqual(await notifications.notificationApi.getInbox(), { items: [{ id: 'b', readAt: '2026-11-17T00:00:00Z' }], unreadCount: 28 });
});
