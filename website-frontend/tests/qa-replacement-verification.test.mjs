import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");
const androidRoot = path.resolve(repoRoot, "android-frontend");

test("C4-QA-HP-01: Default locale route renders WebAppShell as the promoted homepage", () => {
  const pagePath = path.join(webRoot, "src", "app", "[locale]", "page.tsx");
  assert.ok(fs.existsSync(pagePath), "src/app/[locale]/page.tsx must exist");
  const content = fs.readFileSync(pagePath, "utf8");
  assert.match(content, /WebAppShell/, "Must render WebAppShell");
  assert.match(content, /from\s+["']@\/components\/webapp-bridge\/webapp-shell["']/, "Must import WebAppShell from webapp-bridge");
  assert.doesNotMatch(content, /AscendLandingView/, "Must not contain legacy AscendLandingView");
  assert.doesNotMatch(content, /Về trang chủ/, "Must not contain webapp back-link header");
});

test("C4-QA-HP-02: Root page redirects cleanly to /vi with zero dead branches", () => {
  const rootPagePath = path.join(webRoot, "src", "app", "page.tsx");
  assert.ok(fs.existsSync(rootPagePath), "src/app/page.tsx must exist");
  const content = fs.readFileSync(rootPagePath, "utf8");
  assert.match(content, /redirect\(["']\/vi["']\)/, "Must redirect to /vi");
  assert.doesNotMatch(content, /AscendLandingView/, "Must not import or render AscendLandingView");
  assert.doesNotMatch(content, /if\s*\(\s*false\s*\)/, "Must not contain dead if(false) blocks");
});

test("C4-QA-HP-03: Providers component is streamlined to NextIntl-only with preserved props contract", () => {
  const providersPath = path.join(webRoot, "src", "components", "providers.tsx");
  assert.ok(fs.existsSync(providersPath), "src/components/providers.tsx must exist");
  const content = fs.readFileSync(providersPath, "utf8");
  assert.match(content, /NextIntlClientProvider/, "Must use NextIntlClientProvider");
  assert.match(content, /children/, "Must accept children");
  assert.match(content, /locale/, "Must accept locale");
  assert.match(content, /messages/, "Must accept messages");
  assert.doesNotMatch(content, /QueryClientProvider/, "Must not include QueryClientProvider");
  assert.doesNotMatch(content, /ToastProvider/, "Must not include ToastProvider");
});

test("C4-QA-HP-04: Proxy is trimmed to locale-only routing with zero legacy auth/session branches", () => {
  const proxyPath = path.join(webRoot, "src", "proxy.ts");
  assert.ok(fs.existsSync(proxyPath), "src/proxy.ts must exist");
  const content = fs.readFileSync(proxyPath, "utf8");
  assert.match(content, /handleI18nRouting/, "Must execute handleI18nRouting");
  assert.doesNotMatch(content, /getSession/, "Must not import or use getSession");
  assert.doesNotMatch(content, /isGuestOnlyPath/, "Must not check isGuestOnlyPath");
  assert.doesNotMatch(content, /isAuthRequiredPath/, "Must not check isAuthRequiredPath");
});

test("C4-QA-HP-05: Android Home Screen is a WebView shell with error/retry handling", () => {
  const indexPath = path.join(androidRoot, "src", "app", "index.tsx");
  assert.ok(fs.existsSync(indexPath), "android src/app/index.tsx must exist");
  const content = fs.readFileSync(indexPath, "utf8");
  assert.match(content, /react-native-webview/, "Must import react-native-webview");
  assert.match(content, /resolveWebAppUrl/, "Must declare resolveWebAppUrl");
  assert.match(content, /10\.0\.2\.2:3000\/vi/, "Must default to 10.0.2.2 for Android emulator");
  assert.match(content, /Thử lại/, "Must provide retry button upon load error");
  assert.match(content, /accessibilityLabel/, "Must specify accessibility labels");
});

test("C4-QA-HP-06: Android Layout is a minimal Stack with index and fallback preview", () => {
  const layoutPath = path.join(androidRoot, "src", "app", "_layout.tsx");
  assert.ok(fs.existsSync(layoutPath), "android src/app/_layout.tsx must exist");
  const content = fs.readFileSync(layoutPath, "utf8");
  assert.match(content, /name="index"/, "Must register index screen");
  assert.match(content, /name="webapp-preview"/, "Must register webapp-preview screen fallback");
  assert.doesNotMatch(content, /Tabs/, "Must not contain tabs layout");
});

test("C4-QA-EC-01: Legacy route trees are completely absent", () => {
  const appLocaleDir = path.join(webRoot, "src", "app", "[locale]");
  assert.ok(!fs.existsSync(path.join(appLocaleDir, "(app)")), "(app) route group must be deleted");
  assert.ok(!fs.existsSync(path.join(appLocaleDir, "(auth)")), "(auth) route group must be deleted");
  assert.ok(!fs.existsSync(path.join(appLocaleDir, "(public)")), "(public) route group must be deleted");
  assert.ok(!fs.existsSync(path.join(appLocaleDir, "webapp")), "Old /webapp route directory must be deleted");
  assert.ok(!fs.existsSync(path.join(webRoot, "src", "app", "api")), "BFF /api directory must be deleted");
});

test("C4-QA-EC-02: Legacy component trees are completely absent", () => {
  const compDir = path.join(webRoot, "src", "components");
  assert.ok(!fs.existsSync(path.join(compDir, "landing")), "components/landing must be deleted");
  assert.ok(!fs.existsSync(path.join(compDir, "composed")), "components/composed must be deleted");
  assert.ok(!fs.existsSync(path.join(compDir, "domain")), "components/domain must be deleted");
  assert.ok(!fs.existsSync(path.join(compDir, "shell")), "components/shell must be deleted");
  assert.ok(!fs.existsSync(path.join(compDir, "ui")), "components/ui must be deleted");
  assert.ok(!fs.existsSync(path.join(compDir, "effects")), "components/effects must be deleted");
});

test("C4-QA-EC-03: Legacy lib directory is completely absent in website-frontend", () => {
  const libDir = path.join(webRoot, "src", "lib");
  assert.ok(!fs.existsSync(libDir), "src/lib must be deleted");
});

test("C4-QA-EC-04: Zero Poison Chain - Surviving website code does not import deleted modules", () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "_webapp-mirror" || ent.name === "_webapp-reference" || ent.name === "node_modules" || ent.name === ".next") {
          continue;
        }
        scanDir(fullPath);
      } else if (ent.isFile() && (ent.name.endsWith(".ts") || ent.name.endsWith(".tsx"))) {
        const text = fs.readFileSync(fullPath, "utf8");
        assert.doesNotMatch(text, /from\s+["']@\/lib\//, `File ${fullPath} must not import from @/lib`);
        assert.doesNotMatch(text, /from\s+["']@\/components\/(landing|composed|domain|shell|ui|effects)/, `File ${fullPath} must not import from deleted components`);
      }
    }
  }
  scanDir(path.join(webRoot, "src"));
});

test("C4-QA-EC-05: Android mirrors are completely purged", () => {
  assert.ok(!fs.existsSync(path.join(androidRoot, "src", "_webapp-mirror")), "android src/_webapp-mirror must be purged");
  assert.ok(!fs.existsSync(path.join(androidRoot, "_webapp-reference")), "android _webapp-reference must be purged");
});

test("C4-QA-EC-06: Website mirror is 100% intact", () => {
  const mirrorDir = path.join(webRoot, "src", "_webapp-mirror");
  const refDir = path.join(webRoot, "_webapp-reference");
  assert.ok(fs.existsSync(mirrorDir), "website src/_webapp-mirror must exist");
  assert.ok(fs.existsSync(refDir), "website _webapp-reference must exist");
  
  function countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        count += countFiles(path.join(dir, ent.name));
      } else if (ent.isFile()) {
        count++;
      }
    }
    return count;
  }
  // 85 source mirror files + MANIFEST.json + README.mirror.md = 87 files total
  assert.equal(countFiles(mirrorDir), 87, "website mirror must have exactly 87 files (85 source + 2 metadata)");
  assert.ok(countFiles(refDir) >= 13, "website reference must have at least 13 files");
});

test("C4-QA-EC-07: Android webapp-preview fallback is self-contained", () => {
  const previewPath = path.join(androidRoot, "src", "app", "webapp-preview.tsx");
  assert.ok(fs.existsSync(previewPath), "webapp-preview.tsx must exist as fallback");
  const content = fs.readFileSync(previewPath, "utf8");
  assert.doesNotMatch(content, /ThemedText/, "Must not import deleted ThemedText");
  assert.doesNotMatch(content, /ThemedView/, "Must not import deleted ThemedView");
  assert.doesNotMatch(content, /Spacing/, "Must not import deleted Spacing");
});
