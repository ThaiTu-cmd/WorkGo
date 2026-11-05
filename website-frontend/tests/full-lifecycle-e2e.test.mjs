import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8888/api/v1';

// Helper to query postgres databases via docker exec
function queryDb(container, dbName, sql) {
  try {
    const cmd = `docker exec ${container} psql -U postgres -d ${dbName} -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (err) {
    console.error(`DB Query Error on ${container}/${dbName}:`, err.message);
    return null;
  }
}

// Generate random user for client testing
const ts = Date.now().toString().slice(-6);
const clientUser = {
  firstName: 'Test',
  lastName: 'Client',
  userName: `client_${ts}`,
  email: `client_${ts}@workgo.vn`,
  phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: 'Password123!',
};

let clientToken = '';
let providerToken = '';
let adminToken = '';

const DIGITAL_SERVICE_ID = '44444444-4444-4444-4444-444444444444';
const DIGITAL_PACKAGE_ID = '66666666-6666-6666-6666-111111111111';

const ONSITE_SERVICE_ID = 'a0000000-0000-0000-0000-000000000008';
const ONSITE_PACKAGE_ID = '45f717d3-5771-4dbc-1bb6-971c70dfcc0e';

let digitalOrderId = '';
let cancelPendingOrderId = '';
let cancelConfirmedOrderId = '';
let cancelInProgressOrderId = '';
let onsiteOrderId = '';
let onsiteSlotId = '';
let onsiteCheckinCode = '';
let verificationId = '';

function resetTestState() {
  queryDb(
    'catalog-postgres',
    'catalog_db',
    `UPDATE booking_slots SET status = 'AVAILABLE', order_id = NULL, hold_expires_at = NULL WHERE service_id = '${ONSITE_SERVICE_ID}'`
  );
  queryDb(
    'identity-postgres',
    'identity_db',
    `DELETE FROM provider_verification WHERE provider_profile_id = (SELECT provider_profile_id FROM provider_profiles WHERE user_id = (SELECT user_id FROM users WHERE user_name = 'nguyenvana'))`
  );
}

test.before(async () => {
  // Idempotent test setup: reset test slots & clear past provider verification records
  resetTestState();

  // 1. Register and Login Client
  const regRes = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientUser),
  });
  assert.equal(regRes.status, 200, 'Client registration failed');

  const clientLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: clientUser.userName, password: clientUser.password }),
  });
  const clientLoginData = await clientLoginRes.json();
  assert.equal(clientLoginData.code, 1000, 'Client login failed');
  clientToken = clientLoginData.result.token;
  assert.ok(clientToken, 'Client token is missing');

  // 2. Login Provider (nguyenvana)
  const provLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'nguyenvana', password: 'Provider@123' }),
  });
  const provLoginData = await provLoginRes.json();
  assert.equal(provLoginData.code, 1000, 'Provider login failed');
  providerToken = provLoginData.result.token;
  assert.ok(providerToken, 'Provider token is missing');

  // 3. Login Admin (admin)
  const adminLoginRes = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'admin', password: 'admin' }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert.equal(adminLoginData.code, 1000, 'Admin login failed');
  adminToken = adminLoginData.result.token;
  assert.ok(adminToken, 'Admin token is missing');
});

test('TC-01: Tạo đơn hàng Digital thật & lưu DB', async () => {
  const res = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      serviceId: DIGITAL_SERVICE_ID,
      packageId: DIGITAL_PACKAGE_ID,
      addonIds: [],
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
  assert.equal(data.code, 1000);
  assert.ok(data.result?.orderId);
  assert.equal(data.result.orderStatus, 'PENDING_PAYMENT');
  assert.equal(data.result.paymentStatus, 'PENDING');
  digitalOrderId = data.result.orderId;

  // Verify in PostgreSQL order_db
  const dbStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${digitalOrderId}'`
  );
  assert.equal(dbStatus, 'PENDING_PAYMENT', 'Database record order_status mismatch');
});

