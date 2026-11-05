import test from "node:test";
import assert from "node:assert/strict";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8888/api/v1";
const FRONTEND_REWRITE_URL = process.env.FRONTEND_REWRITE_URL || "http://localhost:3000/api/v1";

const testSuffix = Date.now().toString().slice(-6);
const uniqueUser = {
  firstName: "KiemThu",
  lastName: "ChuyenNghiep",
  userName: `qa_user_${testSuffix}`,
  email: `qa_${testSuffix}@workgo.vn`,
  phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
  password: "QaPassword123!"
};

test("TC-01: Đăng ký tài khoản người dùng mới thành công (Happy Path)", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uniqueUser)
  });

  const data = await res.json();
  assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
  assert.equal(data.code, 1000);
  assert.equal(data.result.userName, uniqueUser.userName);
  assert.equal(data.result.email, uniqueUser.email);
  assert.equal(data.result.phone, uniqueUser.phone);
});

test("TC-02: Đăng nhập bằng chính xác Username", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: uniqueUser.userName,
      password: uniqueUser.password
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
      userName: uniqueUser.email,
      password: uniqueUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
  assert.ok(data.result.token && data.result.token.length > 20);
});

test("TC-04: Đăng nhập Username viết hoa (Case-insensitive)", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: uniqueUser.userName.toUpperCase(),
      password: uniqueUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
});

test("TC-05: Đăng nhập Username có khoảng trắng thừa đầu và cuối (Auto-trimming)", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: `   ${uniqueUser.userName}   `,
      password: uniqueUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
});

test("TC-06: Đăng nhập sai mật khẩu trả về HTTP 401 UNAUTHENTICATED (1005)", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: uniqueUser.userName,
      password: "TotallyWrongPassword999!"
    })
  });

  const data = await res.json();
  assert.equal(res.status, 401);
  assert.equal(data.code, 1005);
});

test("TC-07: Đăng nhập tài khoản không tồn tại trả về HTTP 404 USER_NOT_EXISTED (1006)", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "completely_ghost_user_404@workgo.vn",
      password: "AnyPassword123"
    })
  });

  const data = await res.json();
  assert.equal(res.status, 404);
  assert.equal(data.code, 1006);
});

test("TC-09: Khách vãng lai truy cập GET /identity/providers/{providerId} công khai (không 401)", async () => {
  const sampleProviderId = "99999999-9999-9999-9999-999999999999";
  const res = await fetch(`${GATEWAY_URL}/identity/providers/${sampleProviderId}`);
  assert.notEqual(res.status, 401, "API Gateway must not reject public GET with 401");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.code, 1000);
  assert.equal(data.result.providerProfileId, sampleProviderId);
});

test("TC-10 (Edge Case): Đăng ký trùng số điện thoại ném PHONE_EXISTED (1019, HTTP 400)", async () => {
  const duplicatePhoneUser = {
    firstName: "Trùng",
    lastName: "SĐT",
    userName: `diff_user_${Date.now().toString().slice(-5)}`,
    email: `diff_email_${Date.now().toString().slice(-5)}@workgo.vn`,
    phone: uniqueUser.phone, // Same phone as uniqueUser
    password: "Password123!"
  };

  const res = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(duplicatePhoneUser)
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.code, 1019, `Expected code 1019 (PHONE_EXISTED), got: ${JSON.stringify(data)}`);
});

test("TC-11 (Edge Case): Đăng ký trùng Username ném USER_EXISTED (1001, HTTP 400)", async () => {
  const duplicateUserNameUser = {
    firstName: "Trùng",
    lastName: "Username",
    userName: uniqueUser.userName.toUpperCase(), // Same username, different casing
    email: `unique_mail_${Date.now().toString().slice(-5)}@workgo.vn`,
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: "Password123!"
  };

  const res = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(duplicateUserNameUser)
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.code, 1001, `Expected code 1001 (USER_EXISTED), got: ${JSON.stringify(data)}`);
});

test("TC-12 (Edge Case): Đăng ký trùng Email ném USER_EXISTED (1001, HTTP 400)", async () => {
  const duplicateEmailUser = {
    firstName: "Trùng",
    lastName: "Email",
    userName: `unique_user_${Date.now().toString().slice(-5)}`,
    email: uniqueUser.email.toUpperCase(), // Same email, uppercase
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: "Password123!"
  };

  const res = await fetch(`${GATEWAY_URL}/identity/users/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(duplicateEmailUser)
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.code, 1001, `Expected code 1001 (USER_EXISTED), got: ${JSON.stringify(data)}`);
});

test("TC-13 (Edge Case): Đăng nhập bằng Email viết hoa + khoảng trắng hai đầu", async () => {
  const paddedUpperEmail = `   ${uniqueUser.email.toUpperCase()}   `;
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: paddedUpperEmail,
      password: uniqueUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
});

test("TC-14 (Edge Case): Đăng nhập với username rỗng / toàn khoảng trắng", async () => {
  const res = await fetch(`${GATEWAY_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "   ",
      password: uniqueUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.code, 1003); // USERNAME_INVALID
});

test("TC-15 (Edge Case): Gọi qua Next.js Rewrite (/api/v1/identity/auth/token)", async () => {
  const res = await fetch(`${FRONTEND_REWRITE_URL}/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: uniqueUser.userName,
      password: uniqueUser.password
    })
  });

  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.code, 1000);
  assert.equal(data.result.authenticated, true);
  assert.ok(data.result.token);
});
