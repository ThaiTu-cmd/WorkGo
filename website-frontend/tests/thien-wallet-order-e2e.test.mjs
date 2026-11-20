import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { TEST_ORDER_IMAGE } from './helpers/order-files.mjs';
import { topUpFromMockGateway } from './helpers/payment.mjs';

const gateway = (process.env.GATEWAY_URL || 'http://localhost:8888/api/v1').replace(/\/$/, '');
const adminUser = process.env.E2E_ADMIN_USERNAME;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function request(path, token, method = 'GET', payload, expected = 200, idempotencyKey = randomUUID()) {
  const multipart = payload instanceof FormData;
  const response = await fetch(gateway + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(payload && !multipart && { 'Content-Type': 'application/json' }),
      ...(method === 'POST' && idempotencyKey !== null && { 'Idempotency-Key': idempotencyKey }),
    },
    body: payload ? multipart ? payload : JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.json();
  assert.equal(response.status, expected, `${method} ${path} returned ${response.status}, code ${body.code}`);
  return body.result;
}

async function account() {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const credentials = { userName: 'thien_' + suffix, password: 'T!' + randomUUID() };
  await request('/identity/users/registration', null, 'POST', {
    ...credentials, firstName: 'Thien', lastName: 'E2E', email: suffix + '@example.test',
    phone: '09' + String(Number.parseInt(suffix.slice(0, 6), 16)).padStart(8, '0'),
  });
  return { credentials, token: (await request('/identity/auth/token', null, 'POST', credentials)).token };
}

