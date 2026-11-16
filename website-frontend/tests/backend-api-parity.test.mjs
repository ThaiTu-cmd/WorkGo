import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { catalogApi } from "../src/_webapp-mirror/api/catalogApi.js";
import { availabilityApi } from "../src/_webapp-mirror/api/availabilityApi.js";
import { addressApi } from "../src/_webapp-mirror/api/addressApi.js";
import { authApi } from "../src/_webapp-mirror/api/authApi.js";
import { providerApi } from "../src/_webapp-mirror/api/providerApi.js";
import { adminApi } from "../src/_webapp-mirror/api/adminApi.js";
import { orderApi, isOrderable, orderErrorMessage } from "../src/_webapp-mirror/api/orderApi.js";
import { paymentApi, paymentErrorMessage, startPayment, PAYMENT_OPTIONS } from "../src/_webapp-mirror/api/paymentApi.js";
import axiosClient from "../src/_webapp-mirror/api/axiosClient.js";
import { evidenceApi } from "../src/_webapp-mirror/api/evidenceApi.js";
import { verificationApi } from "../src/_webapp-mirror/api/verificationApi.js";

test("API Parity: catalogApi exports all Category, Service, Package, AddOn, and Media endpoints", () => {
  // Categories
  assert.equal(typeof catalogApi.getRootCategories, "function");
  assert.equal(typeof catalogApi.getCategoryById, "function");
  assert.equal(typeof catalogApi.getChildCategories, "function");
  
  // Services
  assert.equal(typeof catalogApi.getService, "function");
  assert.equal(typeof catalogApi.listServices, "function");
  assert.equal(typeof catalogApi.getMyServices, "function");
  assert.equal(typeof catalogApi.createService, "function");
  assert.equal(typeof catalogApi.updateService, "function");
  assert.equal(typeof catalogApi.deleteService, "function");
  assert.equal(typeof catalogApi.setServiceStatus, "function");

  // Packages (Full CRUD + byService)
  assert.equal(typeof catalogApi.createPackage, "function");
  assert.equal(typeof catalogApi.getPackages, "function");
  assert.equal(typeof catalogApi.getPackage, "function");
  assert.equal(typeof catalogApi.updatePackage, "function");
  assert.equal(typeof catalogApi.deletePackage, "function");

  // Add-ons (Full CRUD + byService)
  assert.equal(typeof catalogApi.createAddon, "function");
  assert.equal(typeof catalogApi.getAddons, "function");
  assert.equal(typeof catalogApi.getAddon, "function");
  assert.equal(typeof catalogApi.updateAddon, "function");
  assert.equal(typeof catalogApi.deleteAddon, "function");

  // Media (Full CRUD + byService)
  assert.equal(typeof catalogApi.createMedia, "function");
  assert.equal(typeof catalogApi.getMedias, "function");
  assert.equal(typeof catalogApi.getMedia, "function");
  assert.equal(typeof catalogApi.updateMedia, "function");
  assert.equal(typeof catalogApi.deleteMedia, "function");
});

test("API Parity: availabilityApi exports all Rule and BookingSlot endpoints", () => {
  assert.equal(typeof availabilityApi.getMyServices, "function");
  assert.equal(typeof availabilityApi.getService, "function");
  assert.equal(typeof availabilityApi.getRules, "function");
  assert.equal(typeof availabilityApi.getRule, "function");
  assert.equal(typeof availabilityApi.createRule, "function");
  assert.equal(typeof availabilityApi.updateRule, "function");
  assert.equal(typeof availabilityApi.deleteRule, "function");
  
  // Slots (list, hold, confirm, release)
  assert.equal(typeof availabilityApi.getSlots, "function");
  assert.equal(typeof availabilityApi.holdSlot, "function");
  assert.equal(typeof availabilityApi.confirmSlot, "function");
  assert.equal(typeof availabilityApi.releaseSlot, "function");
});