test('TC-02: Thanh toán Escrow chuyển trạng thái đơn hàng sang CONFIRMED', async () => {
  const res = await fetch(`${GATEWAY_URL}/order/internal/orders/${digitalOrderId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
  });

  assert.equal(res.status, 200, `Confirm payment failed with status ${res.status}`);
  const data = await res.json();
  assert.equal(data.orderStatus, 'CONFIRMED');
  assert.equal(data.paymentStatus, 'SUCCEEDED');

  // Verify in PostgreSQL order_db: execution and digital_execution created
  const execStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT de.status FROM digital_executions de JOIN executions e ON de.execution_id = e.execution_id WHERE e.order_id = '${digitalOrderId}'`
  );
  assert.equal(execStatus, 'AWAITING_REQUIREMENTS', 'Digital execution should be AWAITING_REQUIREMENTS');
});

test('TC-03: Khách nộp yêu cầu Digital chuyển trạng thái sang IN_PROGRESS', async () => {
  const res = await fetch(`${GATEWAY_URL}/order/orders/digital/${digitalOrderId}/requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      values: {
        note: 'Yêu cầu thiết kế logo tông màu xanh navy và vàng gold sang trọng.',
        companyName: 'WorkGo Tech Corp',
      },
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 200, `Submit requirements failed: ${JSON.stringify(data)}`);
  assert.equal(data.code, 1000);

  // Check order status
  const orderStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${digitalOrderId}'`
  );
  assert.equal(orderStatus, 'IN_PROGRESS', 'Order status should transition to IN_PROGRESS');

  const digitalStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT de.status FROM digital_executions de JOIN executions e ON de.execution_id = e.execution_id WHERE e.order_id = '${digitalOrderId}'`
  );
  assert.equal(digitalStatus, 'WORKING', 'Digital execution should transition to WORKING');
});

test('TC-04: Chuyên gia nộp bài bàn giao chuyển trạng thái sang DELIVERED', async () => {
  const res = await fetch(`${GATEWAY_URL}/order/orders/digital/${digitalOrderId}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({
      message: 'Gửi khách hàng bản demo logo đợt 1 và link source vector.',
      files: [
        {
          fileUrl: 'https://cdn.workgo.vn/deliveries/logo_v1.png',
          fileName: 'logo_v1.png',
          mimeType: 'image/png',
          sizeBytes: 2048576,
          fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 200, `Submit delivery failed: ${JSON.stringify(data)}`);
  assert.equal(data.code, 1000);
  assert.ok(data.result?.deliveryPackageId);

  // Verify in PostgreSQL order_db
  const orderStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${digitalOrderId}'`
  );
  assert.equal(orderStatus, 'DELIVERED', 'Order status should transition to DELIVERED');

  const countPackages = queryDb(
    'order-postgres',
    'order_db',
    `SELECT count(*) FROM delivery_packages dp JOIN executions e ON dp.execution_id = e.execution_id WHERE e.order_id = '${digitalOrderId}'`
  );
  assert.equal(countPackages, '1', 'Delivery packages count should be 1');
});

test('TC-05: Khách yêu cầu chỉnh sửa (Revision) chuyển trạng thái sang REVISING', async () => {
  const res = await fetch(`${GATEWAY_URL}/order/orders/digital/${digitalOrderId}/revisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      reason: 'Cần tăng độ tương phản của chữ và làm biểu tượng dày hơn 1 chút.',
    }),
  });

  const data = await res.json();
  assert.equal(res.status, 200, `Request revision failed: ${JSON.stringify(data)}`);
  assert.equal(data.code, 1000);
  assert.ok(data.result?.revisionRequestId);

  const digitalStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT de.status FROM digital_executions de JOIN executions e ON de.execution_id = e.execution_id WHERE e.order_id = '${digitalOrderId}'`
  );
  assert.equal(digitalStatus, 'WORKING', 'Digital execution should transition to WORKING');

  const revisionsUsed = queryDb(
    'order-postgres',
    'order_db',
    `SELECT de.revisions_used FROM digital_executions de JOIN executions e ON de.execution_id = e.execution_id WHERE e.order_id = '${digitalOrderId}'`
  );
  assert.equal(revisionsUsed, '1', 'Revisions used count should be incremented to 1');
});

test('TC-06: Khách nghiệm thu Digital (Accept) hoàn tất đơn hàng COMPLETED', async () => {
  // Provider submits second delivery
  const subRes = await fetch(`${GATEWAY_URL}/order/orders/digital/${digitalOrderId}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({
      message: 'Bàn giao logo v2 đã chỉnh sửa theo phản hồi.',
      files: [
        {
          fileUrl: 'https://cdn.workgo.vn/deliveries/logo_v2.png',
          fileName: 'logo_v2.png',
          mimeType: 'image/png',
          sizeBytes: 2148576,
          fileHash: 'abcdef1234567890',
        },
      ],
    }),
  });
  assert.equal(subRes.status, 200);

  // Client accepts
  const acceptRes = await fetch(`${GATEWAY_URL}/order/orders/digital/${digitalOrderId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
  });

  const acceptData = await acceptRes.json();
  assert.equal(acceptRes.status, 200, `Accept delivery failed: ${JSON.stringify(acceptData)}`);
  assert.equal(acceptData.code, 1000);

  // Check order status COMPLETED in order_db
  const orderStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${digitalOrderId}'`
  );
  assert.equal(orderStatus, 'COMPLETED', 'Order status should transition to COMPLETED');
});

test('TC-07: Hủy đơn tức thì khi chưa thanh toán (AUTO_APPROVED)', async () => {
  // Create order
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      serviceId: DIGITAL_SERVICE_ID,
      packageId: DIGITAL_PACKAGE_ID,
      addonIds: [],
    }),
  });
  const createData = await createRes.json();
  cancelPendingOrderId = createData.result.orderId;

  // Cancel immediately
  const cancelRes = await fetch(`${GATEWAY_URL}/order/orders/${cancelPendingOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      reasonCode: 'CHANGED_MIND',
      note: 'Khách hàng đổi ý trước khi thanh toán',
    }),
  });

  const cancelData = await cancelRes.json();
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelData.code, 1000);
  assert.equal(cancelData.result.status, 'AUTO_APPROVED', 'Cancellation status should be AUTO_APPROVED');

  const orderStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${cancelPendingOrderId}'`
  );
  assert.equal(orderStatus, 'CANCELLED', 'Order status should be CANCELLED');

  const crStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT status FROM cancellation_requests WHERE order_id = '${cancelPendingOrderId}'`
  );
  assert.equal(crStatus, 'AUTO_APPROVED', 'cancellation_requests table status should be AUTO_APPROVED');
});

test('TC-08: Yêu cầu hủy đơn đã xác nhận & Đối tác Duyệt (PENDING -> ACCEPTED)', async () => {
  // Create & Confirm order
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      serviceId: DIGITAL_SERVICE_ID,
      packageId: DIGITAL_PACKAGE_ID,
      addonIds: [],
    }),
  });
  const createData = await createRes.json();
  cancelConfirmedOrderId = createData.result.orderId;

  await fetch(`${GATEWAY_URL}/order/internal/orders/${cancelConfirmedOrderId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  // Client requests cancellation
  const cancelReqRes = await fetch(`${GATEWAY_URL}/order/orders/${cancelConfirmedOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      reasonCode: 'LATE',
      note: 'Dự án tạm dừng do thay đổi kế hoạch',
    }),
  });
  const cancelReqData = await cancelReqRes.json();
  assert.equal(cancelReqData.result.status, 'PENDING', 'Cancellation status should be PENDING');

  // Provider responds ACCEPT
  const respondRes = await fetch(`${GATEWAY_URL}/order/orders/${cancelConfirmedOrderId}/cancel/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({ accept: true }),
  });
  const respondData = await respondRes.json();
  assert.equal(respondData.code, 1000);
  assert.equal(respondData.result.status, 'ACCEPTED', 'Cancellation status should be ACCEPTED');

  const orderStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${cancelConfirmedOrderId}'`
  );
  assert.equal(orderStatus, 'CANCELLED', 'Order should transition to CANCELLED');
});

