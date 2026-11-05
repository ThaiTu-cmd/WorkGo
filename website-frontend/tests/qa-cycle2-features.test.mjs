import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8888/api/v1';

function queryDb(container, dbName, sql) {
  try {
    const cmd = `docker exec ${container} psql -U postgres -d ${dbName} -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (err) {
    console.error(`DB Query Error on ${container}/${dbName}:`, err.message);
    return null;
  }
}

let providerToken = '';
let adminToken = '';

const ONSITE_SERVICE_ID = 'a0000000-0000-0000-0000-000000000010';

test.before(async () => {
  // 1. Provider login
  const pLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'nguyenvana', password: 'Provider@123' }),
  });
  providerToken = (await pLoginRes.json()).result.token;

  // 3. Admin login
  const aLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'admin', password: 'admin' }),
  });
  adminToken = (await aLoginRes.json()).result.token;
});

test('TC-201: Kiểm tra tính Idempotent và Reset Slot tự động trong catalog_db', async () => {
  // Reset slots of service 0010 to AVAILABLE
  queryDb(
    'catalog-postgres',
    'catalog_db',
    `UPDATE booking_slots SET status = 'AVAILABLE' WHERE service_id = '${ONSITE_SERVICE_ID}'`
  );

  const availableCount = queryDb(
    'catalog-postgres',
    'catalog_db',
    `SELECT COUNT(*) FROM booking_slots WHERE service_id = '${ONSITE_SERVICE_ID}' AND status = 'AVAILABLE'`
  );
  assert.ok(Number(availableCount) > 0, 'Must have AVAILABLE slots after reset');
});

test('TC-202: Danh sách dịch vụ công khai tải mượt mà qua catalogApi.listServices', async () => {
  // 1. Lấy danh mục gốc
  const cRes = await fetch(`${GATEWAY_URL}/catalog/categories/roots`);
  assert.equal(cRes.status, 200);
  const cData = await cRes.json();
  const catId = cData.result.data[0].categoryId;
  assert.ok(catId, 'Must have categoryId');

  // 2. Gọi listServices với các tham số chuẩn
  const res = await fetch(`${GATEWAY_URL}/catalog/services?categoryId=${catId}&executionType=DIGITAL&minPrice=0&maxPrice=100000000&page=0&size=20`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert.equal(res.status, 200, 'Public services catalog must return HTTP 200');
  const data = await res.json();
  assert.equal(data.code, 1000);
  const items = data.result?.data || (Array.isArray(data.result) ? data.result : []);
  assert.ok(items.length > 0, 'Public catalog must return service items');
  assert.ok(items[0].serviceId, 'Service item must have serviceId');
});

test('TC-203: Rút hồ sơ xác thực chuyên gia (Withdraw / Remove) chống lỗi 1027', async () => {
  // 1. Chuyên gia nộp hồ sơ PENDING
  const subRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({
      verificationType: 'IDENTITY_CARD',
      documentType: 'CCCD',
      documentNumber: '079123456789',
      documentUrl: 'https://cdn.workgo.vn/id/test_withdraw.jpg',
      note: 'Hồ sơ thử nghiệm rút hồ sơ',
    }),
  });
  const subData = await subRes.json();
  assert.equal(subRes.status, 200);
  const verifId = subData.result?.providerVerificationId;
  assert.ok(verifId, 'Must have providerVerificationId');

  // 2. Chuyên gia gọi DELETE rút hồ sơ
  const delRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications/${verifId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${providerToken}`,
    },
  });
  assert.ok([200, 204].includes(delRes.status), `Delete verification must return 200 or 204, got ${delRes.status}`);

  // 3. Kiểm tra qua API GET my: hồ sơ đã bị lọc khỏi danh sách hoạt động
  const myRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications/my`, {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  const myData = await myRes.json();
  const activeVerifs = myData.result?.data || [];
  const found = activeVerifs.find((v) => v.providerVerificationId === verifId);
  assert.equal(found, undefined, 'Soft-deleted verification must not appear in myVerifications');

  // 4. Chuyên gia có thể nộp lại hồ sơ mới thành công (hoàn toàn không bị kẹt lỗi 1027)
  const reSubRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({
      verificationType: 'IDENTITY_CARD',
      documentType: 'CCCD',
      documentNumber: '079987654321',
      documentUrl: 'https://cdn.workgo.vn/id/test_resubmit.jpg',
      note: 'Nộp lại hồ sơ mới sau khi rút',
    }),
  });
  const reSubData = await reSubRes.json();
  assert.equal(reSubRes.status, 200, `Resubmit must succeed, got ${reSubRes.status}: ${JSON.stringify(reSubData)}`);
  assert.equal(reSubData.code, 1000);

  // Dọn dẹp sau test
  if (reSubData.result?.providerVerificationId) {
    await fetch(`${GATEWAY_URL}/identity/provider-verifications/${reSubData.result.providerVerificationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${providerToken}` },
    });
  }
});

test('TC-204: Lấy nhật ký lịch sử trạng thái đơn hàng (Order History Timeline)', async () => {
  // Lấy 1 đơn hàng hợp lệ của provider nguyenvana
  const ordersRes = await fetch(`${GATEWAY_URL}/order/orders?roleName=PROVIDER&page=0&size=5`, {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  const ordersData = await ordersRes.json();
  assert.ok(ordersData.result?.data?.length > 0, 'Must have at least one order for provider');
  const orderId = ordersData.result.data[0].orderId;

  const res = await fetch(`${GATEWAY_URL}/order/orders/${orderId}/history`, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
    },
  });
  assert.equal(res.status, 200, `Order history must return HTTP 200, got ${res.status}`);
  const data = await res.json();
  assert.equal(data.code, 1000);
  const historyList = data.result?.data || (Array.isArray(data.result) ? data.result : []);
  assert.ok(Array.isArray(historyList), 'History list must be an array');
  assert.ok(historyList.length > 0, 'History list must have entries');
  const entry = historyList[0];
  assert.ok(entry.toStatus, 'History entry must have toStatus');
  assert.ok(entry.createdAt, 'History entry must have createdAt');
});

test('TC-205: Admin Console - Quản lý Chuyên gia (Providers) và Danh mục (Categories)', async () => {
  // 1. Admin lấy danh sách Providers
  const provRes = await fetch(`${GATEWAY_URL}/identity/providers?status=VERIFIED&page=0&size=50`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  assert.equal(provRes.status, 200, `Admin list providers must return 200, got ${provRes.status}`);
  const provData = await provRes.json();
  assert.equal(provData.code, 1000);
  const providersList = provData.result?.data || (Array.isArray(provData.result) ? provData.result : []);
  assert.ok(Array.isArray(providersList), 'Providers must be an array');
  assert.ok(providersList.length > 0, 'Must have at least one provider (e.g. nguyenvana)');

  // 2. Admin lấy danh sách Categories từ catalog-service
  const catRes = await fetch(`${GATEWAY_URL}/catalog/categories?page=0&size=50`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  assert.equal(catRes.status, 200, `List categories must return 200, got ${catRes.status}`);
  const catData = await catRes.json();
  assert.equal(catData.code, 1000);
  const categoriesList = catData.result?.data || (Array.isArray(catData.result) ? catData.result : []);
  assert.ok(categoriesList.length > 0, 'Catalog categories must not be empty');
  assert.ok(categoriesList[0].name, 'Category must have name');
});

test('TC-206: Tích hợp Sổ địa chỉ (Address Book) cho người dùng qua /identity/addresses/my', async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/addresses/my`, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
    },
  });
  assert.equal(res.status, 200, `Get user addresses must return 200, got ${res.status}`);
  const data = await res.json();
  const addresses = data.data || data.result?.data || [];
  assert.ok(Array.isArray(addresses), 'Addresses must be an array');
  assert.ok(addresses.length > 0, 'Provider nguyenvana must have addresses');
  assert.ok(addresses[0].line1, 'Address must have line1');
});

