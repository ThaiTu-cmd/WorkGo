import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const W_SRC = path.join(REPO, "web-app/src");
const M_SRC = path.join(REPO, "website-frontend/src/_webapp-mirror");
const S_SRC = path.join(REPO, "website-frontend/src");

const read = (p) => fs.readFileSync(p, "utf-8");
const exists = (p) => fs.existsSync(p);
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const toUrl = (p) => pathToFileURL(p).href;

// FP-01: Footer không còn dead link
test("FP-01: Footer has no dead links (no href='#', href={'#'}, or '#' array entries)", () => {
  const footerJsx = read(path.join(W_SRC, "components/common/Footer/Footer.jsx"));
  assert.doesNotMatch(footerJsx, /href\s*=\s*['"]#['"]/, "Literal href='#' forbidden");
  assert.doesNotMatch(footerJsx, /href\s*=\s*\{['"]#['"]\}/, "JSX href={'#'} forbidden");
  assert.doesNotMatch(footerJsx, /href:\s*['"]#['"]/, "Object href: '#' forbidden");
  assert.doesNotMatch(footerJsx, /['"]#['"]\s*,/, "Array item '#' forbidden");
  assert.doesNotMatch(footerJsx, /['"]#categories['"]|['"]#how-it-works['"]|['"]#why-workgo['"]|['"]#cta['"]/, "Hash links forbidden in footer");
});

// FP-02: Đủ 21 link, label unique
test("FP-02: FOOTER_COLUMNS flattens to exactly 21 links with unique labels and pages", async () => {
  const footerModule = await import(toUrl(path.join(W_SRC, "components/common/Footer/footerLinks.js")));
  const { FOOTER_COLUMNS } = footerModule;
  assert.ok(Array.isArray(FOOTER_COLUMNS), "FOOTER_COLUMNS must be exported array");

  const links = FOOTER_COLUMNS.flatMap((col) => col.links || []);
  assert.equal(links.length, 21, "Must contain exactly 21 footer links");

  const labels = new Set();
  for (const l of links) {
    assert.ok(l.label && typeof l.label === "string", "Each link must have string label");
    assert.ok(l.page && typeof l.page === "string", "Each link must have string page");
    assert.ok(!labels.has(l.label), `Duplicate label: ${l.label}`);
    labels.add(l.label);
  }
});

// FP-03: Mọi page hợp lệ
test("FP-03: Every footer page target is valid", async () => {
  const footerModule = await import(toUrl(path.join(W_SRC, "components/common/Footer/footerLinks.js")));
  const infoModule = await import(toUrl(path.join(W_SRC, "pages/PublicInfo/publicInfoContent.js")));
  const { FOOTER_COLUMNS } = footerModule;
  const { PUBLIC_INFO_PAGE_KEYS } = infoModule;

  const validPages = new Set([
    "catalog",
    "job-post",
    "provider-onboarding",
    "payout-settings",
    ...PUBLIC_INFO_PAGE_KEYS,
  ]);

  const links = FOOTER_COLUMNS.flatMap((col) => col.links || []);
  for (const l of links) {
    assert.ok(validPages.has(l.page), `Invalid footer page target: ${l.page}`);
  }
});

// FP-04: Registry nội dung 12 trang
test("FP-04: Public info registry has 12 complete content keys without placeholders", async () => {
  const infoModule = await import(toUrl(path.join(W_SRC, "pages/PublicInfo/publicInfoContent.js")));
  const { PUBLIC_INFO_PAGE_KEYS, PUBLIC_INFO } = infoModule;

  assert.equal(PUBLIC_INFO_PAGE_KEYS.length, 12, "Must declare exactly 12 public info keys");
  for (const key of PUBLIC_INFO_PAGE_KEYS) {
    const item = PUBLIC_INFO[key];
    assert.ok(item, `Content missing for key ${key}`);
    assert.ok(item.title && typeof item.title === "string", `Title missing for ${key}`);
    assert.ok(item.subtitle && typeof item.subtitle === "string", `Subtitle missing for ${key}`);

    const hasContent =
      (item.sections && item.sections.length > 0) ||
      (item.groups && item.groups.length > 0) ||
      (item.roles && item.roles.length > 0) ||
      (item.cards && item.cards.length > 0) ||
      (item.topics && item.topics.length > 0);
    assert.ok(hasContent, `Substantive content missing for key ${key}`);

    const serialized = JSON.stringify(item);
    assert.doesNotMatch(serialized, /\bTODO\b/i, `TODO placeholder found in ${key}`);
    assert.doesNotMatch(serialized, /\blorem\b/i, `Lorem placeholder found in ${key}`);
    assert.doesNotMatch(serialized, /\bcoming soon\b/i, `Coming soon placeholder found in ${key}`);
  }
});

// FP-05: Website union + branch
test("FP-05: webapp-shell.tsx contains 15 new page keys and render branches", () => {
  const shellTsx = read(path.join(S_SRC, "components/webapp-bridge/webapp-shell.tsx"));
  const requiredKeys = [
    "about", "careers", "terms", "privacy", "contact", "faq",
    "refund-policy", "verification-standards", "package-rules", "community",
    "how-it-works", "escrow-protection",
    "verification-center", "booking-slots", "admin-console",
  ];

  for (const k of requiredKeys) {
    assert.match(shellTsx, new RegExp(`['"]${k}['"]`), `webapp-shell.tsx must declare key ${k}`);
  }

  assert.match(shellTsx, /PublicInfoPage/, "webapp-shell.tsx must render PublicInfoPage");
  assert.match(shellTsx, /VerificationCenterPage/, "webapp-shell.tsx must render VerificationCenterPage");
  assert.match(shellTsx, /BookingSlotsPage/, "webapp-shell.tsx must render BookingSlotsPage");
  assert.match(shellTsx, /AdminConsolePage/, "webapp-shell.tsx must render AdminConsolePage");
});

// FP-06: web-app branch
test("FP-06: web-app App.jsx renders 15 new page keys and fallback", () => {
  const appJsx = read(path.join(W_SRC, "App.jsx"));
  const requiredKeys = [
    "about", "careers", "terms", "privacy", "contact", "faq",
    "refund-policy", "verification-standards", "package-rules", "community",
    "how-it-works", "escrow-protection",
    "verification-center", "booking-slots", "admin-console",
  ];

  for (const k of requiredKeys) {
    assert.match(appJsx, new RegExp(`['"]${k}['"]`), `App.jsx must reference key ${k}`);
  }
  assert.match(appJsx, /NotFoundPage/, "App.jsx must render NotFoundPage fallback");
});

// FP-07: Footer được truyền onNavigate
test("FP-07: Both webapp-shell.tsx and App.jsx wire onNavigate to Footer", () => {
  const shellTsx = read(path.join(S_SRC, "components/webapp-bridge/webapp-shell.tsx"));
  const appJsx = read(path.join(W_SRC, "App.jsx"));

  assert.match(shellTsx, /<Footer\b[^>]*onNavigate\s*=/);
  assert.match(appJsx, /<Footer\b[^>]*onNavigate\s*=/);
});

// FP-08: Mirror parity for all shared files
test("FP-08: Shared source files are byte-identical in _webapp-mirror", () => {
  const shared = [
    "components/common/Footer/Footer.jsx",
    "components/common/Footer/Footer.module.css",
    "components/common/Footer/footerLinks.js",
    "pages/PublicInfo/PublicInfoPage.jsx",
    "pages/PublicInfo/PublicInfoPage.module.css",
    "pages/PublicInfo/publicInfoContent.js",
    "pages/BackendParity/VerificationCenterPage.jsx",
    "pages/BackendParity/VerificationCenterPage.module.css",
    "pages/BackendParity/BookingSlotsPage.jsx",
    "pages/BackendParity/BookingSlotsPage.module.css",
    "pages/BackendParity/AdminConsolePage.jsx",
    "pages/BackendParity/AdminConsolePage.module.css",
    "pages/BackendParity/mockAuth.js",
    "pages/BackendParity/mockVerification.js",
    "pages/BackendParity/mockBookingSlots.js",
    "pages/BackendParity/mockAdmin.js",
    "pages/NotFound/NotFoundPage.jsx",
    "pages/NotFound/NotFoundPage.module.css",
    "App.jsx",
  ];

  for (const f of shared) {
    const src = path.join(W_SRC, f);
    const mir = path.join(M_SRC, f);
    assert.ok(exists(src), `Source file must exist: ${src}`);
    assert.ok(exists(mir), `Mirror file must exist: ${mir}`);
    assert.equal(sha256(src), sha256(mir), `Mirror sha256 mismatch for ${f}`);
  }
});

// FP-09: Không API trong file mới
test("FP-09: No backend HTTP calls or API imports in new files", () => {
  const dirs = [
    path.join(W_SRC, "pages/PublicInfo"),
    path.join(W_SRC, "pages/BackendParity"),
    path.join(W_SRC, "pages/NotFound"),
  ];

  for (const d of dirs) {
    assert.ok(exists(d), `Directory must exist: ${d}`);
    const files = fs.readdirSync(d).filter((f) => f.endsWith(".jsx") || f.endsWith(".js"));
    for (const f of files) {
      const code = read(path.join(d, f));
      assert.doesNotMatch(code, /\bfetch\s*\(/, `fetch() forbidden in ${f}`);
      assert.doesNotMatch(code, /\baxios\b/, `axios forbidden in ${f}`);
      assert.doesNotMatch(code, /\/api\/v1\//, `/api/v1 forbidden in ${f}`);
      assert.doesNotMatch(code, /:8888|:808[1-4]/, `Backend port forbidden in ${f}`);
      assert.doesNotMatch(code, /import\s+.*from\s+['"][^'"]*\/api\//, `api client import forbidden in ${f}`);
    }
  }
});

// FP-10: Storage namespace/SSR safe
test("FP-10: New storage keys use workgo_ prefix and are SSR safe", () => {
  const bpDir = path.join(W_SRC, "pages/BackendParity");
  const piDir = path.join(W_SRC, "pages/PublicInfo");
  const checkFiles = [
    path.join(bpDir, "mockVerification.js"),
    path.join(bpDir, "mockBookingSlots.js"),
    path.join(bpDir, "mockAdmin.js"),
    path.join(piDir, "PublicInfoPage.jsx"),
  ];

  for (const file of checkFiles) {
    assert.ok(exists(file), `File must exist: ${file}`);
    const code = read(file);
    const storageKeys = [...code.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const k of storageKeys) {
      assert.ok(
        k.startsWith("workgo_") || k === "accessToken",
        `Storage key must start with workgo_: ${k} in ${file}`
      );
    }
    assert.match(code, /typeof\s+window\s*!==\s*['"]undefined['"]|typeof\s+window\s*===\s*['"]undefined['"]/, `SSR window guard required in ${file}`);
  }
});

// FP-11: Footer responsive rules
test("FP-11: Footer CSS provides responsive column rules and touch targets", () => {
  const css = read(path.join(W_SRC, "components/common/Footer/Footer.module.css"));
  assert.match(css, /@media\s*\(\s*max-width:\s*(?:540px|600px)\s*\)/, "Mobile column breakpoint required");
  assert.match(css, /min-height:\s*44px/, "Touch target minimum 44px required");
  assert.match(css, /:focus-visible/, "Focus-visible styling required");
});

// FP-12: NotFoundPage exists and acts as fallback
test("FP-12: NotFoundPage exists in source and mirror", () => {
  assert.ok(exists(path.join(W_SRC, "pages/NotFound/NotFoundPage.jsx")), "NotFoundPage source must exist");
  assert.ok(exists(path.join(M_SRC, "pages/NotFound/NotFoundPage.jsx")), "NotFoundPage mirror must exist");
});

// FP-13: Legal content includes timestamp and disclaimer
test("FP-13: Terms, privacy, and refund-policy include last updated date and demo disclaimer", async () => {
  const infoModule = await import(toUrl(path.join(W_SRC, "pages/PublicInfo/publicInfoContent.js")));
  const { PUBLIC_INFO } = infoModule;

  for (const key of ["terms", "privacy", "refund-policy"]) {
    const item = PUBLIC_INFO[key];
    assert.ok(item, `Legal page missing: ${key}`);
    const serialized = JSON.stringify(item);
    assert.match(serialized, /Cập nhật lần cuối/i, `${key} must contain 'Cập nhật lần cuối'`);
    assert.match(serialized, /minh hoạ cho bản demo|không phải tư vấn pháp lý/i, `${key} must contain demo disclaimer`);
  }
});

// FP-14: Preserves S3 keyboard shortcut hint contract
test("FP-14: Keyboard shortcut hint text contract preserved in Footer.jsx", () => {
  const footerJsx = read(path.join(W_SRC, "components/common/Footer/Footer.jsx"));
  assert.match(footerJsx, /Mẹo bàn phím: Tab di chuyển • Esc đóng nhanh/);
  // Hint must not be wrapped inside an <a> tag
  assert.doesNotMatch(footerJsx, /<a\b[^>]*>[^<]*Mẹo bàn phím/);
});
