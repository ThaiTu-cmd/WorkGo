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
const TRUST = path.join(TRUNG, "trust");

const read = (p) => fs.readFileSync(p, "utf-8");

test("FE-08: mockDisputes.ts and mockReviews.ts are completely eliminated", () => {
  assert.ok(!fs.existsSync(path.join(TRUNG, "_mocks/mockDisputes.ts")), "mockDisputes.ts must not exist");
  assert.ok(!fs.existsSync(path.join(TRUNG, "_mocks/mockReviews.ts")), "mockReviews.ts must not exist");
});

test("FE-08: ReviewFormPage integrates order reviews 1-5 stars with trustApi", () => {
  const p = path.join(TRUST, "ReviewFormPage.tsx");
  assert.ok(fs.existsSync(p), "ReviewFormPage.tsx must exist");
  const code = read(p);

  assert.ok(code.includes("trustApi.submitReview"), "Must call trustApi.submitReview");
  assert.ok(code.includes("trustApi.getMyReviews"), "Must call trustApi.getMyReviews");
  assert.ok(code.includes("trustApi.getOrderReviewStatus"), "Must check getOrderReviewStatus");
  assert.ok(code.includes('role="radiogroup"'), "Must have accessible radiogroup for stars");
  assert.ok(code.includes("Đơn hàng này đã được đánh giá!"), "Must detect already reviewed orders");
  assert.ok(!code.includes("mockReviews"), "Must not reference mockReviews");
  assert.ok(!code.includes("_webapp-mirror"), "No direct _webapp-mirror imports");
  assert.ok(!/console\.(log|warn|error)\(/.test(code), "No console statements");
});

test("FE-08: DisputeCenterPage integrates dispute, report, timeline, and 3-way decision", () => {
  const p = path.join(TRUST, "DisputeCenterPage.tsx");
  assert.ok(fs.existsSync(p), "DisputeCenterPage.tsx must exist");
  const code = read(p);

  assert.ok(code.includes("trustApi.createDispute"), "Must call trustApi.createDispute");
  assert.ok(code.includes("trustApi.getMyDisputes"), "Must call trustApi.getMyDisputes");
  assert.ok(code.includes("trustApi.cancelDispute"), "Must call trustApi.cancelDispute");
  assert.ok(code.includes("trustApi.supplementEvidence"), "Must call trustApi.supplementEvidence");
  assert.ok(code.includes("compressImage"), "Must support compressImage for evidence upload");

  // 3-way admin decision: RELEASE / REFUND / SPLIT
  assert.ok(code.includes("RELEASE"), "Must display RELEASE decision");
  assert.ok(code.includes("REFUND"), "Must display REFUND decision");
  assert.ok(code.includes("SPLIT"), "Must display SPLIT decision");

  // Financial settlement status
  assert.ok(code.includes("FROZEN"), "Must display FROZEN escrow status");
  assert.ok(code.includes("SETTLED"), "Must display SETTLED financial status");
  assert.ok(code.includes("SPLIT_COMPLETED"), "Must display SPLIT_COMPLETED settlement status");

  // Reputation (0..100) & history ledger
  assert.ok(code.includes("reputationScore"), "Must track reputationScore");
  assert.ok(code.includes("reputationLedger"), "Must track reputationLedger");

  // Sanctions card & appeal form
  assert.ok(code.includes("sanctions"), "Must support sanctions list");
  assert.ok(code.includes("submitAppeal"), "Must support submitAppeal");

  assert.ok(!code.includes("mockDisputes"), "Must not reference mockDisputes");
  assert.ok(!code.includes("_webapp-mirror"), "No direct _webapp-mirror imports");
  assert.ok(!/console\.(log|warn|error)\(/.test(code), "No console statements");
});

test("FE-08: types.ts defines all trust contracts without any mock imports", () => {
  const p = path.join(TRUST, "types.ts");
  assert.ok(fs.existsSync(p), "types.ts must exist");
  const code = read(p);

  assert.ok(code.includes("DisputeKind"), "DisputeKind defined");
  assert.ok(code.includes("DisputeStatus"), "DisputeStatus defined");
  assert.ok(code.includes("DisputeDecisionType"), "DisputeDecisionType defined");
  assert.ok(code.includes("SettlementStatus"), "SettlementStatus defined");
  assert.ok(code.includes("ReputationLedgerEntry"), "ReputationLedgerEntry defined");
  assert.ok(code.includes("ProviderSanction"), "ProviderSanction defined");
  assert.ok(code.includes("SanctionAppeal"), "SanctionAppeal defined");
});