test('Thien Gateway wallet, files, agreements and cash contracts', {
  skip: !adminUser || !adminPassword ? 'Needs E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD for an isolated test backend' : false,
}, async t => {
  const admin = (await request('/identity/auth/token', null, 'POST', { userName: adminUser, password: adminPassword })).token;
  const client = await account();
  const outsider = await account();
  const provider = await account();
  const profile = await request('/identity/providers', provider.token, 'POST', { providerType: 'INDIVIDUAL', businessName: 'E2E Studio', bio: 'Isolated frontend contract fixture' });
  await request(`/identity/providers/${profile.providerProfileId}/verification?status=VERIFIED`, admin, 'PUT');
  provider.token = (await request('/identity/auth/token', null, 'POST', provider.credentials)).token;
  const category = await request('/catalog/categories', admin, 'POST', { name: 'E2E Frontend', slug: 'e2e-' + randomUUID(), description: 'Frontend integration' });
  async function service(executionType) {
    const created = await request('/catalog/services', provider.token, 'POST', {
      categoryId: category.categoryId, executionType, title: 'E2E ' + executionType,
      slug: 'e2e-' + randomUUID(), description: 'Isolated frontend order fixture', basePrice: 100000, currency: 'VND',
    });
    const pkg = await request(`/catalog/packages/services/${created.serviceId}`, provider.token, 'POST', {
      name: 'Basic', description: 'E2E package', price: 100000, currency: 'VND', deliveryDay: 2, durationMinute: 30, revisionLimit: null,
    });
    await request(`/catalog/services/${created.serviceId}/status`, provider.token, 'PATCH', { status: 'PUBLISHED' });
    return { serviceId: created.serviceId, packageId: pkg.packageId };
  }
  const digital = await service('DIGITAL');
  const onsite = await service('ONSITE');
  const creation = { ...digital, addonIds: [], paymentMethod: 'WALLET' };
  const creationKey = randomUUID();
  const order = await request('/order/orders', client.token, 'POST', creation, 200, creationKey);

  await t.test('order creation retries replay one order, reject changed payload and scope keys to the client', async () => {
    const retry = await request('/order/orders', client.token, 'POST', creation, 200, creationKey);
    assert.equal(retry.orderId, order.orderId);
    await request('/order/orders', client.token, 'POST', { ...creation, address: 'Changed' }, 409, creationKey);
    await request('/order/orders', client.token, 'POST', creation, 400, '');
    await request('/order/orders', null, 'POST', creation, 401, creationKey);
    const other = await request('/order/orders', outsider.token, 'POST', creation, 200, creationKey);
    assert.notEqual(other.orderId, order.orderId);
  });

  await t.test('wallet payment retries keep one escrow and one debit', async () => {
    await request(`/payment/wallet/orders/${order.orderId}/pay`, client.token, 'POST', undefined, 409);
    await topUpFromMockGateway(gateway, client.token, 500000);
    const first = await request(`/payment/wallet/orders/${order.orderId}/pay`, client.token, 'POST');
    const before = await request('/payment/wallet', client.token);
    const retry = await request(`/payment/wallet/orders/${order.orderId}/pay`, client.token, 'POST');
    assert.equal(first.escrowAccountId, retry.escrowAccountId);
    assert.equal((await request('/payment/wallet', client.token)).balance, before.balance);
    assert.equal(first.fundingSource, 'WALLET');
    assert.equal((await request(`/order/orders/${order.orderId}`, client.token)).order.orderStatus, 'CONFIRMED');
    assert.equal((await request('/order/orders', client.token, 'POST', creation, 200, creationKey)).orderStatus, 'CONFIRMED');
    await request(`/payment/wallet/orders/${order.orderId}/pay`, outsider.token, 'POST', undefined, 404);
  });

  await t.test('Catalog multipart media survives reload and is served through Gateway', async () => {
    const data = new FormData();
    data.set('file', new Blob([TEST_ORDER_IMAGE], { type: 'image/png' }), 'cover.png');
    const media = await request(`/catalog/medias/services/${digital.serviceId}/upload?cover=true`, provider.token, 'POST', data);
    assert.ok(media.url.startsWith('/medias/'));
    const response = await fetch(gateway + '/catalog' + media.url);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), TEST_ORDER_IMAGE);
    const reloaded = await request(`/catalog/medias/services/${digital.serviceId}`, provider.token);
    assert.ok(reloaded.data.some(row => row.serviceMediaId === media.serviceMediaId));
  });

  await t.test('price amendments settle through the wallet and preserve server versions', async () => {
    const amendment = await request(`/order/orders/${order.orderId}/amendments`, provider.token, 'POST', { newPrice: 120000, reason: 'Additional agreed deliverable' });
    const accepted = await request(`/order/orders/${order.orderId}/amendments/${amendment.amendmentId}/accept`, client.token, 'POST');
    assert.equal(accepted.status, 'AWAITING_PAYMENT');
    const walletBefore = await request('/payment/wallet', client.token);
    const settled = await request(`/order/orders/${order.orderId}/amendments/${amendment.amendmentId}/settle`, client.token, 'POST');
    assert.equal(settled.status, 'APPLIED');
    assert.equal((await request('/payment/wallet', client.token)).balance, walletBefore.balance - 20000);
    assert.equal((await request(`/order/orders/${order.orderId}`, client.token)).order.totalAmount, 120000);
  });

  await t.test('DIGITAL file delivery has ownership checks, revisions and final acceptance', async () => {
    await request(`/order/orders/digital/${order.orderId}/requirements`, client.token, 'POST', { values: { description: 'Blue logo', references: 'Original artwork' } });
    const data = new FormData();
    data.set('context', 'DELIVERY');
    data.set('file', new Blob([TEST_ORDER_IMAGE], { type: 'image/png' }), 'delivery.png');
    const file = await request(`/order/orders/${order.orderId}/files`, provider.token, 'POST', data);
    const submit = () => request(`/order/orders/digital/${order.orderId}/submissions`, provider.token, 'POST', { message: 'Original artwork', files: [{ fileId: file.storedFileId }] });
    await submit();
    await request(`/order/orders/${order.orderId}/files/${file.storedFileId}/download-url`, outsider.token, 'GET', undefined, 404);
    const signed = await request(`/order/orders/${order.orderId}/files/${file.storedFileId}/download-url`, client.token);
    const response = await fetch(gateway + '/order' + signed.url, { headers: { Authorization: 'Bearer ' + client.token } });
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), TEST_ORDER_IMAGE);
    await request(`/order/orders/digital/${order.orderId}/revisions`, client.token, 'POST', { reason: 'Make the blue darker' });
    await submit();
    await request(`/order/orders/digital/${order.orderId}/accept`, client.token, 'POST');
    assert.equal((await request(`/order/orders/${order.orderId}`, client.token)).order.orderStatus, 'COMPLETED');
  });

  await t.test('ONSITE cash requires provider receipt and client acceptance, without wallet escrow', async () => {
    const start = new Date(Date.now() + 15 * 60000);
    const end = new Date(start.getTime() + 2 * 3600000);
    const localDay = new Date(start.getTime() + 7 * 3600000);
    await request(`/catalog/rules/services/${onsite.serviceId}`, provider.token, 'POST', {
      status: 'ACTIVE', slotDurationMinute: 30, startTime: start.toISOString(), endTime: end.toISOString(), dayOfWeek: (localDay.getUTCDay() || 7) + 1,
    });
    const slots = await request(`/catalog/slots/services/${onsite.serviceId}?size=100`, client.token);
    const slot = slots.data.find(row => row.status === 'AVAILABLE');
    assert.ok(slot);
    const cash = await request('/order/orders', client.token, 'POST', { ...onsite, addonIds: [], paymentMethod: 'CASH', bookingSlotId: slot.bookingSlotId, address: 'Synthetic fixture address' });
    assert.equal(cash.paymentMethod, 'CASH');
    assert.equal(cash.orderStatus, 'CONFIRMED');
    await request(`/payment/wallet/orders/${cash.orderId}/pay`, client.token, 'POST', undefined, 400);
    await request(`/payment/escrows/orders/${cash.orderId}`, client.token, 'GET', undefined, 404);
    const providerWallet = await request('/payment/wallet', provider.token);
    assert.ok(providerWallet.balance >= 50000);
    await request('/payment/wallet/payouts', provider.token, 'POST', {
      amount: providerWallet.balance, bankCode: 'VCB', accountNumber: '000000000001', accountName: 'E2E PROVIDER',
    });
    const code = await request(`/order/orders/onsite/${cash.orderId}/checkin-code`, client.token);
    await request(`/order/orders/onsite/${cash.orderId}/checkin`, provider.token, 'POST', { code: code.checkinCode });
    await request(`/order/orders/onsite/${cash.orderId}/cash-received`, client.token, 'POST', undefined, 403);
    const firstReceipt = await request(`/order/orders/onsite/${cash.orderId}/cash-received`, provider.token, 'POST');
    const replay = await request(`/order/orders/onsite/${cash.orderId}/cash-received`, provider.token, 'POST');
    assert.equal(Date.parse(replay.cashReceivedAt), Date.parse(firstReceipt.cashReceivedAt));
    const evidence = new FormData();
    evidence.set('context', 'WORK_EVIDENCE');
    evidence.set('file', new Blob([TEST_ORDER_IMAGE], { type: 'image/png' }), 'after.png');
    const file = await request(`/order/orders/${cash.orderId}/files`, provider.token, 'POST', evidence);
    await request(`/order/orders/${cash.orderId}/evidence`, provider.token, 'POST', { phase: 'AFTER', fileId: file.storedFileId });
    await request(`/order/orders/onsite/${cash.orderId}/complete`, provider.token, 'POST');
    assert.equal((await request(`/order/orders/${cash.orderId}`, client.token)).order.orderStatus, 'DELIVERED');
    await request(`/order/orders/onsite/${cash.orderId}/accept`, client.token, 'POST');
    assert.equal((await request(`/order/orders/${cash.orderId}`, client.token)).order.orderStatus, 'COMPLETED');
    const fees = await request('/payment/wallet/fees', provider.token);
    assert.equal(fees.filter(row => row.orderId === cash.orderId).length, 1);
    const withDebt = await request('/payment/wallet', provider.token);
    assert.equal(withDebt.balance, -10000);
    assert.equal(withDebt.mayStartNewWork, false);
    assert.equal(withDebt.outstandingFee, 10000);
    await request('/order/orders', client.token, 'POST', { ...digital, addonIds: [], paymentMethod: 'WALLET' }, 409);
    await topUpFromMockGateway(gateway, provider.token, 10000);
    const recovered = await request('/payment/wallet', provider.token);
    assert.equal(recovered.balance, 0);
    assert.equal(recovered.outstandingFee, 0);
    assert.equal(recovered.mayStartNewWork, true);
  });

  await t.test('admin read operations enforce the current account role', async () => {
    for (const path of ['/order/admin/orders', '/payment/admin/fee-policies', '/identity/admin/audit-logs', '/catalog/admin/audit-logs']) {
      await request(path, admin);
      await request(path, client.token, 'GET', undefined, 403);
      await request(path, null, 'GET', undefined, 401);
    }
  });

  await t.test('role changes reject an old token and stale account version', async () => {
    const userId = JSON.parse(Buffer.from(outsider.token.split('.')[1], 'base64url').toString()).userId;
    const target = await request(`/identity/users/${userId}`, admin);
    const change = { roleName: 'ADMIN', reason: 'Isolated frontend admin verification', version: target.version };
    await request(`/identity/users/${userId}/roles/grant`, admin, 'POST', change);
    await request('/identity/users/myInfo', outsider.token, 'GET', undefined, 401);
    await request(`/identity/users/${userId}/roles/grant`, admin, 'POST', change, 409);
    const refreshed = (await request('/identity/auth/token', null, 'POST', outsider.credentials)).token;
    await request('/payment/admin/payouts', refreshed);
    await request('/payment/admin/payouts', client.token, 'GET', undefined, 403);
  });
});
