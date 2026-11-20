import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { catalogApi } from "../src/_webapp-mirror/api/catalogApi.js";
import { availabilityApi } from "../src/_webapp-mirror/api/availabilityApi.js";
import { addressApi } from "../src/_webapp-mirror/api/addressApi.js";
import { authApi } from "../src/_webapp-mirror/api/authApi.js";
import { providerApi } from "../src/_webapp-mirror/api/providerApi.js";
import { adminApi } from "../src/_webapp-mirror/api/adminApi.js";
import { orderApi, isOrderable, orderErrorMessage } from "../src/_webapp-mirror/api/orderApi.js";
import { paymentApi, paymentErrorMessage } from "../src/_webapp-mirror/api/paymentApi.js";
import axiosClient from "../src/_webapp-mirror/api/axiosClient.js";
import { evidenceApi } from "../src/_webapp-mirror/api/evidenceApi.js";
import { verificationApi } from "../src/_webapp-mirror/api/verificationApi.js";
import { jobApi } from "../src/_webapp-mirror/api/jobApi.js";
import { trustApi } from "../src/_webapp-mirror/api/trustApi.js";
import { notificationApi } from "../src/_webapp-mirror/api/notificationApi.js";

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
  assert.match(content, /export\s*\{\s*jobApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*trustApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*notificationApi\s*\}\s*from/);
});

test("API Parity: orderApi no longer confirms payments itself", () => {
  assert.equal(orderApi.confirmPayment, undefined);
});

test("API Parity: Catalog uploads media as multipart with a cover flag", async () => {
  const original = axiosClient.post;
  axiosClient.post = async (url, data, config) => {
    assert.equal(url, "/catalog/medias/services/s1/upload");
    assert.equal(config.params.cover, true);
    assert.ok(data.get("file") instanceof Blob);
  };
  try {
    await catalogApi.uploadMedia("s1", new Blob(["image"], { type: "image/png" }), true);
  } finally {
    axiosClient.post = original;
  }
});

test("Catalog delete retries accept only an already-removed media response", async (t) => {
  t.mock.method(axiosClient, 'delete', async () => { throw { status: 404, code: 1016 }; });
  await catalogApi.deleteMedia('removed');
  axiosClient.delete = async () => { throw { status: 403, code: 1007 }; };
  await assert.rejects(catalogApi.deleteMedia('someone-elses'), error => error.status === 403);
});

test("API Parity: paymentApi calls payment-service through the gateway", async () => {
  const calls = [];
  const original = { get: axiosClient.get, post: axiosClient.post };
  axiosClient.get = async (url, config) => calls.push(["GET", url, config?.params]);
  axiosClient.post = async (url, body, config) => calls.push(["POST", url, body, config?.headers]);
  try {
    await paymentApi.getPayment("p1");
    await paymentApi.getPaymentsOfOrder("o1");
    await paymentApi.getEscrow("o1");
    await paymentApi.simulateMockPayment("PAY1", true);
    await paymentApi.simulateMockPayment("PAY1", false);
    await paymentApi.payOrderWithWallet("o1");
    await paymentApi.getCurrentFeePolicy();
    await paymentApi.getWallet();
    await paymentApi.getTopUps();
    await paymentApi.getFees();
    await paymentApi.createTopUp({ amount: 100000, gateway: "VNPAY" }, "key-topup");
    await paymentApi.getTopUp("top-1");
    await paymentApi.simulateMockTopUp("TOP1", true);
    await paymentApi.requestPayout({ amount: 500000, bankCode: "VCB", accountName: "TRAN HUU TRUNG", accountNumber: "0071001234567" }, "key-payout");
    await paymentApi.getPayouts();
  } finally {
    Object.assign(axiosClient, original);
  }
  assert.deepEqual(calls, [
    ["GET", "/payment/payments/p1", undefined],
    ["GET", "/payment/payments", { orderId: "o1" }],
    ["GET", "/payment/escrows/orders/o1", undefined],
    ["POST", "/payment/dev/payments/PAY1/success", undefined, undefined],
    ["POST", "/payment/dev/payments/PAY1/fail", undefined, undefined],
    ["POST", "/payment/wallet/orders/o1/pay", undefined, undefined],
    ["GET", "/payment/fee-policies/current", undefined],
    ["GET", "/payment/wallet", undefined],
    ["GET", "/payment/wallet/top-ups", undefined],
    ["GET", "/payment/wallet/fees", undefined],
    ["POST", "/payment/wallet/top-ups", { amount: 100000, gateway: "VNPAY" }, { "Idempotency-Key": "key-topup" }],
    ["GET", "/payment/wallet/top-ups/top-1", undefined],
    ["POST", "/payment/dev/payments/top-ups/TOP1/success", undefined, undefined],
    ["POST", "/payment/wallet/payouts", { amount: 500000, bankCode: "VCB", accountName: "TRAN HUU TRUNG", accountNumber: "0071001234567" }, { "Idempotency-Key": "key-payout" }],
    ["GET", "/payment/wallet/payouts", undefined],
  ]);
});