test("API Parity: addressApi exports full CRUD on /identity/addresses", () => {
  assert.equal(typeof addressApi.getMy, "function");
  assert.equal(typeof addressApi.getById, "function");
  assert.equal(typeof addressApi.create, "function");
  assert.equal(typeof addressApi.update, "function");
  assert.equal(typeof addressApi.remove, "function");
});

test("API Parity: authApi exports auth lifecycle endpoints", () => {
  assert.equal(typeof authApi.login, "function");
  assert.equal(typeof authApi.register, "function");
  assert.equal(typeof authApi.logout, "function");
  assert.equal(typeof authApi.introspect, "function");
  assert.equal(typeof authApi.refresh, "function");
  assert.equal(typeof authApi.getMyInfo, "function");
  assert.equal(typeof authApi.updateMyInfo, "function");
});

test("API Parity: providerApi and verificationApi export full provider and verification endpoints", () => {
  assert.equal(typeof providerApi.getProvider, "function");
  assert.equal(typeof providerApi.getMyProfile, "function");
  assert.equal(typeof providerApi.createProfile, "function");
  assert.equal(typeof providerApi.updateMyProfile, "function");
  assert.equal(typeof providerApi.deleteMyProfile, "function");

  assert.equal(typeof providerApi.submitVerification, "function");
  assert.equal(typeof providerApi.getMyVerifications, "function");
  assert.equal(typeof providerApi.getVerification, "function");
  assert.equal(typeof providerApi.deleteVerification, "function");

  assert.equal(typeof verificationApi.submit, "function");
  assert.equal(typeof verificationApi.getMy, "function");
  assert.equal(typeof verificationApi.getById, "function");
  assert.equal(typeof verificationApi.listByStatus, "function");
  assert.equal(typeof verificationApi.review, "function");
  assert.equal(typeof verificationApi.remove, "function");
});

test("API Parity: adminApi exports user, provider, verification, category admin operations", () => {
  assert.equal(typeof adminApi.listProviders, "function");
  assert.equal(typeof adminApi.setProviderStatus, "function");
  assert.equal(typeof adminApi.listVerifications, "function");
  assert.equal(typeof adminApi.reviewVerification, "function");

  assert.equal(typeof adminApi.listUsers, "function");
  assert.equal(typeof adminApi.getUser, "function");
  assert.equal(typeof adminApi.updateUser, "function");
  assert.equal(typeof adminApi.deleteUser, "function");

  assert.equal(typeof adminApi.listCategories, "function");
  assert.equal(typeof adminApi.createCategory, "function");
  assert.equal(typeof adminApi.updateCategory, "function");
  assert.equal(typeof adminApi.deleteCategory, "function");
});

test("API Parity: orderApi exports order, history, execution, and create operations", () => {
  assert.equal(typeof orderApi.getMyOrders, "function");
  assert.equal(typeof orderApi.getOrder, "function");
  assert.equal(typeof orderApi.getOrderHistory, "function");
  assert.equal(typeof orderApi.getExecution, "function");
  assert.equal(typeof orderApi.createOrder, "function");
});

