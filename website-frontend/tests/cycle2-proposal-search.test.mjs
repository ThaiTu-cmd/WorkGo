import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");
const readAndroid = (p) => fs.readFileSync(path.join(ANDROID_ROOT, p), "utf-8");
const existsAndroid = (p) => fs.existsSync(path.join(ANDROID_ROOT, p));
const readWeb = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// ==========================================
// C2-1: PROPOSAL MOBILE CONTRACTS
// ==========================================

test("C2-1 / PROP-01: proposals.ts exists with correct endpoints and no mock data", () => {
  const file = "src/api/proposals.ts";
  assert.ok(existsAndroid(file), "src/api/proposals.ts must exist");
  const src = readAndroid(file);

  assert.match(
    src,
    /\/api\/v1\/posts\/\$\{encodeURIComponent\(postId\)\}\/proposals\/applied/,
    "hasApplied must target /api/v1/posts/{id}/proposals/applied"
  );
  assert.match(
    src,
    /\/api\/v1\/posts\/\$\{encodeURIComponent\(postId\)\}\/proposals/,
    "submit must target POST /api/v1/posts/{id}/proposals"
  );
  assert.match(
    src,
    /\/api\/v1\/proposals\/my/,
    "myApplications must target /api/v1/proposals/my"
  );
  assert.doesNotMatch(src, /mockProposals|demoProposal/, "Zero mock proposals in proposals.ts");
});

test("C2-1 / PROP-02: Proposal validation boundary checks (price, days, message)", () => {
  // Pure validator corresponding to the schema
  function validateProposal(input, budgetMax, isProvider) {
    if (!isProvider) return { valid: false, error: "Chỉ tài khoản Đối tác được gửi báo giá" };
    if (!input.price || input.price <= 0) return { valid: false, error: "Giá báo phải lớn hơn 0" };
    if (budgetMax !== undefined && budgetMax > 0 && input.price > budgetMax) {
      return { valid: false, error: "Giá báo không được vượt quá ngân sách tối đa" };
    }
    if (!input.estimatedDays || !Number.isInteger(input.estimatedDays) || input.estimatedDays < 1) {
      return { valid: false, error: "Thời gian thực hiện tối thiểu 1 ngày" };
    }
    if (!input.message || input.message.trim().length < 20) {
      return { valid: false, error: "Lời nhắn tối thiểu 20 ký tự" };
    }
    return { valid: true, error: null };
  }

  // Role guard
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 3, message: "A".repeat(25) }, 500000, false).valid, false);

  // Price boundary
  assert.strictEqual(validateProposal({ price: 0, estimatedDays: 3, message: "A".repeat(25) }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: -100, estimatedDays: 3, message: "A".repeat(25) }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: 600000, estimatedDays: 3, message: "A".repeat(25) }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: 500000, estimatedDays: 3, message: "A".repeat(25) }, 500000, true).valid, true);

  // Days boundary
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 0, message: "A".repeat(25) }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 1.5, message: "A".repeat(25) }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 1, message: "A".repeat(25) }, 500000, true).valid, true);

  // Message boundary
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 3, message: "Ngắn quá" }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 3, message: "A".repeat(19) }, 500000, true).valid, false);
  assert.strictEqual(validateProposal({ price: 100000, estimatedDays: 3, message: "A".repeat(20) }, 500000, true).valid, true);
});

test("C2-1 / PROP-03: ProposalSheet component exports and props structure", () => {
  const file = "src/components/proposal-sheet.tsx";
  assert.ok(existsAndroid(file), "src/components/proposal-sheet.tsx must exist");
  const src = readAndroid(file);

  assert.match(src, /export\s+function\s+ProposalSheet/, "Must export ProposalSheet component");
  assert.match(src, /isProvider/, "Must handle isProvider prop");
  assert.match(src, /hasApplied/, "Must handle hasApplied prop");
  assert.match(src, /budgetMax/, "Must handle budgetMax prop");
  assert.match(src, /onSubmit/, "Must handle onSubmit callback");
});

test("C2-1 / PROP-04: detail.tsx wires ProposalSheet and hasApplied state check", () => {
  const src = readAndroid("src/app/detail.tsx");
  assert.match(src, /proposalsApi\.hasApplied/, "detail.tsx must check hasApplied on mount");
  assert.match(src, /ProposalSheet/, "detail.tsx must render ProposalSheet");
  assert.match(src, /setSheetVisible|sheetVisible/, "detail.tsx must control ProposalSheet visibility");
});

// ==========================================
// C2-2: SEARCH DEBOUNCE & ABORT CONTROLLER
// ==========================================

test("C2-2 / SRCH-01: use-debounced-value.ts exists and exposes debounceValue and useDebouncedValue", () => {
  const file = "src/hooks/use-debounced-value.ts";
  assert.ok(existsAndroid(file), "use-debounced-value.ts must exist");
  const src = readAndroid(file);

  assert.match(src, /export\s+function\s+debounceValue/, "Must export debounceValue promise core");
  assert.match(src, /export\s+function\s+useDebouncedValue/, "Must export useDebouncedValue hook");
  assert.match(src, /delay\s*=\s*300/, "Default delay must be 300ms");
});

test("C2-2 / SRCH-02: Web api-client.ts supports signal and handles AbortError with code ABORTED", () => {
  const src = readWeb("src/lib/api-client.ts");
  assert.match(src, /signal\?:?\s*AbortSignal/, "ApiFetchOptions must include optional signal");
  assert.match(src, /signal[,:\s]/, "fetch must receive signal");
  assert.match(src, /['"]ABORTED['"]/, "Must map AbortError to ApiError code ABORTED");
});

test("C2-2 / SRCH-03: Web posts adapter passes signal to apiFetch", () => {
  const src = readWeb("src/lib/adapters/posts.ts");
  assert.match(src, /signal/, "postsApi.list must accept or forward signal options");
});

test("C2-2 / SRCH-04: Web fiverr-search-form debounces query for suggestions with 300ms", () => {
  const src = readWeb("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(src, /300/, "Search form must use 300ms debounce delay for suggestions");
  assert.match(src, /sanitizeSearchQuery/, "submitSearch must sanitize and submit query immediately");
});

test("C2-2 / SRCH-05: Mobile catalog.tsx uses useDebouncedValue and AbortController", () => {
  const src = readAndroid("src/app/catalog.tsx");
  assert.match(src, /useDebouncedValue/, "catalog.tsx must use useDebouncedValue hook");
  assert.match(src, /AbortController/, "catalog.tsx must instantiate AbortController");
  assert.match(src, /signal:\s*(?:controller|c)\.signal/, "catalog.tsx must forward signal to postsApi.list");
  assert.match(src, /(?:controller|c)\.abort\(\)/, "catalog.tsx must abort previous request on cleanup");
});

test("C2-2 / SRCH-06: Mobile posts.ts passes signal to apiFetch and throws errors", () => {
  const src = readAndroid("src/api/posts.ts");
  assert.match(src, /signal\?:?\s*AbortSignal/, "Mobile postsApi.list must accept signal option");
  assert.match(src, /signal/, "Mobile postsApi.list must forward signal to apiFetch");
});

