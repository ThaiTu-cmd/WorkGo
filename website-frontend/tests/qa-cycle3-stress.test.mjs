import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  stripHtmlTags,
  sanitizeText,
  validateTitle,
  validateDescription,
  validatePrice,
  clampPrice,
} from "../../web-app/src/pages/ServiceForm/formValidation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const SRC = path.join(REPO, "web-app", "src");

const read = (p) => fs.readFileSync(p, "utf-8");

function walkJs(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJs(p, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// ---------- S1: multi-field stress vectors ----------
test("S1: emoji flood survives sanitize with correct length", () => {
  const raw = "🎉🚀✨".repeat(40);
  assert.equal(sanitizeText(raw), raw);
  assert.ok(validateTitle(raw) !== null); // 120 chars > 100 -> must err
});

test("S1: CJK + Arabic passes through without corruption", () => {
  const raw = "日本語テスト中文测试اختبار".repeat(10);
  assert.equal(sanitizeText(raw), raw);
});

test("S1: nested HTML strips to inner text", () => {
  assert.equal(sanitizeText("<div><b><i>lồng</i></b></div>"), "lồng");
});

test("S1: multiline newlines collapse to one space", () => {
  assert.equal(sanitizeText("a\n\n\n\nb"), "a b");
  assert.equal(validateDescription("a\n\n\n\nb"), "Vui lòng nhập mô tả chi tiết từ 20 ký tự trở lên!");
});

test("S1: 150-char title errors and stays render-safe", () => {
  const err = validateTitle("a".repeat(150));
  assert.ok(err && err.includes("150/100"));
});

test("S1 Edge case: empty, null, undefined, pure whitespace inputs", () => {
  assert.equal(sanitizeText(null), "");
  assert.equal(sanitizeText(undefined), "");
  assert.equal(sanitizeText(""), "");
  assert.equal(sanitizeText("   \t\n   "), "");
  assert.ok(validateTitle(""));
  assert.ok(validateDescription(""));
});

test("S1 Edge case: complex HTML tags with attributes & scripts", () => {
  assert.equal(sanitizeText('<a href="https://example.com" onclick="alert(1)">Liên kết</a>'), "Liên kết");
  assert.equal(sanitizeText('<img src="x" onerror="evil()" />ảnh'), "ảnh");
  assert.equal(stripHtmlTags("<div class='card'><span style='color:red'>Nội dung</span></div>"), "Nội dung");
});

test("S1 Corner case: clampPrice handles NaN, negative, zero, and boundary limits", () => {
  assert.equal(clampPrice(NaN), 0);
  assert.equal(clampPrice(null), 0);
  assert.equal(clampPrice(-100), 0);
  assert.equal(clampPrice(0), 0);
  assert.equal(clampPrice(50000), 50000);
  assert.equal(clampPrice(100000000), 100000000);
  assert.equal(clampPrice(999999999), 100000000);
});

test("S1 Boundary case: validatePrice strict bounds and formatting", () => {
  assert.equal(validatePrice("abc"), "Giá gói phải là số lớn hơn 0!");
  assert.ok(validatePrice(49999)?.includes("50.000 ₫"));
  assert.equal(validatePrice(50000), null);
  assert.equal(validatePrice(100000000), null);
  assert.ok(validatePrice(100000001)?.includes("100.000.000 ₫"));
});

// ---------- S2: skeleton ≡ real-card geometry ----------
test("S2: skeleton metrics mirror ServiceCard metrics", () => {
  const sk = read(path.join(SRC, "components/common/Skeleton/SkeletonServiceCard.module.css"));
  const card = read(path.join(SRC, "components/common/ServiceCard/ServiceCard.module.css"));
  assert.match(sk, /\.skBody\s*\{[^}]*padding:\s*16px/);
  assert.match(card, /padding:\s*16px/);
  assert.match(sk, /\.skProviderRow\s*\{[^}]*gap:\s*10px/);
});

// ---------- S3: keyboard hint in footer bottom-bar ----------
test("S3: footer bottom-bar shows the keyboard hint as plain text", () => {
  const footer = read(path.join(SRC, "components/common/Footer/Footer.jsx"));
  const hint = "Mẹo bàn phím: Tab di chuyển • Esc đóng nhanh";
  assert.ok(footer.includes(hint), "hint string missing in Footer.jsx");
  const line = footer.split("\n").find((l) => l.includes(hint));
  assert.ok(line && !line.includes("<a"), "hint must be plain text, not a dead link");
  const mirror = read(path.join(REPO, "website-frontend/src/_webapp-mirror/components/common/Footer/Footer.jsx"));
  assert.ok(mirror.includes(hint), "hint missing in mirror");
});

// ---------- S5: zero console noise outside QA scripts ----------
test("S5: no console.log/warn/error in web-app src and bridge non-mirror code", () => {
  const roots = [
    path.join(SRC),
    path.join(REPO, "website-frontend/src/components/webapp-bridge"),
  ];
  const hits = [];
  for (const root of roots) {
    for (const f of walkJs(root)) {
      if (read(f).match(/console\.(log|warn|error)\(/)) hits.push(path.relative(REPO, f));
    }
  }
  assert.deepEqual(hits, [], `console noise found: ${hits.join(", ")}`);
});

// ---------- S6: REPORT carries the CLOSE mark ----------
test("S6: REPORT.md has ops quickstart, gates, keys and the CLOSE mark", () => {
  const report = read(path.join(REPO, "REPORT.md"));
  assert.match(report, /CYCLE 3\/3/);
  assert.match(report, /CLOSE/);
  assert.match(report, /5173/);
  assert.match(report, /3000/);
  assert.match(report, /workgo_provider_services_overrides/);
});