test("API Parity: orderApi calls the onsite and digital endpoints", async () => {
  const calls = [];
  const original = { get: axiosClient.get, post: axiosClient.post };
  axiosClient.get = async (url, config) => calls.push(["GET", url, config?.params]);
  axiosClient.post = async (url, body) => calls.push(["POST", url, body]);
  try {
    await orderApi.getCheckinCode("o1");
    await orderApi.checkin("o1", "123456");
    await orderApi.completeOnsite("o1");
    await orderApi.acceptOnsite("o1");
    await orderApi.submitRequirements("o1", { description: "d" });
    await orderApi.submitDelivery("o1", { message: "m", files: [] });
    await orderApi.getDeliveries("o1");
    await orderApi.requestRevision("o1", "fix it");
    await orderApi.getRevisions("o1");
    await orderApi.acceptDigital("o1");
  } finally {
    Object.assign(axiosClient, original);
  }
  assert.deepEqual(calls, [
    ["GET", "/order/orders/onsite/o1/checkin-code", undefined],
    ["POST", "/order/orders/onsite/o1/checkin", { code: "123456" }],
    ["POST", "/order/orders/onsite/o1/complete", undefined],
    ["POST", "/order/orders/onsite/o1/accept", undefined],
    ["POST", "/order/orders/digital/o1/requirements", { values: { description: "d" } }],
    ["POST", "/order/orders/digital/o1/submissions", { message: "m", files: [] }],
    ["GET", "/order/orders/digital/o1/submissions", undefined],
    ["POST", "/order/orders/digital/o1/revisions", { reason: "fix it" }],
    ["GET", "/order/orders/digital/o1/revisions", undefined],
    ["POST", "/order/orders/digital/o1/accept", undefined],
  ]);
});

test("API Parity: both DIGITAL and ONSITE services can be ordered", () => {
  assert.equal(isOrderable("DIGITAL"), true);
  assert.equal(isOrderable("ONSITE"), true);
  assert.equal(isOrderable("DELIVERY"), false);
});

test("API Parity: orderErrorMessage maps order-service flow codes to Vietnamese", () => {
  assert.match(orderErrorMessage({ code: 3003 }), /mã check-in/i);
  assert.match(orderErrorMessage({ code: 3005 }), /Sau khi làm/);
  assert.match(orderErrorMessage({ code: 3009 }), /lượt chỉnh sửa/);
  assert.equal(orderErrorMessage({ code: 9999, message: "raw" }), "raw");
  assert.ok(orderErrorMessage(null).length > 0);
});

test("API Parity: evidenceApi exports evidence retrieval and submission", () => {
  assert.equal(typeof evidenceApi.getEvidence, "function");
  assert.equal(typeof evidenceApi.createEvidence, "function");
});