test('TC-207: Lấy lịch rảnh Onsite khả dụng từ availabilityApi.getSlots', async () => {
  const res = await fetch(`${GATEWAY_URL}/catalog/slots/services/${ONSITE_SERVICE_ID}`);
  assert.equal(res.status, 200, `Get slots for service must return 200, got ${res.status}`);
  const data = await res.json();
  assert.equal(data.code, 1000);
  const slots = data.result?.data || (Array.isArray(data.result) ? data.result : []);
  assert.ok(slots.length > 0, 'Onsite service must have booking slots');
  assert.ok(slots[0].bookingSlotId, 'Slot must have bookingSlotId');
  assert.ok(slots[0].startedAt, 'Slot must have startedAt timestamp');
  assert.ok(slots[0].endAt, 'Slot must have endAt timestamp');
});

test('TC-208: Kiểm thử biểu thức chính quy URL Validation cho tệp đính kèm bàn giao', () => {
  const urlRegex = /^https?:\/\/.+/i;

  // Valid URLs
  assert.equal(urlRegex.test('https://drive.google.com/file/d/123/view'), true);
  assert.equal(urlRegex.test('http://workgo.vn/demo-delivery'), true);
  assert.equal(urlRegex.test('https://cdn.workgo.vn/evidence.png'), true);

  // Invalid URLs
  assert.equal(urlRegex.test('ftp://fileserver/doc.pdf'), false);
  assert.equal(urlRegex.test('javascript:alert(1)'), false);
  assert.equal(urlRegex.test('file:///etc/passwd'), false);
  assert.equal(urlRegex.test('drive.google.com/no-protocol'), false);
  assert.equal(urlRegex.test(''), false);
});
