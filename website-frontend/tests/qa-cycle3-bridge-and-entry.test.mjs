import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const DEFAULT_ROUTE = path.join(REPO, "website-frontend", "src", "app", "[locale]", "page.tsx");
const ROOT_ROUTE = path.join(REPO, "website-frontend", "src", "app", "page.tsx");
const WEB_SHELL = path.join(REPO, "website-frontend", "src", "components", "webapp-bridge", "webapp-shell.tsx");
const WEB_CSS = path.join(REPO, "website-frontend", "src", "components", "webapp-bridge", "webapp-shell.module.css");
const AND_HOME = path.join(REPO, "android-frontend", "src", "app", "index.tsx");
const AND_PREVIEW = path.join(REPO, "android-frontend", "src", "app", "webapp-preview.tsx");
const NEXT_CONFIG = path.join(REPO, "website-frontend", "next.config.ts");
const COPY_SCRIPT = path.join(REPO, "scripts", "copy-webapp-mirror.mjs");
const SRC_ROOT = path.join(REPO, "web-app", "src");
const WEBSITE_MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

test("C3-QA-HP-01: Default locale route renders bridge shell as the homepage", () => {
  assert.ok(fs.existsSync(DEFAULT_ROUTE), "default route page must exist");
  const code = fs.readFileSync(DEFAULT_ROUTE, "utf-8");
  assert.match(code, /WebAppShell/, "Default route must render WebAppShell");
  assert.doesNotMatch(code, /AscendLandingView/, "Old landing must be gone from default route");
  assert.doesNotMatch(code, /Về trang chủ/, "Back-bar is meaningless once promoted to default");
  assert.ok(
    !fs.existsSync(path.join(REPO, "website-frontend", "src", "app", "[locale]", "webapp")),
    "Old /webapp route dir must be gone (promoted to default)"
  );
  assert.ok(
    !fs.existsSync(path.join(REPO, "website-frontend", "src", "app", "[locale]", "(app)")),
    "Old (app) route group must be gone"
  );
  const root = fs.readFileSync(ROOT_ROUTE, "utf-8");
  assert.match(root, /redirect\(\s*["']\/vi["']\s*\)/, "Root must redirect to /vi");
});

test("C3-QA-HP-02: WebApp Bridge Shell implements 5 views, navigation handlers, and accessible toast", () => {
  assert.ok(fs.existsSync(WEB_SHELL), "webapp-shell.tsx must exist");
  const code = fs.readFileSync(WEB_SHELL, "utf-8");

  // Verify view states
  assert.match(code, /'home' \| 'catalog' \| 'detail' \| 'my-services' \| 'service-form'/, "Must support all 5 views");
  assert.match(code, /handleNavigate/, "Must handle page navigation");
  assert.match(code, /handleHeroSearch/, "Must handle hero search");
  assert.match(code, /handleSelectCategory/, "Must handle category selection");
  assert.match(code, /handleSelectService/, "Must handle service selection");
  assert.match(code, /handleServiceFormSuccess/, "Must handle form creation success");

  // Verify accessibility
  assert.match(code, /role="status"/, "Toast notification must declare role=status");
});

test("C3-QA-HP-03: WebApp Bridge Scoped Styles use pure classes and scoped tokens without bare element selectors", () => {
  assert.ok(fs.existsSync(WEB_CSS), "webapp-shell.module.css must exist");
  const css = fs.readFileSync(WEB_CSS, "utf-8");

  // Check pure classes
  assert.match(css, /\.appRoot/, "Must define .appRoot class");
  assert.match(css, /\.main/, "Must define .main class");
  assert.match(css, /\.toastNotification/, "Must define .toastNotification class");
  assert.match(css, /\.webapp-scope/, "Must define .webapp-scope token wrapper");

  // Ensure no bare main selector exists
  assert.doesNotMatch(css, /(^|\n)\s*main\s*\{/, "Must NOT have bare main element selector");

  // Check reduced-motion guard
  assert.match(css, /prefers-reduced-motion:\s*reduce/, "Must provide reduced-motion media query");
});

test("C3-QA-HP-04: Android Home Screen is a WebView shell over the website", () => {
  assert.ok(fs.existsSync(AND_HOME), "index.tsx must exist");
  const code = fs.readFileSync(AND_HOME, "utf-8");

  assert.match(code, /from\s+["']react-native-webview["']/, "Home must render react-native-webview");
  assert.match(code, /resolveWebAppUrl/, "Home must resolve the WebView URL");
  assert.match(code, /EXPO_PUBLIC_WEBAPP_URL/, "URL must be overridable via EXPO_PUBLIC_WEBAPP_URL");
  assert.match(code, /10\.0\.2\.2:3000\/vi/, "Default must target the emulator loopback in dev");
  assert.match(code, /Thử lại/, "Error state must offer a retry action");
  assert.match(code, /accessibilityLabel="Giao diện WebApp WorkGo"/, "WebView must be labelled");
});

test("C3-QA-HP-05: Android WebApp Preview Screen features guidance and prototype list", () => {
  assert.ok(fs.existsSync(AND_PREVIEW), "webapp-preview.tsx must exist");
  const code = fs.readFileSync(AND_PREVIEW, "utf-8");

  assert.match(code, /node scripts\/serve-mirrors\.mjs/, "Must mention serve-mirrors guidance");
  assert.match(code, /WEBAPP_PROTOTYPES/, "Must define WEBAPP_PROTOTYPES");
  assert.match(code, /resolveMirrorBase/, "Must define resolveMirrorBase");
  assert.match(code, /openPrototype/, "Must define openPrototype");
});

test("C3-QA-EC-01: Baseline configuration files remain strictly untouched (Zero Overwrite)", () => {
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
    assert.equal(hash, expectedHash, `Configuration file ${relPath} must not be modified`);
  }
});

test("C3-QA-EC-02: Next.js Configuration preserves Turbopack purity and existing plugins", () => {
  const cfg = fs.readFileSync(NEXT_CONFIG, "utf-8");
  assert.match(cfg, /withNextIntl/, "Must preserve withNextIntl plugin");
  assert.match(cfg, /reactStrictMode:\s*true/, "Must preserve reactStrictMode");
  assert.doesNotMatch(cfg, /resolveAlias/, "Ineffective resolveAlias must not be present");
});

test("C3-QA-EC-03: Zero Poison Chain - Neither Default Route nor Shell imports App.jsx or bare module CSS", () => {
  const route = fs.readFileSync(DEFAULT_ROUTE, "utf-8");
  const shell = fs.readFileSync(WEB_SHELL, "utf-8");

  assert.doesNotMatch(route, /_webapp-mirror\/App["']/, "Route must not import mirror App.jsx");
  assert.doesNotMatch(shell, /_webapp-mirror\/App["']/, "Shell must not import mirror App.jsx");
  assert.doesNotMatch(route, /from\s+["'][^"']*App\.module\.css["']/, "Route must not import App.module.css");
  assert.doesNotMatch(shell, /from\s+["'][^"']*App\.module\.css["']/, "Shell must not import App.module.css");
});

test("C3-QA-EC-04: Verification script confirms 0 mismatches for the website mirror", async () => {
  const mod = await import(pathToFileURL(COPY_SCRIPT).href);
  const result = mod.verifyMirrors(SRC_ROOT, [WEBSITE_MIRROR]);
  assert.equal(result.ok, true, "verifyMirrors must return ok: true");
  assert.equal(result.mismatches.length, 0, "There must be 0 mismatches between source and mirrors");
});