test("API Parity: distinct top-ups always receive distinct Idempotency-Keys", async () => {
  const keys = [];
  const original = axiosClient.post;
  axiosClient.post = async (_url, _body, config) => keys.push(config?.headers?.["Idempotency-Key"]);
  try {
    await paymentApi.createTopUp({ amount: 50000, gateway: "MOCK" });
    await paymentApi.createTopUp({ amount: 50000, gateway: "MOCK" });
  } finally {
    axiosClient.post = original;
  }
  assert.equal(keys.length, 2);
  assert.ok(keys[0] && keys[1]);
  assert.notEqual(keys[0], keys[1]);
});

test('checkout top-up recovery reads an existing receipt after reload and waits for server confirmation', async () => {
  let confirmed = 0;
  let created = 0;
  let status = 'PENDING';
  const receipts = [];
  const screen = loadTopUpComponent('WalletTopUpEmbed.tsx', {
    initialTopUpId: 'existing-receipt', requiredAmount: 50000, currentBalance: 0,
    onSuccess: () => { confirmed += 1; },
  }, {
    createTopUp: async () => { created += 1; },
    getTopUp: async id => {
      receipts.push(id);
      return { result: { topUpId: id, status, gateway: 'VNPAY', amount: 50000, paymentUrl: 'https://sandbox.example/receipt' } };
    },
  });
  await screen.flush();
  assert.equal(created, 0);
  assert.equal(confirmed, 0);
  assert.match(screen.text(), /https:\/\/sandbox.example\/receipt/);
  status = 'SUCCEEDED';
  await screen.clickText('Check transaction again');
  await screen.flush();
  assert.equal(confirmed, 1);
  assert.deepEqual(receipts, ['existing-receipt', 'existing-receipt']);
  screen.unmount();
});

test('checkout top-up reuses its key after a lost acknowledgement and records the receipt for reload', async () => {
  const calls = [];
  const tracked = [];
  const receipt = { topUpId: 'saved', status: 'PENDING', gateway: 'VNPAY', paymentUrl: 'https://sandbox.example/receipt' };
  const screen = loadTopUpComponent('WalletTopUpEmbed.tsx', {
    requiredAmount: 10000, onTrackTopUp: id => tracked.push(id),
  }, {
    createTopUp: async (body, key) => {
      calls.push({ body, key });
      if (calls.length === 1) throw new Error('Acknowledgement lost');
      return { result: receipt };
    },
    getTopUp: async () => ({ result: receipt }),
  });
  await screen.clickClass('submitBtn');
  await screen.clickClass('submitBtn');
  await screen.flush();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].key, calls[1].key);
  assert.equal(calls[0].body.amount, 10000);
  assert.deepEqual(tracked, ['saved']);
  screen.unmount();
});

test('checkout reuses the creation key after a lost acknowledgement and changes it with the request', async () => {
  const calls = [];
  const navigated = [];
  let attempts = 0;
  const order = { service: { serviceId: 's1', executionType: 'DIGITAL' }, pkg: { id: 'p1', price: 50000 }, addons: [] };
  const screen = loadTopUpComponent('CheckoutPage.jsx', {
    order, onOpenPayment: receipt => navigated.push(receipt), onShowToast: () => {},
  }, { getCurrentFeePolicy: async () => ({ result: { successFeeRate: 0.1 } }) }, {
    '../../api/orderApi': { orderApi: { createOrder: async (body, key) => {
      calls.push({ body, key });
      if (calls.length < 3) throw new Error('Acknowledgement lost');
      return { result: { orderId: 'saved', paymentMethod: 'WALLET' } };
    } }, isOrderable, orderErrorMessage },
    '../../api/paymentApi': { paymentApi: { getCurrentFeePolicy: async () => ({ result: {} }) }, newIdempotencyKey: () => `order-attempt-${++attempts}` },
    './OnsiteBookingSection': { default: () => null },
    './PaymentOptionPicker': { default: () => null },
  });
  screen.changeInput(node => node.props.type === 'checkbox', { checked: true });
  await screen.clickClass('btnPay');
  await screen.clickClass('btnPay');
  assert.ok(calls[0].key, 'the caller must retain an explicit key');
  assert.equal(calls[0].key, calls[1].key);
  assert.equal(navigated.length, 0);
  order.pkg = { id: 'p2', price: 75000 };
  screen.rerender();
  await screen.clickClass('btnPay');
  assert.notEqual(calls[1].key, calls[2].key);
  assert.equal(navigated.length, 1);
  assert.equal(navigated[0].orderId, 'saved');
  screen.unmount();
});