test('TC-09: Yêu cầu hủy đơn & Đối tác Từ chối (PENDING -> REJECTED)', async () => {
  // Create, Confirm & Submit requirements
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      serviceId: DIGITAL_SERVICE_ID,
      packageId: DIGITAL_PACKAGE_ID,
      addonIds: [],
    }),
  });
  const createData = await createRes.json();
  cancelInProgressOrderId = createData.result.orderId;

  await fetch(`${GATEWAY_URL}/order/internal/orders/${cancelInProgressOrderId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  await fetch(`${GATEWAY_URL}/order/orders/digital/${cancelInProgressOrderId}/requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ values: { note: 'Bắt đầu dự án' } }),
  });

  // Client sends cancellation request
  const cancelReqRes = await fetch(`${GATEWAY_URL}/order/orders/${cancelInProgressOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      reasonCode: 'OTHER',
      note: 'Yêu cầu hủy đơn đang thực hiện',
    }),
  });
  const cancelReqData = await cancelReqRes.json();
  assert.equal(cancelReqData.result.status, 'PENDING');

  // Provider rejects cancellation
  const rejectRes = await fetch(`${GATEWAY_URL}/order/orders/${cancelInProgressOrderId}/cancel/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({ accept: false }),
  });
  const rejectData = await rejectRes.json();
  assert.equal(rejectData.code, 1000);
  assert.equal(rejectData.result.status, 'REJECTED', 'Cancellation status should be REJECTED');

  const orderStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${cancelInProgressOrderId}'`
  );
  assert.equal(orderStatus, 'IN_PROGRESS', 'Order should remain IN_PROGRESS after rejection');
});

