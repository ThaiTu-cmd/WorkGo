import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viPath = path.resolve(__dirname, "../src/dictionaries/vi.json");
const enPath = path.resolve(__dirname, "../src/dictionaries/en.json");

function flattenKeys(obj, prefix = "") {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

test("i18n Dictionaries - Files exist and are valid JSON", () => {
  assert.ok(fs.existsSync(viPath), "vi.json must exist");
  assert.ok(fs.existsSync(enPath), "en.json must exist");

  const viContent = JSON.parse(fs.readFileSync(viPath, "utf-8"));
  const enContent = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  assert.equal(typeof viContent, "object", "vi.json must parse into an object");
  assert.equal(typeof enContent, "object", "en.json must parse into an object");
});

test("i18n Dictionaries - 100% Key Parity between Vietnamese and English", () => {
  const vi = JSON.parse(fs.readFileSync(viPath, "utf-8"));
  const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  const viKeys = new Set(flattenKeys(vi));
  const enKeys = new Set(flattenKeys(en));

  const missingInEn = [...viKeys].filter((k) => !enKeys.has(k));
  const missingInVi = [...enKeys].filter((k) => !viKeys.has(k));

  assert.deepEqual(
    missingInEn,
    [],
    `Keys present in vi.json but missing in en.json: ${missingInEn.join(", ")}`
  );
  assert.deepEqual(
    missingInVi,
    [],
    `Keys present in en.json but missing in vi.json: ${missingInVi.join(", ")}`
  );
});

test("i18n Dictionaries - Essential keys for all 15 tasks exist in dictionary", () => {
  const vi = JSON.parse(fs.readFileSync(viPath, "utf-8"));
  const viKeys = new Set(flattenKeys(vi));

  const expectedCoreKeys = [
    // 1.0 & 2.0 Auth
    "login.title",
    "login.submit",
    "login.invalidCredentials",
    "register.title",
    "register.submit",
    "validation.passwordMin",
    "validation.passwordMatch",

    // 3.0 Profile
    "settings.tabProfile",
    "settings.profileSaved",

    // 4.0 Provider Onboarding
    "settings.tabProvider",
    "providerOnboarding.title",

    // 5.0 Addresses
    "settings.tabAddresses",
    "addresses.addAddress",

    // 6.0 Provider Profile Public
    "providerProfile.notFound",

    // 46.0 Jobs List
    "posts.marketplaceTitle",
    "posts.empty",
    "common.clearFilters",

    // 47.0 Job Post
    "jobForm.createTitle",
    "jobForm.publish",

    // 48.0 Submit Proposal
    "proposal.submit",
    "proposal.price",

    // 49.0 Proposal Review
    "applications.title",
    "applications.accept",
    "applications.reject",

    // 80.0 & 81.0 Wallet & Payment
    "wallet.title",
    "wallet.deposit",
    "payment.payNow",

    // 82.0 Payout
    "settings.tabPayout",
    "payout.title",

    // 115.0 Review
    "review.modalTitle",
    "review.submit",

    // 116.0 Dispute & Report
    "dispute.title",
    "report.modalTitle",
    "report.submit",
  ];

  for (const key of expectedCoreKeys) {
    assert.ok(viKeys.has(key), `Missing required dictionary key: ${key}`);
  }
});
