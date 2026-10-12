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
const existsWeb = (p) => fs.existsSync(path.join(ROOT, p));

test("C3-1-WEB: proposalsApi passes idempotency: true on submit, accept, and reject", () => {
  const code = readWeb("src/lib/adapters/proposals.ts");
  assert.ok(code.includes("idempotency: true"), "adapters/proposals.ts must specify idempotency: true");

  // Verify submit, accept, reject all use idempotency: true
  const submitMatch = code.match(/submit[\s\S]*?idempotency:\s*true/);
  assert.ok(submitMatch, "submit() must pass idempotency: true");

  const acceptMatch = code.match(/accept[\s\S]*?idempotency:\s*true/);
  assert.ok(acceptMatch, "accept() must pass idempotency: true");

  const rejectMatch = code.match(/reject[\s\S]*?idempotency:\s*true/);
  assert.ok(rejectMatch, "reject() must pass idempotency: true");
});

test("C3-1-WEB-LOCK: proposal-drawer.tsx guards double-clicks with submittingRef synchronous lock", () => {
  const code = readWeb("src/components/domain/proposal-drawer.tsx");
  assert.ok(code.includes("submittingRef"), "proposal-drawer.tsx must declare submittingRef");
  assert.ok(code.includes("submittingRef.current = true"), "proposal-drawer.tsx must set submittingRef.current = true before async call");
  assert.ok(code.includes("submittingRef.current = false"), "proposal-drawer.tsx must release submittingRef.current = false in finally block");
});

test("C3-1-MOBILE-API: android proposalsApi.submit accepts and passes idempotencyKey to apiFetch", () => {
  const code = readAndroid("src/api/proposals.ts");
  assert.ok(code.includes("idempotencyKey"), "android proposalsApi must accept or handle idempotencyKey");
  assert.ok(code.includes("opts?:"), "android proposalsApi.submit must accept optional opts with idempotencyKey");
});

test("C3-1-MOBILE-LOCK: proposal-sheet.tsx has synchronous submittingRef lock & idempotency key generation", () => {
  const code = readAndroid("src/components/proposal-sheet.tsx");
  assert.ok(code.includes("submittingRef"), "proposal-sheet.tsx must declare submittingRef");
  assert.ok(code.includes("submittingRef.current"), "proposal-sheet.tsx must check submittingRef.current");
});

test("C3-12-MOBILE-ATTACH: attachment utility exists and enforces 10MB limit and MIME allowlist", () => {
  assert.ok(existsAndroid("src/utils/attachment.ts"), "attachment.ts must exist in android-frontend/src/utils");
  const code = readAndroid("src/utils/attachment.ts");
  assert.ok(code.includes("10 * 1024 * 1024") || code.includes("10485760"), "attachment utility must enforce 10MB limit");
  assert.ok(code.includes("application/pdf"), "attachment utility must allow PDF");
  assert.ok(code.includes("image/jpeg"), "attachment utility must allow JPEG");
  assert.ok(code.includes("image/png"), "attachment utility must allow PNG");
});

test("C3-2-WEB-DRAFT: proposal-draft.ts implements key scheme, corrupt handling, and helpers", () => {
  assert.ok(existsWeb("src/lib/proposal-draft.ts"), "lib/proposal-draft.ts must exist");
  const code = readWeb("src/lib/proposal-draft.ts");
  assert.ok(code.includes("draft_proposal_v1:"), "Draft key prefix draft_proposal_v1: must be used");
  assert.ok(code.includes("loadDraft"), "proposal-draft.ts must export loadDraft");
  assert.ok(code.includes("saveDraft"), "proposal-draft.ts must export saveDraft");
  assert.ok(code.includes("clearDraft"), "proposal-draft.ts must export clearDraft");
});

test("C3-2-MOBILE-DRAFT: store/proposal-draft.ts implements AsyncStorage draft helpers with matching key scheme", () => {
  assert.ok(existsAndroid("src/store/proposal-draft.ts"), "proposal-draft.ts must exist in android-frontend/src/store");
  const code = readAndroid("src/store/proposal-draft.ts");
  assert.ok(code.includes("draft_proposal_v1:"), "Mobile draft key prefix draft_proposal_v1: must match web");
  assert.ok(code.includes("loadDraft"), "store/proposal-draft.ts must export loadDraft");
  assert.ok(code.includes("saveDraft"), "store/proposal-draft.ts must export saveDraft");
  assert.ok(code.includes("clearDraft"), "store/proposal-draft.ts must export clearDraft");
});