for (const [locale, messages] of [
  ['en', [
    'The order request identifier is invalid. Please return to the service and try again.',
    'This order request cannot be reused. Please check your orders before creating a new one.',
  ]],
  ['vi', [
    'Mã yêu cầu đặt đơn không hợp lệ. Vui lòng quay lại dịch vụ và thử lại.',
    'Yêu cầu đặt đơn này không thể dùng lại. Vui lòng kiểm tra danh sách đơn trước khi tạo đơn mới.',
  ]],
]) {
  test(`checkout translates creation key errors in ${locale} and keeps the user on checkout`, async () => {
    const toasts = [];
    let navigated = 0;
    let code = 3049;
    const screen = loadTopUpComponent('CheckoutPage.jsx', {
      order: { service: { serviceId: 's1', executionType: 'DIGITAL' }, pkg: { id: 'p1', price: 50000 }, addons: [] },
      onShowToast: message => toasts.push(message), onOpenPayment: () => { navigated += 1; },
    }, {}, {
      '../../api/orderApi': { orderApi: { createOrder: async () => { throw { code, status: code === 3049 ? 400 : 409, message: 'Raw backend error' }; } }, isOrderable, orderErrorMessage },
      '../../api/paymentApi': { paymentApi: { getCurrentFeePolicy: async () => ({ result: {} }) }, newIdempotencyKey: () => 'retry-key' },
      './OnsiteBookingSection': { default: () => null },
      './PaymentOptionPicker': { default: () => null },
    }, locale);
    screen.changeInput(node => node.props.type === 'checkbox', { checked: true });
    await screen.clickClass('btnPay');
    code = 3050;
    await screen.clickClass('btnPay');
    assert.equal(toasts.length, 2);
    messages.forEach((message, index) => assert.ok(toasts[index].includes(message), toasts[index]));
    assert.equal(navigated, 0);
    screen.unmount();
  });
}

for (const [filename, inputId, buttonClass] of [
  ['WalletTopUpEmbed.tsx', 'embed-topup-amount', 'submitBtn'],
  ['PaymentGatewayPage.tsx', 'wg-payment-amount', 'submit'],
]) {
  test(`${filename} rejects decimal, negative and malformed top-up input without changing the amount`, async () => {
    const calls = [];
    const screen = loadTopUpComponent(filename, { onNavigate: () => {}, onShowToast: () => {} }, {
      getWallet: async () => ({ result: {} }),
      createTopUp: async body => { calls.push(body); throw new Error('no receipt'); },
    });
    for (const value of ['-10000', '10000.5', '1e5', '10abc000']) {
      screen.changeInput(node => node.props.id === inputId, { value });
      await screen.clickClass(buttonClass);
      assert.equal(calls.length, 0, `must reject ${value}`);
    }
    screen.changeInput(node => node.props.id === inputId, { value: '10000' });
    await screen.clickClass(buttonClass);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].amount, 10000);
    screen.unmount();
  });
}

