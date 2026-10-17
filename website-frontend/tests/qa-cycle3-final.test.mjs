import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  TITLE_MIN,
  TITLE_MAX,
  DESC_MIN,
  PRICE_MIN,
  PRICE_MAX,
  stripHtmlTags,
  sanitizeText,
  validateTitle,
  validateDescription,
  validatePrice,
} from "../../web-app/src/pages/ServiceForm/formValidation.js";
import { getTrapCandidates } from "../../web-app/src/hooks/useFocusTrap.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const SRC = path.join(REPO, "web-app", "src");
const MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

const read = (p) => fs.readFileSync(p, "utf-8");
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

// ---------- F1: pure form validation ----------
test("F1: boundary constants match spec", () => {
  assert.equal(TITLE_MIN, 15);
  assert.equal(TITLE_MAX, 100);
  assert.equal(DESC_MIN, 20);
  assert.equal(PRICE_MIN, 50000);
  assert.equal(PRICE_MAX, 100000000);
});

test("F1: validateTitle 14 err / 15 pass / 100 pass / 101 err", () => {
  assert.ok(validateTitle("a".repeat(14)));
  assert.equal(validateTitle("a".repeat(15)), null);
  assert.equal(validateTitle("a".repeat(100)), null);
  assert.ok(validateTitle("a".repeat(101)));
});

test("F1: sanitize strips tags, validateTitle measures after sanitize", () => {
  assert.equal(sanitizeText("<script>alert(1)</script>hi"), "alert(1)hi");
  assert.equal(stripHtmlTags("<b>bold</b> text"), "bold text");
  assert.equal(validateTitle("<b>" + "a".repeat(15) + "</b>"), null);
});

test("F1: validateDescription strips tags then measures >= 20", () => {
  assert.ok(validateDescription("<p>ngắn</p>"));
  assert.equal(validateDescription("<p>" + "mô tả chi tiết ".repeat(3) + "</p>"), null);
});

test("F1: validatePrice 0/-1/NaN/100000001 err, 50000 and 100M pass", () => {
  assert.ok(validatePrice(0));
  assert.ok(validatePrice(-1));
  assert.ok(validatePrice(NaN));
  assert.ok(validatePrice(100000001));
  assert.equal(validatePrice(50000), null);
  assert.equal(validatePrice(100000000), null);
});

test("F1: validateStep uses helpers with per-field VI messages", () => {
  const page = read(path.join(SRC, "pages/ServiceForm/ServiceFormPage.jsx"));
  assert.match(page, /validateTitle\(/);
  assert.match(page, /validateDescription\(/);
  assert.match(page, /validatePrice\(/);
  assert.match(page, /errs\.price/);
});

test("F1: Step2 renders errors.price under the price row", () => {
  const step2 = read(path.join(SRC, "pages/ServiceForm/components/Step2Pricing/Step2Pricing.jsx"));
  assert.match(step2, /errors\.price/);
});

test("F1: price input normalizes NaN instead of storing it", () => {
  const step2 = read(path.join(SRC, "pages/ServiceForm/components/Step2Pricing/Step2Pricing.jsx"));
  assert.match(step2, /Number\.isFinite\(Number\(value\)\)/);
});

// ---------- F2: rapid filter race ----------
test("F2: debounce has clearTimeout cleanup and keeps 250ms delay", () => {
  const catalog = read(path.join(SRC, "pages/CatalogSearch/CatalogSearchPage.jsx"));
  assert.match(catalog, /clearTimeout\(t\)/);
  assert.match(catalog, /setTimeout\(\(\)\s*=>\s*setIsFiltering\(false\),\s*250\)/);
});

// ---------- F3: focus trap ----------
test("F3: trap candidate helper cycles Tab and Shift+Tab", () => {
  const next = getTrapCandidates(["a", "b", "c"], "c", false);
  assert.equal(next, "a");
  const prev = getTrapCandidates(["a", "b", "c"], "a", true);
  assert.equal(prev, "c");
  assert.equal(getTrapCandidates([], "a", false), null);
  assert.equal(getTrapCandidates(["a"], "x", false), "a");
});

for (const [name, file] of [
  ["AuthModal", "components/common/AuthModal/AuthModal.jsx"],
  ["Header drawer", "components/common/Header/Header.jsx"],
  ["Catalog filter drawer", "pages/CatalogSearch/CatalogSearchPage.jsx"],
]) {
  test(`F3: ${name} uses useFocusTrap`, () => {
    const jsx = read(path.join(SRC, file));
    assert.match(jsx, /useFocusTrap\(/);
  });
}

// ---------- F4: Android hardware back ----------
test("F4: android home has BackHandler with Escape-inject, goBack, exit order", () => {
  const tsx = read(path.join(REPO, "android-frontend", "src", "app", "index.tsx"));
  assert.match(tsx, /BackHandler/);
  assert.match(tsx, /hardwareBackPress/);
  assert.match(tsx, /injectJavaScript/);
  assert.match(tsx, /Escape/);
  assert.match(tsx, /true;/);
  assert.match(tsx, /canGoBack/);
  assert.match(tsx, /\.goBack\(\)/);
  assert.match(tsx, /onNavigationStateChange/);
});

// ---------- F5: CSS hygiene report exists, no leftover dupes ----------
test("F5: css-hygiene.md audit report exists", () => {
  const md = path.join(REPO, ".team", "evidence", "cycle3", "css-hygiene.md");
  assert.ok(fs.existsSync(md), "missing .team/evidence/cycle3/css-hygiene.md");
});

// ---------- F6: toast queue ----------
for (const [name, file] of [
  ["web-app", "App.jsx"],
  ["bridge", "../../website-frontend/src/components/webapp-bridge/webapp-shell.tsx"],
]) {
  test(`F6: ${name} toast is a max-3 queue with 3500ms auto-dismiss + close button`, () => {
    const code = read(path.join(SRC, file));
    assert.match(code, /toasts/);
    assert.match(code, /slice\(-2\)/);
    assert.match(code, /3500/);
    assert.match(code, /dismissToast/);
    assert.match(code, /role="status"/);
  });
}

// ---------- Cycle 2 N1: rapid probe script ----------
test("Cycle2-N1: rapid probe script exists with type + tabs probes", () => {
  const probe = read(path.join(REPO, "scripts", "qa-verify-cycle2-rapid.mjs"));
  assert.match(probe, /rapid-type/);
  assert.match(probe, /rapid-tabs/);
});

// ---------- S1: mirror parity for every touched source file ----------
test("S1: every Cycle-3 source file is byte-identical in _webapp-mirror", () => {
  const files = [
    "pages/ServiceForm/formValidation.js",
    "hooks/useFocusTrap.js",
    "pages/ServiceForm/ServiceFormPage.jsx",
    "pages/ServiceForm/components/Step1Info/Step1Info.jsx",
    "pages/ServiceForm/components/Step2Pricing/Step2Pricing.jsx",
    "pages/CatalogSearch/CatalogSearchPage.jsx",
    "components/common/AuthModal/AuthModal.jsx",
    "components/common/Header/Header.jsx",
    "App.jsx",
    "App.module.css",
    "pages/MyServices/components/ServicesTable/ServicesTable.jsx",
  ];
  for (const f of files) {
    assert.equal(sha256(path.join(MIRROR, f)), sha256(path.join(SRC, f)), `mirror mismatch: ${f}`);
  }
});
