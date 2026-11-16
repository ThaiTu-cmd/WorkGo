import test from "node:test";
import assert from "node:assert/strict";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8888/api/v1";

const testSuffix = Date.now().toString().slice(-6);
const testUser = {
  firstName: "Nguyen",
  lastName: "Bao",
  userName: `testuser_${testSuffix}`,
  email: `test_${testSuffix}@workgo.vn`,
  phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: "TestPassword123!"
};

test("TC-01: Đăng ký tài khoản người dùng mới qua API Gateway", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser)
  });

  const data = await res.json();
  assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
  assert.equal(data.code, 1000);
  assert.equal(data.result.userName, testUser.userName);
  assert.equal(data.result.email, testUser.email);
});

test("TC-02: Đăng nhập bằng chính xác Username", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: testUser.userName,
      password: testUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
  assert.ok(data.result.token && data.result.token.length > 20);
});

test("TC-03: Đăng nhập bằng Email đã đăng ký", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: testUser.email,
      password: testUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
  assert.ok(data.result.token);
});

test("TC-04: Đăng nhập Username viết hoa (Case-insensitive matching)", async () => {
  const upperUserName = testUser.userName.toUpperCase();
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: upperUserName,
      password: testUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
});

test("TC-05: Đăng nhập có khoảng trắng thừa đầu và cuối (Auto-trimming)", async () => {
  const paddedUserName = `   ${testUser.userName}   `;
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: paddedUserName,
      password: testUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
});

test("TC-06: Đăng nhập sai mật khẩu trả về HTTP 401 UNAUTHENTICATED", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: testUser.userName,
      password: "WrongPassword_999"
    })
  });

  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.code, 1005);
});

test("TC-07: Đăng nhập tài khoản không tồn tại trả về HTTP 404 USER_NOT_EXISTED", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "non_existent_user_999999",
      password: "SomePassword123"
    })
  });

  const data = await res.json();
  assert.equal(res.status, 404);
  assert.equal(data.code, 1006);
});

test("TC-09: Khách vãng lai truy cập GET /identity/providers/{providerId} không bị chặn 401", async () => {
  const sampleProviderId = "99999999-9999-9999-9999-999999999999";
  const res = await fetch(`${GATEWAY_URL}/identity/providers/${sampleProviderId}`);
  assert.notEqual(res.status, 401, "API Gateway and identity-service should allow public GET for provider profiles");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.code, 1000);
  assert.equal(data.result.providerProfileId, sampleProviderId);
});