test('TC-10: Đặt dịch vụ tận nơi (Onsite) kèm Slot & Địa chỉ', async () => {
  // 1. Get an available slot for Onsite service
  const slotsRes = await fetch(`${GATEWAY_URL}/catalog/slots/services/${ONSITE_SERVICE_ID}`);
  const slotsData = await slotsRes.json();
  assert.ok(slotsData.result?.data?.length > 0, 'No slots available for onsite service');

  const availableSlot = slotsData.result.data.find((s) => s.status === 'AVAILABLE');
  assert.ok(availableSlot, 'No slot with AVAILABLE status found');
  onsiteSlotId = availableSlot.bookingSlotId;

  // 2. Create Onsite order
  const createRes = await fetch(`${GATEWAY_URL}/order/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      serviceId: ONSITE_SERVICE_ID,
      packageId: ONSITE_PACKAGE_ID,
      addonIds: [],
      bookingSlotId: onsiteSlotId,
      address: '789 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh',
    }),
  });

  const createData = await createRes.json();
  assert.equal(createRes.status, 200, `Create onsite order failed: ${JSON.stringify(createData)}`);
  assert.equal(createData.code, 1000);
  assert.equal(createData.result.executionType, 'ONSITE');
  onsiteOrderId = createData.result.orderId;

  // Verify slot in catalog_db transitioned to HELD
  const slotStatus = queryDb(
    'catalog-postgres',
    'catalog_db',
    `SELECT status FROM booking_slots WHERE booking_slot_id = '${onsiteSlotId}'`
  );
  assert.equal(slotStatus, 'HELD', 'Slot status in catalog_db should be HELD');
});

test('TC-11: Thực thi Onsite: Check-in -> Báo xong việc -> Nghiệm thu', async () => {
  // Confirm payment for Onsite order -> generates checkin code
  const confirmRes = await fetch(`${GATEWAY_URL}/order/internal/orders/${onsiteOrderId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const confirmData = await confirmRes.json();
  assert.equal(confirmRes.status, 200);
  onsiteCheckinCode = confirmData.checkinCode;
  assert.ok(onsiteCheckinCode, 'Checkin code must be generated for onsite order');

  // Verify slot transitioned to BOOKED
  const slotStatus = queryDb(
    'catalog-postgres',
    'catalog_db',
    `SELECT status FROM booking_slots WHERE booking_slot_id = '${onsiteSlotId}'`
  );
  assert.equal(slotStatus, 'BOOKED', 'Slot status in catalog_db should be BOOKED');

  // Align scheduled_start to NOW() in order_db to satisfy check-in window (within 30 mins)
  queryDb(
    'order-postgres',
    'order_db',
    `UPDATE onsite_executions SET scheduled_start = NOW() WHERE execution_id = (SELECT execution_id FROM executions WHERE order_id = '${onsiteOrderId}')`
  );

  // Provider Check-in
  const checkinRes = await fetch(`${GATEWAY_URL}/order/orders/onsite/${onsiteOrderId}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({ code: onsiteCheckinCode }),
  });
  const checkinData = await checkinRes.json();
  assert.equal(checkinRes.status, 200, `Checkin failed: ${JSON.stringify(checkinData)}`);
  assert.equal(checkinData.code, 1000);
  assert.equal(checkinData.result.status, 'IN_SERVICE');

  // Provider submits work evidence (phase: AFTER required before completion)
  const evidenceRes = await fetch(`${GATEWAY_URL}/order/orders/${onsiteOrderId}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({
      phase: 'AFTER',
      fileUrl: 'https://cdn.workgo.vn/evidence/onsite_after_repair.jpg',
      latitude: 10.762622,
      longitude: 106.660172,
    }),
  });
  const evidenceData = await evidenceRes.json();
  assert.equal(evidenceRes.status, 200, `Upload evidence failed: ${JSON.stringify(evidenceData)}`);
  assert.equal(evidenceData.code, 1000);

  // Provider completes work
  const completeRes = await fetch(`${GATEWAY_URL}/order/orders/onsite/${onsiteOrderId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
  });
  const completeData = await completeRes.json();
  assert.equal(completeRes.status, 200, `Complete failed: ${JSON.stringify(completeData)}`);
  assert.equal(completeData.code, 1000);
  assert.equal(completeData.result.status, 'SERVICE_DONE');

  // Client accepts onsite work
  const acceptRes = await fetch(`${GATEWAY_URL}/order/orders/onsite/${onsiteOrderId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
  });
  const acceptData = await acceptRes.json();
  assert.equal(acceptRes.status, 200, `Accept failed: ${JSON.stringify(acceptData)}`);
  assert.equal(acceptData.code, 1000);
  assert.equal(acceptData.result.status, 'ACCEPT');

  // Check order is COMPLETED
  const finalStatus = queryDb(
    'order-postgres',
    'order_db',
    `SELECT order_status FROM orders WHERE order_id = '${onsiteOrderId}'`
  );
  assert.equal(finalStatus, 'COMPLETED', 'Onsite order should be COMPLETED');
});

test('TC-12: Hồ sơ xác thực chuyên gia (Verification Center) & Admin duyệt', async () => {
  // Provider submits verification profile
  const subRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${providerToken}`,
    },
    body: JSON.stringify({
      verificationType: 'IDENTITY_CARD',
      documentType: 'CCCD',
      documentNumber: '079201012345',
      documentUrl: 'https://cdn.workgo.vn/id/cccd_sample.jpg',
      note: 'Hồ sơ xác minh căn cước công dân gắn chip',
    }),
  });
  const subData = await subRes.json();
  assert.equal(subRes.status, 200, `Submit verification failed: ${JSON.stringify(subData)}`);
  assert.equal(subData.code, 1000);
  verificationId = subData.result.providerVerificationId;
  assert.ok(verificationId, 'Verification ID missing');
  assert.equal(subData.result.verificationStatus, 'PENDING');

  // Admin reviews verification
  const reviewRes = await fetch(`${GATEWAY_URL}/identity/provider-verifications/${verificationId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      verificationStatus: 'VERIFIED',
    }),
  });
  const reviewData = await reviewRes.json();
  assert.equal(reviewRes.status, 200, `Review verification failed: ${JSON.stringify(reviewData)}`);
  assert.equal(reviewData.code, 1000);
  assert.equal(reviewData.result.verificationStatus, 'VERIFIED');

  // Verify in PostgreSQL identity_db
  const dbStatus = queryDb(
    'identity-postgres',
    'identity_db',
    `SELECT verification_status FROM provider_verification WHERE provider_verification_id = '${verificationId}'`
  );
  assert.equal(dbStatus, 'VERIFIED', 'Verification status in identity_db should be VERIFIED');
});

test.after(async () => {
  resetTestState();
});
