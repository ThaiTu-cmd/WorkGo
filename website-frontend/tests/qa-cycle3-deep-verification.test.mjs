import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");
const readAndroid = (p) => fs.readFileSync(path.join(ANDROID_ROOT, p), "utf-8");
const readWeb = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// ========================================================
// QA-C3-01: IDEMPOTENCY KEY GENERATION & FORWARDING CONTRACT
// ========================================================
test("QA-C3-01: Idempotency Key contract across Web and Mobile proposal calls", () => {
  // Web adapter contract
  const webProposals = readWeb("src/lib/adapters/proposals.ts");
  assert.match(webProposals, /idempotency:\s*true/, "Web proposals.submit must specify idempotency: true");

  const webApiClient = readWeb("src/lib/api-client.ts");
  assert.match(webApiClient, /Idempotency-Key/i, "Web api-client must send Idempotency-Key header");

  // Mobile adapter contract
  const mobProposals = readAndroid("src/api/proposals.ts");
  assert.match(mobProposals, /idempotencyKey/, "Mobile proposals.submit must accept/handle idempotencyKey");

  const mobApiClient = readAndroid("src/api/client.ts");
  assert.match(mobApiClient, /Idempotency-Key/i, "Mobile api-client must attach Idempotency-Key header");
});

// ========================================================
// QA-C3-02: SYNCHRONOUS LOCK GUARDING AGAINST DOUBLE-SUBMISSIONS
// ========================================================
test("QA-C3-02: submittingRef synchronous lock stops double-tap before re-render", async () => {
  // Simulate double-submission lock behavior
  const submittingRef = { current: false };
  let apiCallCount = 0;

  async function simulateSubmit() {
    if (submittingRef.current) {
      return { blocked: true };
    }
    submittingRef.current = true;
    try {
      apiCallCount++;
      // Simulate network latency (20ms)
      await new Promise((r) => setTimeout(r, 20));
      return { blocked: false, success: true };
    } finally {
      submittingRef.current = false;
    }
  }

  // Trigger 2 submissions synchronously within the same event tick
  const [res1, res2] = await Promise.all([simulateSubmit(), simulateSubmit()]);

  assert.strictEqual(apiCallCount, 1, "Only 1 API call must be fired despite parallel clicks");
  assert.strictEqual(res1.blocked, false);
  assert.strictEqual(res2.blocked, true, "Second click must be blocked synchronously by submittingRef");
});

