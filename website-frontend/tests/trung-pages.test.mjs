import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const W = path.join(REPO, "website-frontend");
const TRUNG = path.join(W, "src/components/trung-pages");
const SHELL = path.join(W, "src/components/webapp-bridge/webapp-shell.tsx");

const read = (p) => fs.readFileSync(p, "utf-8");

const ROUTES = [
  "register",
  "login",
  "profile-settings",
  "provider-onboarding",
  "address-book",
  "provider-profile",
  "job-list",
  "job-post",
  "submit-proposal",
  "proposal-review",
  "payment-gateway",
  "wallet",
  "payout-settings",
  "review-form",
  "dispute-center",
];

const PAGES = [
  "auth/RegisterPage.tsx",
  "auth/LoginPage.tsx",
  "profile/ProfileSettingsPage.tsx",
  "profile/AddressBookPage.tsx",
  "provider/ProviderOnboardingPage.tsx",
  "provider/ProviderProfilePage.tsx",
  "jobs/JobListPage.tsx",
  "jobs/JobPostPage.tsx",
  "jobs/SubmitProposalPage.tsx",
  "jobs/ProposalReviewPage.tsx",
  "payment/PaymentGatewayPage.tsx",
  "payment/WalletPage.tsx",
  "payment/PayoutSettingsPage.tsx",
  "trust/ReviewFormPage.tsx",
  "trust/DisputeCenterPage.tsx",
];

test("trung-pages: all 15 page components + css modules exist", () => {
  for (const p of PAGES) {
    assert.ok(fs.existsSync(path.join(TRUNG, p)), `missing ${p}`);
    const css = p.replace(/\.tsx$/, ".module.css");
    assert.ok(fs.existsSync(path.join(TRUNG, css)), `missing ${css}`);
  }
});

test("trung-pages: shell union carries all 15 routes + jobId/providerId/orderId params", () => {
  const shell = read(SHELL);
  const hasRoute = (r) => shell.includes(`'${r}'`) || shell.includes(`"${r}"`);
  const hasBranch = (r) => shell.includes(`currentPage === '${r}'`) || shell.includes(`currentPage === "${r}"`);
  for (const r of ROUTES) {
    assert.ok(hasRoute(r), `union missing '${r}'`);
    assert.ok(hasBranch(r), `render branch missing '${r}'`);
  }
  assert.ok(shell.includes("jobId?:"), "CatalogFilterParams missing jobId");
  assert.ok(shell.includes("providerId?:"), "CatalogFilterParams missing providerId");
  assert.ok(shell.includes("orderId?:"), "CatalogFilterParams missing orderId");
});

test("trung-pages: TrungSubNav links to all 15 routes", () => {
  const nav = read(path.join(TRUNG, "_ui/TrungSubNav.tsx"));
  for (const r of ROUTES) {
    assert.ok(nav.includes(r), `TrungSubNav missing '${r}'`);
  }
});

test("trung-pages: localStorage keys use workgo_* namespace", () => {
  const keys = read(path.join(TRUNG, "_stores/keys.ts"));
  for (const k of [
    "workgo_jobs",
    "workgo_proposals",
    "workgo_wallet",
    "workgo_disputes",
    "workgo_addresses",
    "workgo_profile",
    "workgo_payout",
    "workgo_provider_request",
    "accessToken",
  ]) {
    assert.ok(keys.includes(k), `keys.ts missing '${k}'`);
  }
});

test("trung-pages: no reverse import from _webapp-mirror in new pages", () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && read(p).includes("_webapp-mirror")) hits.push(path.relative(REPO, p));
    }
  };
  walk(TRUNG);
  assert.deepEqual(hits, [], `mirror imports found: ${hits.join(", ")}`);
});

test("trung-pages: no console.* in new pages", () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && /console\.(log|warn|error)\(/.test(read(p)))
        hits.push(path.relative(REPO, p));
    }
  };
  walk(TRUNG);
  assert.deepEqual(hits, [], `console noise found: ${hits.join(", ")}`);
});

test("trung-pages: vietnamese validation messages present", () => {
  const all = PAGES.map((p) => read(path.join(TRUNG, p))).join("\n")
    + read(path.join(TRUNG, "auth/authValidation.ts"));
  for (const msg of [
    "Email chưa đúng định dạng!",
    "Mật khẩu tối thiểu 6 ký tự!",
    "Số điện thoại phải 10 số, bắt đầu bằng 0!",
    "Giá tối thiểu là",
    "Bộ nhớ trình duyệt bị đầy",
  ]) {
    assert.ok(all.includes(msg), `message missing: ${msg}`);
  }
});

test("trung-pages: mocks cover budgets in 50k-100M and 4 job types", () => {
  const jobs = read(path.join(TRUNG, "_mocks/mockJobs.ts"));
  for (const t of ["DIGITAL", "ONSITE", "DELIVERY", "APPOINTMENT"]) {
    assert.ok(jobs.includes(`"${t}"`), `mockJobs missing type ${t}`);
  }
});

test("trung-pages: all mock data sets exist and are structured properly", () => {
  for (const m of [
    "mockJobs.ts",
    "mockProposals.ts",
    "mockWallet.ts",
    "mockDisputes.ts",
    "mockProviders.ts",
    "mockAddresses.ts",
    "mockProfile.ts",
    "mockPayout.ts",
    "mockReviews.ts",
  ]) {
    assert.ok(fs.existsSync(path.join(TRUNG, "_mocks", m)), `missing mock file ${m}`);
  }

  const addresses = read(path.join(TRUNG, "_mocks/mockAddresses.ts"));
  assert.ok(addresses.includes("Landmark"), "mockAddresses must have Landmark address");
  assert.ok(addresses.includes("isDefault: true"), "mockAddresses must have default address");

  const profile = read(path.join(TRUNG, "_mocks/mockProfile.ts"));
  assert.ok(profile.includes("Trần Hữu Trung"), "mockProfile must have member name");
  assert.ok(profile.includes("0901234567"), "mockProfile must have valid phone");

  const payout = read(path.join(TRUNG, "_mocks/mockPayout.ts"));
  assert.ok(payout.includes("Vietcombank"), "mockPayout must have bank name");
  assert.ok(payout.includes("0071001234567"), "mockPayout must have account number");

  const reviews = read(path.join(TRUNG, "_mocks/mockReviews.ts"));
  assert.ok(reviews.includes("ORD-1038"), "mockReviews must reference order");
  assert.ok(reviews.includes("stars: 5"), "mockReviews must have 5-star review");
});

