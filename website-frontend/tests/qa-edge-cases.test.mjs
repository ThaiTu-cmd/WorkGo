import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { getCheckinCode, payViaMock } from './helpers/payment.mjs';

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

const ts = Date.now().toString().slice(-6);
const clientUser = {
  firstName: 'Edge',
  lastName: 'Tester',
  userName: `edge_${ts}`,
  email: `edge_${ts}@workgo.vn`,
  phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Password123!',
};

let clientToken = '';
let providerToken = '';

const DIGITAL_SERVICE_ID = '44444444-4444-4444-4444-444444444444';
const DIGITAL_PACKAGE_ID = '66666666-6666-6666-6666-111111111111';

// Onsite service 0010: Sửa máy giặt, tủ lạnh tại nhà (belongs to nguyenvana)
const ONSITE_SERVICE_ID = 'a0000000-0000-0000-0000-000000000010';
const ONSITE_PACKAGE_ID = '9b50841d-d236-f685-3004-f1bac9bd7ca1';

function resetTestSlots() {
  queryDb(
    'catalog-postgres',
    'catalog_db',
    `UPDATE booking_slots SET status = 'AVAILABLE', order_id = NULL, hold_expires_at = NULL WHERE service_id = '${ONSITE_SERVICE_ID}'`
  );
}

test.before(async () => {
  // Idempotent test setup: reset slots for ONSITE_SERVICE_ID to AVAILABLE
  resetTestSlots();

  // Register & login client
  await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientUser),
  });

  const clientLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: clientUser.userName, password: clientUser.password }),
  });
  const clientLoginData = await clientLoginRes.json();
  clientToken = clientLoginData.result.token;

  // Provider (nguyenvana)
  const provLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'nguyenvana', password: 'Provider@123' }),
  });
  const provLoginData = await provLoginRes.json();
  providerToken = provLoginData.result.token;
});

test('TC-EDGE-01: Chặn bên yêu cầu tự duyệt đơn hủy của chính mình (ORDER_CANCELLATION_SELF_RESPOND)', async () => {
  // 1. Tạo & confirm đơn
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ serviceId: DIGITAL_SERVICE_ID, packageId: DIGITAL_PACKAGE_ID, addonIds: [] }),
  });
  const orderId = (await createRes.json()).result.orderId;
  await payViaMock(GATEWAY_URL, clientToken, orderId);

  // 2. Client gửi yêu cầu hủy
  await fetch(`${GATEWAY_URL}/order/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ reasonCode: 'CHANGED_MIND', note: 'Tôi muốn hủy' }),
  });

  // 3. Client cố tình tự duyệt (respond) yêu cầu hủy của mình -> bị chặn 403 Forbidden (Code 3018)
  const selfRespondRes = await fetch(`${GATEWAY_URL}/order/orders/${orderId}/cancel/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ accept: true }),
  });

  assert.equal(selfRespondRes.status, 403, 'Server must return HTTP 403 Forbidden when self-responding');
  const errData = await selfRespondRes.json();
  assert.equal(errData.code, 3018, 'Error code must be 3018 (ORDER_CANCELLATION_SELF_RESPOND)');
});

test('TC-EDGE-02: Chặn gửi trùng yêu cầu hủy trên cùng một đơn hàng (ORDER_CANCELLATION_EXISTED)', async () => {
  // 1. Tạo & confirm đơn
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ serviceId: DIGITAL_SERVICE_ID, packageId: DIGITAL_PACKAGE_ID, addonIds: [] }),
  });
  const orderId = (await createRes.json()).result.orderId;
  await payViaMock(GATEWAY_URL, clientToken, orderId);

  // 2. Gửi yêu cầu hủy lần 1
  const cancel1 = await fetch(`${GATEWAY_URL}/order/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ reasonCode: 'LATE', note: 'Lần 1' }),
  });
  assert.equal(cancel1.status, 200);

  // 3. Gửi yêu cầu hủy lần 2 (khi lần 1 đang PENDING) -> HTTP 409 Conflict (Code 3015)
  const cancel2 = await fetch(`${GATEWAY_URL}/order/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ reasonCode: 'LATE', note: 'Lần 2 trùng lặp' }),
  });

  assert.equal(cancel2.status, 409, 'Server must return HTTP 409 Conflict on duplicate cancellation request');
  const errData = await cancel2.json();
  assert.equal(errData.code, 3015, 'Error code must be 3015 (ORDER_CANCELLATION_EXISTED)');
});

