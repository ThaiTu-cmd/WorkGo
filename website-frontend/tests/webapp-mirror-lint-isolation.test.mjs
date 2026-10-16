import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const WEB_ESLINT = path.join(REPO, "website-frontend", "eslint.config.mjs");
const AND_ESLINT = path.join(REPO, "android-frontend", "eslint.config.js");
const INTEGRITY_SUITE = path.join(REPO, "website-frontend", "tests", "qa-webapp-mirror-verification.test.mjs");
const COPY_SCRIPT = path.join(REPO, "scripts", "copy-webapp-mirror.mjs");
const WEBSITE_MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

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

test("LINT-ISO-03: integrity suite qa-webapp-mirror-verification still wired", () => {
  assert.ok(fs.existsSync(INTEGRITY_SUITE), "qa-webapp-mirror-verification.test.mjs must exist");
  const src = fs.readFileSync(INTEGRITY_SUITE, "utf-8");
  assert.match(src, /_webapp-mirror/, "integrity suite must still assert _webapp-mirror paths");
  assert.match(src, /ANDROID_MIRROR|WEBSITE_MIRROR/, "integrity suite must still wire both mirror constants");
});

test("LINT-ISO-04: verifyMirrors reports ok with 0 mismatches (website-only)", async () => {
  assert.ok(fs.existsSync(COPY_SCRIPT), "scripts/copy-webapp-mirror.mjs must exist");
  const mod = await import(pathToFileURL(COPY_SCRIPT).href);
  const result = mod.verifyMirrors(
    path.join(REPO, "web-app", "src"),
    [WEBSITE_MIRROR]
  );
  assert.equal(result.ok, true, "verifyMirrors must return ok: true");
  assert.equal(result.mismatches.length, 0, "verifyMirrors must report 0 mismatches");
});
