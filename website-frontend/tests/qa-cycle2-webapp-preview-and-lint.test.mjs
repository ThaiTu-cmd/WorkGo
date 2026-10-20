import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const WEB_ESLINT = path.join(REPO, "website-frontend", "eslint.config.mjs");
const AND_ESLINT = path.join(REPO, "android-frontend", "eslint.config.js");

test("C2-EC-01: ESLint isolation is surgical and does not over-ignore production codebase", () => {
  const webEslint = fs.readFileSync(WEB_ESLINT, "utf-8");
  assert.match(webEslint, /src\/_webapp-mirror\/\*\*/, "Must ignore src/_webapp-mirror/**");
  assert.match(webEslint, /_webapp-reference\/\*\*/, "Must ignore _webapp-reference/**");
  assert.ok(!webEslint.includes('"src/**"'), "Must NOT ignore general src/**");
  assert.ok(!webEslint.includes('"src/app/**"'), "Must NOT ignore src/app/**");

  // Replacement cycle: android mirrors are deleted, so the android config
  // must NOT carry mirror ignores anymore — while still not over-ignoring.
  const andEslint = fs.readFileSync(AND_ESLINT, "utf-8");
  assert.ok(!andEslint.includes("_webapp-mirror"), "Must NOT ignore deleted android mirror");
  assert.ok(!andEslint.includes("_webapp-reference"), "Must NOT ignore deleted android reference");
  assert.ok(!andEslint.includes('"src/**"'), "Must NOT ignore general src/**");
});

test("C2-EC-02: Baseline configuration files remain strictly untouched (Zero Overwrite)", () => {
  // NOTE: android-frontend/package.json intentionally dropped from this map:
  // replacement Task 3 A-M3 adds react-native-webview there (planned).
  const baselineHashes = {
    "android-frontend/app.json": "8b7403694394c72df0db96fa88286c011a4576a6a86e24fc162a76ec46efda19",
    "website-frontend/next.config.ts": "1904a25947364f20fb3c427ead9589a7c0321db11d1362abfb605a544d5765a3",
    "website-frontend/package.json": "f40a8ae22159103ecee400f62ba6a9ccf77bb23a7e7eeda5e22720c15dcb9b61",
  };

  for (const [relPath, expectedHash] of Object.entries(baselineHashes)) {
    const abs = path.join(REPO, relPath);
    assert.ok(fs.existsSync(abs), `File must exist: ${relPath}`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
    assert.equal(hash, expectedHash, `Configuration file ${relPath} has been modified!`);
  }
});

test("C2-EC-04: default locale route renders bridge shell (promoted from /webapp)", () => {
  // Replacement cycle (CODE_CHANGES §24): the bridge shell moved from
  // /[locale]/webapp to the default /[locale] page. This test locks the
  // promoted state and keeps the anti-poison teeth of the original lock.
  const pagePath = path.join(REPO, "website-frontend", "src", "app", "[locale]", "page.tsx");
  assert.ok(fs.existsSync(pagePath), "default route page must exist");
  const src = fs.readFileSync(pagePath, "utf-8");
  assert.ok(src.includes("WebAppShell"), "default route must render WebAppShell");
  assert.ok(
    !src.includes("_webapp-mirror/App\"") && !src.includes("_webapp-mirror/App'"),
    "route must not import App.jsx (the cycle-2 poison chain)"
  );
  assert.ok(!src.includes("App.module.css"), "route must not import App.module.css");
  assert.ok(
    !fs.existsSync(path.join(REPO, "website-frontend", "src", "app", "[locale]", "webapp")),
    "old /webapp route dir must be gone (promoted)"
  );
});