test('TC-EDGE-03: Chặn hủy đơn hàng đã hoàn tất (COMPLETED)', async () => {
  // Tạo đơn digital hoàn chỉnh qua các bước
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ serviceId: DIGITAL_SERVICE_ID, packageId: DIGITAL_PACKAGE_ID, addonIds: [] }),
  });
  const orderId = (await createRes.json()).result.orderId;
  await payViaMock(GATEWAY_URL, clientToken, orderId);
  await fetch(`${GATEWAY_URL}/order/orders/digital/${orderId}/requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ values: { note: 'Done quickly' } }),
  });
  await fetch(`${GATEWAY_URL}/order/orders/digital/${orderId}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ message: 'Done', files: [{ fileUrl: 'https://cdn.workgo.vn/f.png', fileName: 'f.png', mimeType: 'image/png', sizeBytes: 100, fileHash: 'hash' }] }),
  });
  await fetch(`${GATEWAY_URL}/order/orders/digital/${orderId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  // Verify order is COMPLETED
  const status = queryDb('order-postgres', 'order_db', `SELECT order_status FROM orders WHERE order_id = '${orderId}'`);
  assert.equal(status, 'COMPLETED');

  // Client cố tình hủy đơn đã hoàn tất -> HTTP 400 (Code 2005)
  const cancelRes = await fetch(`${GATEWAY_URL}/order/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ reasonCode: 'CHANGED_MIND', note: 'Đã nhận hàng nhưng muốn hủy' }),
  });

  assert.equal(cancelRes.status, 400, 'Server must return HTTP 400 when cancelling completed order');
  const errData = await cancelRes.json();
  assert.equal(errData.code, 2005, 'Error code must be 2005 (ORDER_CANCEL_NOT_ALLOWED)');
});