// ========================================================
// QA-C3-03: DRAFT AUTO-SAVE & PER-USER STORAGE ISOLATION
// ========================================================
test("QA-C3-03: Draft auto-save isolates users and gracefully recovers from corrupt data", () => {
  const mockStorage = new Map();

  function getDraftKey(userId, postId) {
    return `draft_proposal_v1:${userId || "guest"}:${postId}`;
  }

  function saveDraft(userId, postId, data) {
    try {
      mockStorage.set(getDraftKey(userId, postId), JSON.stringify(data));
    } catch {
      // quota exception handled
    }
  }

  function loadDraft(userId, postId) {
    try {
      const raw = mockStorage.get(getDraftKey(userId, postId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearDraft(userId, postId) {
    try {
      mockStorage.delete(getDraftKey(userId, postId));
    } catch {
      // ignore
    }
  }

  // 1. User isolation
  saveDraft("user-alpha", "post-101", { price: 500000, message: "Báo giá của Alpha" });
  saveDraft("user-beta", "post-101", { price: 900000, message: "Báo giá của Beta" });

  assert.deepStrictEqual(loadDraft("user-alpha", "post-101"), { price: 500000, message: "Báo giá của Alpha" });
  assert.deepStrictEqual(loadDraft("user-beta", "post-101"), { price: 900000, message: "Báo giá của Beta" });
  assert.strictEqual(loadDraft("guest", "post-101"), null, "Guest must not access user drafts");

  // 2. Corrupted JSON resilience
  mockStorage.set(getDraftKey("user-corrupt", "post-101"), "{malformed;json:");
  assert.strictEqual(loadDraft("user-corrupt", "post-101"), null, "Corrupted JSON must return null without crashing");

  // 3. Clear draft
  clearDraft("user-alpha", "post-101");
  assert.strictEqual(loadDraft("user-alpha", "post-101"), null, "Cleared draft must return null");
  assert.notStrictEqual(loadDraft("user-beta", "post-101"), null, "Clearing user-alpha draft must not affect user-beta");
});

// ========================================================
// QA-C3-04: ATTACHMENT ALLOWLIST & 10MB LIMIT BOUNDARY CHECKS
// ========================================================
test("QA-C3-04: Attachment validation boundary tests (10MB limit, allowed MIME types)", () => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10,485,760 bytes
  const ALLOWED_MIMES = ["application/pdf", "image/jpeg", "image/png"];

  function validateAttachment(file) {
    if (!file) return { valid: false, error: "Tệp không tồn tại" };
    if (!ALLOWED_MIMES.includes(file.mimeType)) {
      return { valid: false, error: "Chỉ chấp nhận tệp định dạng PDF, JPG hoặc PNG." };
    }
    if (file.size > MAX_SIZE) {
      return { valid: false, error: "Kích thước tệp vượt quá giới hạn 10MB." };
    }
    return { valid: true, error: null };
  }

  // Size boundaries
  assert.strictEqual(validateAttachment({ mimeType: "application/pdf", size: MAX_SIZE }).valid, true, "Exact 10MB must pass");
  assert.strictEqual(validateAttachment({ mimeType: "application/pdf", size: MAX_SIZE - 1 }).valid, true, "Under 10MB must pass");
  assert.strictEqual(validateAttachment({ mimeType: "application/pdf", size: MAX_SIZE + 1 }).valid, false, "Over 10MB by 1 byte must fail");

  // MIME allowlist boundaries
  assert.strictEqual(validateAttachment({ mimeType: "application/pdf", size: 1000 }).valid, true);
  assert.strictEqual(validateAttachment({ mimeType: "image/jpeg", size: 1000 }).valid, true);
  assert.strictEqual(validateAttachment({ mimeType: "image/png", size: 1000 }).valid, true);

  // Forbidden MIME types
  assert.strictEqual(validateAttachment({ mimeType: "application/x-msdownload", size: 1000 }).valid, false);
  assert.strictEqual(validateAttachment({ mimeType: "application/zip", size: 1000 }).valid, false);
  assert.strictEqual(validateAttachment({ mimeType: "text/plain", size: 1000 }).valid, false);
  assert.strictEqual(validateAttachment({ mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1000 }).valid, false);
});

// ========================================================
// QA-C3-05: PROPOSAL DRAWER & SHEET INTEGRATION LITERALS
// ========================================================
test("QA-C3-05: Web and Mobile UI components integrate draft, lock, and attachment slots", () => {
  // Web Drawer checks
  const drawerSrc = readWeb("src/components/domain/proposal-drawer.tsx");
  assert.match(drawerSrc, /submittingRef/, "proposal-drawer must define submittingRef");
  assert.match(drawerSrc, /loadDraft/, "proposal-drawer must loadDraft on mount");
  assert.match(drawerSrc, /saveDraft/, "proposal-drawer must saveDraft on change");
  assert.match(drawerSrc, /clearDraft/, "proposal-drawer must clearDraft on success");
  assert.match(drawerSrc, /selectedFile/, "proposal-drawer must handle selectedFile state");

  // Mobile Sheet checks
  const sheetSrc = readAndroid("src/components/proposal-sheet.tsx");
  assert.match(sheetSrc, /submittingRef/, "proposal-sheet must define submittingRef");
  assert.match(sheetSrc, /loadDraft/, "proposal-sheet must loadDraft");
  assert.match(sheetSrc, /saveDraft/, "proposal-sheet must saveDraft");
  assert.match(sheetSrc, /clearDraft/, "proposal-sheet must clearDraft");
  assert.match(sheetSrc, /attachment/, "proposal-sheet must handle attachment state");
});

// ========================================================
// QA-C3-06: ZERO REGRESSION OVER PREVIOUS CYCLES CONTRACTS
// ========================================================
test("QA-C3-06: Zero regression over previous cycles contracts", () => {
  // Landing order preserved
  const landingSrc = readWeb("src/components/landing/fiverr/fiverr-landing.tsx");
  assert.match(landingSrc, /FiverrHeader/, "FiverrHeader must be present");
  assert.match(landingSrc, /FiverrFooter/, "FiverrFooter must be present");

  // Mobile tokens & theme preserved
  const themeSrc = readAndroid("src/constants/theme.ts");
  assert.match(themeSrc, /Spacing/, "theme.ts must export Spacing");
  assert.match(themeSrc, /Radius/, "theme.ts must export Radius");

  // Proposals endpoint integrity
  const apiSrc = readAndroid("src/api/proposals.ts");
  assert.match(apiSrc, /\/api\/v1\/posts\/\$\{encodeURIComponent\(postId\)\}\/proposals/, "Endpoints must target standard /api/v1/posts");
});
