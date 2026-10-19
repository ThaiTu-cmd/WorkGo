import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const WEB_ESLINT = path.join(REPO, "website-frontend", "eslint.config.mjs");
const AND_ESLINT = path.join(REPO, "android-frontend", "eslint.config.js");

test("LINT-ISO-01: website eslint ignores mirror + reference dirs", () => {
  assert.ok(fs.existsSync(WEB_ESLINT), "website eslint.config.mjs must exist");
  const cfg = fs.readFileSync(WEB_ESLINT, "utf-8");
  assert.match(cfg, /src\/_webapp-mirror/, "website eslint must ignore src/_webapp-mirror");
  assert.match(cfg, /_webapp-reference/, "website eslint must ignore _webapp-reference");
});

test("LINT-ISO-02: android eslint drops deleted-mirror ignores without over-ignoring", () => {
  assert.ok(fs.existsSync(AND_ESLINT), "android eslint.config.js must exist");
  const cfg = fs.readFileSync(AND_ESLINT, "utf-8");
  assert.doesNotMatch(cfg, /_webapp-mirror/, "android must not ignore the deleted mirror");
  assert.doesNotMatch(cfg, /_webapp-reference/, "android must not ignore the deleted reference");
  assert.ok(!cfg.includes('"src/**"'), "android must not ignore general src/**");
});