test('TC-EDGE-04: Chuyên gia Check-in Onsite thất bại khi nhập sai mã xác thực (Invalid Checkin Code)', async () => {
  // 1. Tìm slot trống cho service 0010
  const slotsRes = await fetch(`${GATEWAY_URL}/catalog/slots/services/${ONSITE_SERVICE_ID}`);
  const slotsData = await slotsRes.json();
  const availableSlot = slotsData.result.data.find((s) => s.status === 'AVAILABLE');
  assert.ok(availableSlot, 'Must have available slot for service 0010');

  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({
      serviceId: ONSITE_SERVICE_ID,
      packageId: ONSITE_PACKAGE_ID,
      addonIds: [],
      bookingSlotId: availableSlot.bookingSlotId,
      address: '123 Edge Test Street',
    }),
  });
  const orderId = (await createRes.json()).result.orderId;
  await payViaMock(GATEWAY_URL, clientToken, orderId);

  // Align scheduled_start to NOW()
  queryDb(
    'order-postgres',
    'order_db',
    `UPDATE onsite_executions SET scheduled_start = NOW() WHERE execution_id = (SELECT execution_id FROM executions WHERE order_id = '${orderId}')`
  );

  // 2. Provider Checkin với sai mã (999999) -> HTTP 400 (Code 3003)
  const wrongCheckinRes = await fetch(`${GATEWAY_URL}/order/orders/onsite/${orderId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ code: '999999' }),
  });

  assert.equal(wrongCheckinRes.status, 400, 'Checkin with wrong code must return 400');
  const errData = await wrongCheckinRes.json();
  assert.equal(errData.code, 3003, 'Error code must be 3003 (ORDER_CHECKIN_CODE_INVALID)');
});

test('TC-EDGE-05: Chặn hoàn tất Onsite nếu thiếu bằng chứng thi công (Evidence AFTER required)', async () => {
  // Tìm slot trống tiếp theo
  const slotsRes = await fetch(`${GATEWAY_URL}/catalog/slots/services/${ONSITE_SERVICE_ID}`);
  const slotsData = await slotsRes.json();
  const availableSlot = slotsData.result.data.find((s) => s.status === 'AVAILABLE');
  assert.ok(availableSlot, 'Must have available slot for service 0010');

  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({
      serviceId: ONSITE_SERVICE_ID,
      packageId: ONSITE_PACKAGE_ID,
      addonIds: [],
      bookingSlotId: availableSlot.bookingSlotId,
      address: '456 Proof Test Street',
    }),
  });
  const orderId = (await createRes.json()).result.orderId;
  await payViaMock(GATEWAY_URL, clientToken, orderId);
  const checkinCode = await getCheckinCode(GATEWAY_URL, clientToken, orderId);

  queryDb(
    'order-postgres',
    'order_db',
    `UPDATE onsite_executions SET scheduled_start = NOW() WHERE execution_id = (SELECT execution_id FROM executions WHERE order_id = '${orderId}')`
  );

  // Checkin đúng mã
  await fetch(`${GATEWAY_URL}/order/orders/onsite/${orderId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ code: checkinCode }),
  });

  // Cố tình Complete NGAY mà KHÔNG upload evidence AFTER -> HTTP 400 (Code 3005)
  const completeRes = await fetch(`${GATEWAY_URL}/order/orders/onsite/${orderId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
  });

  assert.equal(completeRes.status, 400, 'Complete without AFTER evidence must be rejected with 400');
  const errData = await completeRes.json();
  assert.equal(errData.code, 3005, 'Error code must be 3005 (ORDER_EVIDENCE_AFTER_REQUIRED)');
});

test('TC-EDGE-06: Bảo mật phân quyền - Người dùng không phải ADMIN bị từ chối duyệt xác thực (HTTP 401/403)', async () => {
  // Lấy một verification ID đang có trong database hoặc fallback UUID
  let verifId = queryDb(
    'identity-postgres',
    'identity_db',
    `SELECT provider_verification_id FROM provider_verification LIMIT 1`
  );
  if (!verifId) {
    verifId = '11111111-1111-1111-1111-111111111111';
  }

  // Client thông thường (role: USER) cố tình gọi API duyệt hồ sơ của Admin
  const illegalReviewRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications/${verifId}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ verificationStatus: 'VERIFIED' }),
  });

  assert.ok([401, 403].includes(illegalReviewRes.status), `Expected 401 or 403, got ${illegalReviewRes.status}`);
});

test('TC-EDGE-07: Chặn truy cập API bảo vệ khi không có Token (HTTP 401)', async () => {
  const res = await fetch(`${GATEWAY_URL}/order/orders/my`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert.equal(res.status, 401, 'Request without Authorization header must return 401');
});

test('TC-EDGE-08: Nghiệm thu Digital thất bại khi chưa có bài nộp bàn giao nào', async () => {
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ serviceId: DIGITAL_SERVICE_ID, packageId: DIGITAL_PACKAGE_ID, addonIds: [] }),
  });
  const orderId = (await createRes.json()).result.orderId;
  await payViaMock(GATEWAY_URL, clientToken, orderId);

  // Client bấm nghiệm thu khi chưa có bàn giao
  const acceptRes = await fetch(`${GATEWAY_URL}/order/orders/digital/${orderId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  assert.equal(acceptRes.status, 400, 'Accept without submission must return HTTP 400');
});

test.after(async () => {
  resetTestSlots();
});