test("API Parity: backend.ts bridge re-exports all API modules cleanly", () => {
  const backendTsPath = path.resolve(__dirname, "../src/components/webapp-bridge/backend.ts");
  const content = fs.readFileSync(backendTsPath, "utf-8");
  assert.match(content, /export\s*\{\s*catalogApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*availabilityApi/);
  assert.match(content, /export\s*\{\s*addressApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*authApi/);
  assert.match(content, /export\s*\{\s*providerApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*adminApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*orderApi/);
  assert.match(content, /export\s*\{\s*evidenceApi/);
  assert.match(content, /export\s*\{\s*verificationApi\s*\}\s*from/);
});

test("API Parity: orderApi no longer confirms payments itself", () => {
  assert.equal(orderApi.confirmPayment, undefined);
});

test("API Parity: paymentApi calls payment-service through the gateway", async () => {
  const calls = [];
  const original = { get: axiosClient.get, post: axiosClient.post };
  axiosClient.get = async (url, config) => calls.push(["GET", url, config?.params]);
  axiosClient.post = async (url, body, config) => calls.push(["POST", url, body, config?.headers]);
  try {
    await paymentApi.createPayment({ orderId: "o1", gateway: "VNPAY", paymentMethod: "QR" }, "key-1");
    await paymentApi.createPayment({ orderId: "o1", gateway: "MOCK" }, "key-2");
    await paymentApi.getPayment("p1");
    await paymentApi.getPaymentsOfOrder("o1");
    await paymentApi.getEscrow("o1");
    await paymentApi.simulateMockPayment("PAY1", true);
    await paymentApi.simulateMockPayment("PAY1", false);
  } finally {
    Object.assign(axiosClient, original);
  }
  assert.deepEqual(calls, [
    ["POST", "/payment/payments", { orderId: "o1", gateway: "VNPAY", paymentMethod: "QR" }, { "Idempotency-Key": "key-1" }],
    ["POST", "/payment/payments", { orderId: "o1", gateway: "MOCK" }, { "Idempotency-Key": "key-2" }],
    ["GET", "/payment/payments/p1", undefined],
    ["GET", "/payment/payments", { orderId: "o1" }],
    ["GET", "/payment/escrows/orders/o1", undefined],
    ["POST", "/payment/dev/payments/PAY1/success", undefined, undefined],
    ["POST", "/payment/dev/payments/PAY1/fail", undefined, undefined],
  ]);
});

test("API Parity: createPayment always sends a fresh Idempotency-Key", async () => {
  const keys = [];
  const original = axiosClient.post;
  axiosClient.post = async (_url, _body, config) => keys.push(config?.headers?.["Idempotency-Key"]);
  try {
    await paymentApi.createPayment({ orderId: "o1", gateway: "MOCK" });
    await paymentApi.createPayment({ orderId: "o1", gateway: "MOCK" });
  } finally {
    axiosClient.post = original;
  }
  assert.equal(keys.length, 2);
  assert.ok(keys[0] && keys[1]);
  assert.notEqual(keys[0], keys[1]);
});

test("Payment flow: MOCK payments stay in the app, real gateways redirect", async () => {
  const original = axiosClient.post;
  axiosClient.post = async (_url, body) => ({
    result: { paymentId: "p1", gateway: body.gateway, paymentUrl: "https://sandbox.example/pay" },
  });
  try {
    let mocked = null;
    const payment = await startPayment("o1", "mock", { onMock: (p) => { mocked = p; } });
    assert.equal(payment.paymentId, "p1");
    assert.equal(mocked?.paymentId, "p1", "MOCK hands the payment to onMock");
  } finally {
    axiosClient.post = original;
  }
  assert.ok(PAYMENT_OPTIONS.some((o) => o.gateway === "VNPAY"));
  assert.ok(PAYMENT_OPTIONS.some((o) => o.gateway === "MOMO"));
  assert.ok(PAYMENT_OPTIONS.every((o) => ["MOCK", "VNPAY", "MOMO"].includes(o.gateway)), "only gateways payment-service supports");
});

test("Payment flow: payment-service and order-service error codes are mapped separately", () => {
  assert.match(paymentErrorMessage({ code: 3003 }), /đã được thanh toán/);
  assert.match(orderErrorMessage({ code: 3003 }), /check-in/);
  assert.match(orderErrorMessage({ code: 3020 }), /check-in/);
  assert.match(paymentErrorMessage({ code: 3101 }), /escrow/);
  assert.equal(paymentErrorMessage({ message: "x" }), "x");
});

test("API Parity: setServiceStatus uses PATCH /status once", async () => {
  const calls = [];
  const original = { get: axiosClient.get, put: axiosClient.put, patch: axiosClient.patch };
  axiosClient.get = async (url) => calls.push(["GET", url]);
  axiosClient.put = async (url, body) => calls.push(["PUT", url, body]);
  axiosClient.patch = async (url, body) => calls.push(["PATCH", url, body]);
  try {
    await catalogApi.setServiceStatus("s1", "PAUSED");
  } finally {
    Object.assign(axiosClient, original);
  }
  assert.deepEqual(calls, [["PATCH", "/catalog/services/s1/status", { status: "PAUSED" }]]);
});

test("API Parity: getSlots sends from/to only when given", async () => {
  const calls = [];
  const original = axiosClient.get;
  axiosClient.get = async (url, config) => calls.push([url, config?.params]);
  try {
    await availabilityApi.getSlots("s1", 0, 100, { from: "A", to: "B" });
    await availabilityApi.getSlots("s1");
  } finally {
    axiosClient.get = original;
  }
  assert.deepEqual(calls, [
    ["/catalog/slots/services/s1", { page: 0, size: 100, from: "A", to: "B" }],
    ["/catalog/slots/services/s1", { page: 0, size: 50 }],
  ]);
});
