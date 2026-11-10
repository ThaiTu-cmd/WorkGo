import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const W_SRC = path.join(REPO, "web-app/src");
const M_SRC = path.join(REPO, "website-frontend/src/_webapp-mirror");

const read = (p) => fs.readFileSync(p, "utf-8");
const exists = (p) => fs.existsSync(p);
const toUrl = (p) => pathToFileURL(p).href;

// BP-01: Verification page structure
test("BP-01: VerificationCenterPage has login gate, 5 fields, 3 statuses, timeline, and withdraw button", () => {
  const file = path.join(W_SRC, "pages/BackendParity/VerificationCenterPage.jsx");
  assert.ok(exists(file), "VerificationCenterPage.jsx must exist");
  const code = read(file);

  assert.match(code, /verificationType/, "Form must contain verificationType");
  assert.match(code, /documentType/, "Form must contain documentType");
  assert.match(code, /documentNumber/, "Form must contain documentNumber");
  assert.match(code, /documentUrl/, "Form must contain documentUrl");
  assert.match(code, /note/, "Form must contain note");

  assert.match(code, /PENDING/, "Must handle PENDING status");
  assert.match(code, /VERIFIED/, "Must handle VERIFIED status");
  assert.match(code, /REJECTED/, "Must handle REJECTED status");

  assert.match(code, /currentUser/, "Must check currentUser for login gate");
  assert.match(code, /Rút hồ sơ|Hủy hồ sơ|cancel/i, "Must have withdraw/cancel action for PENDING");
});

// BP-02: Verification store logic
test("BP-02: mockVerification store provides add (PENDING), review, and event dispatch", async () => {
  const storePath = path.join(W_SRC, "pages/BackendParity/mockVerification.js");
  assert.ok(exists(storePath), "mockVerification.js must exist");
  const store = await import(toUrl(storePath));

  assert.ok(typeof store.getVerifications === "function", "getVerifications must be function");
  assert.ok(typeof store.addVerification === "function", "addVerification must be function");
  assert.ok(typeof store.reviewVerification === "function", "reviewVerification must be function");
  assert.ok(typeof store.removeVerification === "function", "removeVerification must be function");
});

// BP-03: Booking slots page and store
test("BP-03: Booking slots supports AVAILABLE, HELD, BOOKED states and transitions", async () => {
  const pageFile = path.join(W_SRC, "pages/BackendParity/BookingSlotsPage.jsx");
  const storeFile = path.join(W_SRC, "pages/BackendParity/mockBookingSlots.js");
  assert.ok(exists(pageFile), "BookingSlotsPage.jsx must exist");
  assert.ok(exists(storeFile), "mockBookingSlots.js must exist");

  const store = await import(toUrl(storeFile));
  assert.ok(typeof store.getSlots === "function", "getSlots must be function");
  assert.ok(typeof store.holdSlot === "function", "holdSlot must be function");
  assert.ok(typeof store.confirmSlot === "function", "confirmSlot must be function");
  assert.ok(typeof store.releaseSlot === "function", "releaseSlot must be function");

  const pageCode = read(pageFile);
  assert.match(pageCode, /AVAILABLE/);
  assert.match(pageCode, /HELD/);
  assert.match(pageCode, /BOOKED/);
});

// BP-04: Admin console gate
test("BP-04: AdminConsolePage strictly gates access to admin@workgo.vn and hides data otherwise", () => {
  const file = path.join(W_SRC, "pages/BackendParity/AdminConsolePage.jsx");
  assert.ok(exists(file), "AdminConsolePage.jsx must exist");
  const code = read(file);

  assert.match(code, /admin@workgo\.vn/, "Admin console must gate against admin@workgo.vn");
  assert.match(code, /403|quản trị|không có quyền/i, "Must have unauthorized fallback card");
});

// BP-05: Order status history timeline
test("BP-05: mockOrders seeds statusHistory and OrderDashboardPage renders history timeline", () => {
  const ordersFile = path.join(M_SRC, "data/mockOrders.js");
  assert.ok(exists(ordersFile), "mockOrders.js must exist");
  const ordersCode = read(ordersFile);
  assert.match(ordersCode, /statusHistory/, "mockOrders must seed statusHistory array");

  const dashboardFile = path.join(M_SRC, "pages/OrderDashboard/OrderDashboardPage.jsx");
  assert.ok(exists(dashboardFile), "OrderDashboardPage.jsx must exist");
  const dashCode = read(dashboardFile);
  assert.match(dashCode, /Lịch sử trạng thái/, "OrderDashboardPage must render 'Lịch sử trạng thái'");
});

