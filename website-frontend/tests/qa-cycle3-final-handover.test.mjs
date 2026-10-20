import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf-8");
const exists = (rel) => fs.existsSync(path.join(REPO, rel));

test("QA-C3-HO-02: eslint isolation intact on website; android mirrors un-ignored (deleted)", () => {
  const web = read("website-frontend/eslint.config.mjs");
  assert.match(web, /src\/_webapp-mirror/, "website must ignore mirror");
  assert.match(web, /_webapp-reference/, "website must ignore reference");
  const and = read("android-frontend/eslint.config.js");
  assert.doesNotMatch(and, /_webapp-mirror/, "android must not ignore the deleted mirror");
  assert.doesNotMatch(and, /_webapp-reference/, "android must not ignore the deleted reference");
});

test("QA-C3-HO-04: default locale route renders bridge shell as homepage (promoted from /webapp)", () => {
  const src = read("website-frontend/src/app/[locale]/page.tsx");
  assert.match(src, /WebAppShell/, "default route must render WebAppShell");
  assert.match(src, /webapp-shell/, "must import the bridge shell module");
  assert.doesNotMatch(src, /AscendLandingView/, "old landing must be gone");
  assert.doesNotMatch(src, /Về trang chủ/, "back-bar is meaningless once promoted to default");
  assert.doesNotMatch(src, /_webapp-mirror\/App["']/, "must NOT import App.jsx");
  assert.doesNotMatch(
    src,
    /from\s+["'][^"']*App\.module\.css["']/,
    "must NOT import App.module.css"
  );
  assert.ok(
    !exists("website-frontend/src/app/[locale]/webapp"),
    "old /webapp route dir must be gone (promoted)"
  );
  assert.ok(
    !exists("website-frontend/src/app/[locale]/(app)"),
    "old (app) route group must be gone"
  );
  const root = read("website-frontend/src/app/page.tsx");
  assert.match(root, /redirect\(\s*["']\/vi["']\s*\)/, "root must redirect to /vi");
});

test("QA-C3-HO-05: bridge shell C2 ports App.jsx state machine without the poison chain", () => {
  const src = read("website-frontend/src/components/webapp-bridge/webapp-shell.tsx");
  for (const token of [
    "currentPage",
    "handleNavigate",
    "handleHeroSearch",
    "handleSelectCategory",
    "handleSelectService",
    "handleServiceFormSuccess",
  ]) {
    assert.match(src, new RegExp(token), `shell must port ${token}`);
  }
  assert.match(src, /role="status"/, "toast must expose role=status");
  assert.match(src, /webapp-shell\.module\.css/, "shell must use its own module css");
  assert.doesNotMatch(src, /_webapp-mirror\/App["']/, "shell must NOT import App.jsx");
  assert.doesNotMatch(
    src,
    /from\s+["'][^"']*App\.module\.css["']/,
    "shell must NOT import App.module.css"
  );
});

test("QA-C3-HO-06: shell css C3 is pure classes with scoped tokens and reduced-motion guard", () => {
  const src = read("website-frontend/src/components/webapp-bridge/webapp-shell.module.css");
  for (const token of ["\\.appRoot", "\\.toastNotification", "\\.webapp-scope", "--wg-primary"]) {
    assert.match(src, new RegExp(token), `css must contain ${token}`);
  }
  assert.match(src, /prefers-reduced-motion/, "must guard motion");
  assert.doesNotMatch(src, /(^|\n)\s*main\s*\{/, "must NOT contain bare main selector");
});

test("QA-C3-HO-10: android home is a WebView shell over the website", () => {
  const home = read("android-frontend/src/app/index.tsx");
  assert.match(home, /from\s+["']react-native-webview["']/, "home must render react-native-webview");
  assert.match(home, /resolveWebAppUrl/, "home must resolve the WebView URL");
  assert.match(home, /EXPO_PUBLIC_WEBAPP_URL/, "URL must be overridable via env");
  assert.match(home, /10\.0\.2\.2:3000\/vi/, "default must target the emulator loopback in dev");
  assert.match(home, /Thử lại/, "error state must offer a retry action");
  assert.ok(
    exists("android-frontend/src/app/webapp-preview.tsx"),
    "fallback preview screen must exist (no dev-build toolchain)"
  );
});

// Task-2 fallback lock (E2): turbopack.resolveAlias proved runtime-ineffective
// in two key forms (absolute paths, then `*/data/*` patterns) — the page kept
// rendering mirror mocks in production smoke. M1 + C4–C8 were reverted; the
// bridge stays on the mirror's own web-app mocks (fully interactive static
// shell). If a future cycle re-lands engine wiring through another mechanism,
// update this test alongside it.
test("QA-C3-HO-11: Task-2 fallback locked — static bridge, no dead alias", () => {
  const cfg = read("website-frontend/next.config.ts");
  assert.doesNotMatch(cfg, /resolveAlias/, "next.config must not carry the ineffective alias");
  assert.match(cfg, /withNextIntl/, "must preserve withNextIntl");
  assert.match(cfg, /reactStrictMode/, "must preserve existing keys");
  const shell = read("website-frontend/src/components/webapp-bridge/webapp-shell.tsx");
  assert.doesNotMatch(shell, /mockProviderServices/, "shell no longer bundles provider mocks");
  assert.ok(
    !exists("website-frontend/src/components/webapp-bridge/service-adapters.ts"),
    "engine adapters must be absent in fallback state"
  );
  assert.ok(
    !exists("website-frontend/src/components/webapp-bridge/shims/mockServices.js"),
    "shims must be absent in fallback state"
  );
});