function loadTopUpComponent(filename, props, api, imports = {}, locale = 'en') {
  const require = createRequire(import.meta.url);
  const dict = JSON.parse(fs.readFileSync(new URL(`../src/dictionaries/${locale}.json`, import.meta.url), 'utf8'));
  const translators = new Map();
  const state = [];
  const pendingEffects = [];
  const cleanups = new Map();
  let cursor = 0;
  const hooks = {
    useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useRef: initial => {
      const index = cursor++;
      return state[index] ?? (state[index] = { current: initial });
    },
    useEffect: (effect, deps) => {
      const index = cursor++;
      if (!state[index] || deps.some((dep, i) => dep !== state[index][i])) {
        state[index] = deps;
        pendingEffects.push(() => { cleanups.get(index)?.(); cleanups.set(index, effect()); });
      }
    },
  };
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const mockRequire = name => {
    if (name in imports) return imports[name];
    if (name === 'react') return { ...hooks, default: { Fragment: 'fragment' } };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'next-intl') return { useTranslations: ns => {
      if (!translators.has(ns)) translators.set(ns, (key, values = {}) => (dict[ns]?.[key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name]));
      return translators.get(ns);
    } };
    if (name.endsWith('webapp-bridge/backend')) return {
      paymentApi: api, useAuthToken: () => 'user-token', TOP_UP_MINIMUM_VND: 10000,
      newIdempotencyKey: () => 'attempt-key', paymentErrorMessage: err => err.message,
    };
    if (name.endsWith('.css')) return { default: new Proxy({}, { get: (_, key) => key }) };
    return require(name);
  };
  const componentPath = filename === 'CheckoutPage.jsx' ? '../src/_webapp-mirror/pages/Checkout/' : '../src/components/trung-pages/payment/';
  const source = fs.readFileSync(new URL(componentPath + filename, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(compiled, { exports, require: mockRequire, setTimeout: () => 1, clearTimeout: () => {}, window: { dispatchEvent() {}, location: { search: '', assign() {} } }, Event, URLSearchParams });
  let tree;
  function render() { cursor = 0; tree = exports.default(props); pendingEffects.splice(0).forEach(run => run()); }
  function elements(node) {
    if (Array.isArray(node)) return node.flatMap(child => elements(child));
    if (!node || typeof node !== 'object') return [];
    return [node, ...elements(node.props?.children)];
  }
  async function click(predicate) {
    const button = elements(tree).find(node => node.type === 'button' && predicate(node));
    assert.ok(button, 'Expected an enabled button');
    await button.props.onClick();
    render();
  }
  render();
  return {
    rerender: render,
    changeInput: (predicate, target) => {
      const input = elements(tree).find(node => node.type === 'input' && predicate(node));
      assert.ok(input, 'Expected an input');
      input.props.onChange({ target });
      render();
    },
    flush: async () => { await new Promise(setImmediate); render(); },
    text: () => JSON.stringify(tree),
    clickText: text => click(node => JSON.stringify(node.props.children).includes(text)),
    clickClass: name => click(node => node.props.className === name),
    unmount: () => { for (const cleanup of cleanups.values()) cleanup?.(); },
  };
}

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

test("API Parity: jobApi exports all search, create, update, application, and proposal operations", () => {
  assert.equal(typeof jobApi.searchJobs, "function");
  assert.equal(typeof jobApi.getMyJobs, "function");
  assert.equal(typeof jobApi.getJob, "function");
  assert.equal(typeof jobApi.createJob, "function");
  assert.equal(typeof jobApi.updateJob, "function");
  assert.equal(typeof jobApi.applyJob, "function");
  assert.equal(typeof jobApi.getJobApplications, "function");
  assert.equal(typeof jobApi.getMyApplications, "function");
  assert.equal(typeof jobApi.submitProposal, "function");
  assert.equal(typeof jobApi.getJobProposals, "function");
  assert.equal(typeof jobApi.acceptProposal, "function");
  assert.equal(typeof jobApi.rejectProposal, "function");
  assert.equal(typeof jobApi.orderSync, "function");
  assert.equal(typeof jobApi.retryOrder, "function");
});

test("API Parity: trustApi exports all review, dispute, and report operations", () => {
  assert.equal(typeof trustApi.submitReview, "function");
  assert.equal(typeof trustApi.getProviderReviews, "function");
  assert.equal(typeof trustApi.getServiceReviews, "function");
  assert.equal(typeof trustApi.getClientReviews, "function");
  assert.equal(typeof trustApi.getOrderReviewStatus, "function");
  assert.equal(typeof trustApi.getMyReviews, "function");
  assert.equal(typeof trustApi.createDispute, "function");
  assert.equal(typeof trustApi.cancelDispute, "function");
  assert.equal(typeof trustApi.getDispute, "function");
  assert.equal(typeof trustApi.getOrderDisputes, "function");
  assert.equal(typeof trustApi.getMyDisputes, "function");
  assert.equal(typeof trustApi.submitReport, "function");
});

test("API Parity: notificationApi exports all notification operations", () => {
  assert.equal(typeof notificationApi.listNotifications, "function");
  assert.equal(typeof notificationApi.markRead, "function");
  assert.equal(typeof notificationApi.readAll, "function");
});

test("API Parity: createOrder sends Idempotency-Key header", async () => {
  const headersList = [];
  const original = axiosClient.post;
  axiosClient.post = async (_url, _body, config) => {
    headersList.push(config?.headers?.["Idempotency-Key"]);
    return { result: { orderId: "o1" } };
  };
  try {
    await orderApi.createOrder({ serviceId: "s1", packageId: "p1" });
    await orderApi.createOrder({ serviceId: "s1", packageId: "p1" });
  } finally {
    axiosClient.post = original;
  }
  assert.equal(headersList.length, 2);
  assert.ok(headersList[0] && headersList[1]);
  assert.notEqual(headersList[0], headersList[1], "each order creation must get a distinct Idempotency-Key");
});