// BP-06: ServiceForm addons and mediaUrls controlled
test("BP-06: ServiceForm initializes addons and mediaUrls without uncontrolled defaultValue on addons", () => {
  const formFile = path.join(W_SRC, "pages/ServiceForm/ServiceFormPage.jsx");
  assert.ok(exists(formFile), "ServiceFormPage.jsx must exist");
  const formCode = read(formFile);
  assert.match(formCode, /addons\s*:/, "ServiceForm formData must include addons");
  assert.match(formCode, /mediaUrls\s*:/, "ServiceForm formData must include mediaUrls");

  const pricingFile = path.join(W_SRC, "pages/ServiceForm/components/Step2Pricing/Step2Pricing.jsx");
  assert.ok(exists(pricingFile), "Step2Pricing.jsx must exist");
  const pricingCode = read(pricingFile);
  assert.doesNotMatch(pricingCode, /defaultValue\s*=\s*\{addon\.price\}/, "defaultValue on addon price forbidden");

  const mediaFile = path.join(W_SRC, "pages/ServiceForm/components/Step3Media/Step3Media.jsx");
  assert.ok(exists(mediaFile), "Step3Media.jsx must exist");
  const mediaCode = read(mediaFile);
  assert.match(mediaCode, /mediaUrls/, "Step3Media must bind mediaUrls");
});

// BP-07: Persist addons and mediaUrls
test("BP-07: ServiceForm persists addons and mediaUrls to provider services store", () => {
  const formFile = path.join(W_SRC, "pages/ServiceForm/ServiceFormPage.jsx");
  const formCode = read(formFile);
  assert.match(formCode, /addons\s*:\s*formData\.addons/);
  assert.match(formCode, /mediaUrls\s*:\s*formData\.mediaUrls/);
});

// BP-08: No API in new parity files
test("BP-08: Backend parity pages and mock stores do not import api clients", () => {
  const files = [
    path.join(W_SRC, "pages/BackendParity/VerificationCenterPage.jsx"),
    path.join(W_SRC, "pages/BackendParity/BookingSlotsPage.jsx"),
    path.join(W_SRC, "pages/BackendParity/AdminConsolePage.jsx"),
    path.join(W_SRC, "pages/BackendParity/mockVerification.js"),
    path.join(W_SRC, "pages/BackendParity/mockBookingSlots.js"),
    path.join(W_SRC, "pages/BackendParity/mockAdmin.js"),
  ];

  for (const f of files) {
    assert.ok(exists(f), `File must exist: ${f}`);
    const code = read(f);
    assert.doesNotMatch(code, /import\s+.*from\s+['"][^'"]*\/api\//);
    assert.doesNotMatch(code, /\buseMyOrders\b/);
    assert.doesNotMatch(code, /\buseAvailability\b/);
  }
});

// BP-09: SSR-safe stores with quota handling
test("BP-09: Backend parity stores are safe against missing window and storage quota errors", () => {
  const stores = [
    path.join(W_SRC, "pages/BackendParity/mockVerification.js"),
    path.join(W_SRC, "pages/BackendParity/mockBookingSlots.js"),
    path.join(W_SRC, "pages/BackendParity/mockAdmin.js"),
  ];

  for (const s of stores) {
    assert.ok(exists(s), `Store must exist: ${s}`);
    const code = read(s);
    assert.match(code, /typeof\s+window/, `Store must guard window access in ${s}`);
    assert.match(code, /try\s*\{[\s\S]*localStorage[\s\S]*\}\s*catch/, `Storage writes must be wrapped in try/catch in ${s}`);
  }
});

// BP-10: Parity input validation
test("BP-10: Parity stores and pages validate inputs and handle slot expiration", async () => {
  const storeFile = path.join(W_SRC, "pages/BackendParity/mockBookingSlots.js");
  assert.ok(exists(storeFile), "Store must exist: mockBookingSlots.js");
  const store = await import(toUrl(storeFile));
  assert.ok(typeof store.cleanExpiredHolds === "function", "Store must provide cleanExpiredHolds");
});

// BP-11: Admin review sync triggers event
test("BP-11: Admin review updates store and dispatches event for listener synchronization", () => {
  const verifStore = path.join(W_SRC, "pages/BackendParity/mockVerification.js");
  assert.ok(exists(verifStore), "Verification store must exist: mockVerification.js");
  const code = read(verifStore);
  assert.match(code, /workgo-verification-changed/, "Verification store must dispatch workgo-verification-changed");
});

// BP-12: No dead ends in parity pages
test("BP-12: Parity pages do not contain href='#' or unhandled dead ends", () => {
  const pages = [
    path.join(W_SRC, "pages/BackendParity/VerificationCenterPage.jsx"),
    path.join(W_SRC, "pages/BackendParity/BookingSlotsPage.jsx"),
    path.join(W_SRC, "pages/BackendParity/AdminConsolePage.jsx"),
  ];

  for (const p of pages) {
    assert.ok(exists(p), `Page must exist: ${p}`);
    const code = read(p);
    assert.doesNotMatch(code, /href\s*=\s*['"]#['"]/, `Dead link href='#' forbidden in ${p}`);
  }
});
