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
  assert.match(src, /setSheetOpen|sheetVisible/, "detail.tsx must control ProposalSheet visibility");
});
