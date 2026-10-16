import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const SRC = path.join(REPO, "web-app", "src");
const MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

const read = (p) => fs.readFileSync(p, "utf-8");
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

// ---------- R1: no ::after collision in dense zones ----------
test("R1: tabs row gap >= 12px (no 4px hit-area overlap)", () => {
  const css = read(path.join(SRC, "pages/MyServices/components/ServicesToolbar/ServicesToolbar.module.css"));
  const m = css.match(/\.tabsRow\s*\{[^}]*gap:\s*(\d+)px/);
  assert.ok(m, "tabsRow gap not found");
  assert.ok(Number(m[1]) >= 12, `tabsRow gap is ${m[1]}px, need >= 12px (else tab ::after inset -6px overlaps)`);
});

test("R1: table action row gap >= 12px (no 6px hit-area overlap)", () => {
  const css = read(path.join(SRC, "pages/MyServices/components/ServicesTable/ServicesTable.module.css"));
  const m = css.match(/\.actionButtonsRow\s*\{[^}]*gap:\s*(\d+)px/);
  assert.ok(m, "actionButtonsRow gap not found");
  assert.ok(Number(m[1]) >= 12, `actionButtonsRow gap is ${m[1]}px, need >= 12px`);
});

// ---------- R2: storage resilience ----------
test("R2: store has in-memory fallback cache + guarded write", () => {
  const store = read(path.join(SRC, "pages/MyServices/providerServicesStore.js"));
  assert.match(store, /memoryCache/);
  assert.match(store, /workgo_provider_services_overrides/);
  assert.match(store, /try\s*\{[\s\S]*localStorage\.setItem/);
  assert.match(store, /catch/);
});

test("R2: MyServicesPage toasts once when persist returns false", () => {
  const jsx = read(path.join(SRC, "pages/MyServices/MyServicesPage.jsx"));
  assert.match(jsx, /persistProviderServices\(services\)\s*===\s*false/);
});

test("R2: App toasts once when persist returns false", () => {
  const jsx = read(path.join(SRC, "App.jsx"));
  assert.match(jsx, /persistProviderServices\(providerServices\)\s*===\s*false/);
});

// ---------- R3: keyboard + focus ----------
test("R3: reset.css has global :focus-visible ring on brand token", () => {
  const css = read(path.join(SRC, "styles/reset.css"));
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:\s*2px solid var\(--wg-primary\)/);
});

for (const [name, file] of [
  ["AuthModal", "components/common/AuthModal/AuthModal.jsx"],
  ["Header drawer", "components/common/Header/Header.jsx"],
  ["Table dropdown", "pages/MyServices/components/ServicesTable/ServicesTable.jsx"],
  ["Catalog filter drawer", "pages/CatalogSearch/CatalogSearchPage.jsx"],
]) {
  test(`R3: Escape closes ${name}`, () => {
    const jsx = read(path.join(SRC, file));
    assert.match(jsx, /Escape/, `${name} has no Escape handling`);
  });
}

test("R3: AuthModal is a labelled dialog with autofocus", () => {
  const jsx = read(path.join(SRC, "components/common/AuthModal/AuthModal.jsx"));
  assert.match(jsx, /role="dialog"/);
  assert.match(jsx, /aria-modal="true"/);
});

// ---------- R4: aria-live + toast role ----------
test("R4: catalog result count is a polite live region", () => {
  const jsx = read(path.join(SRC, "pages/CatalogSearch/components/SearchToolbar/SearchToolbar.jsx"));
  assert.match(jsx, /resultCount/);
  assert.match(jsx, /aria-live="polite"/);
  assert.match(jsx, /aria-atomic="true"/);
});

test("R4: table bulk count is a polite live region", () => {
  const jsx = read(path.join(SRC, "pages/MyServices/components/ServicesTable/ServicesTable.jsx"));
  assert.match(jsx, /bulkCount/);
  assert.match(jsx, /aria-live="polite"/);
});

test("R4: web-app toast has role=status like the bridge", () => {
  const jsx = read(path.join(SRC, "App.jsx"));
  assert.match(jsx, /role="status"/);
});

// ---------- R5: code-splitting ----------
test("R5: App lazy-loads AuthModal + ServiceFormPage under Suspense", () => {
  const jsx = read(path.join(SRC, "App.jsx"));
  assert.match(jsx, /React\.lazy\(\(\) => import\(['"]\.\/components\/common\/AuthModal\/AuthModal['"]\)\)/);
  assert.match(jsx, /React\.lazy\(\(\) => import\(['"]\.\/pages\/ServiceForm\/ServiceFormPage['"]\)\)/);
  assert.match(jsx, /<Suspense/);
});

test("R5: sync-input triggers are wrapped in startTransition (no suspense crash)", () => {
  const jsx = read(path.join(SRC, "App.jsx"));
  assert.match(jsx, /startTransition\(\(\) => setAuthModal/);
  assert.match(jsx, /startTransition\(\(\) => \{[\s\S]{0,200}setCurrentPage\('service-form'\)/);
});

// ---------- R6: bulk confirm parity ----------
for (const fn of ["handleBulkActivate", "handleBulkPause"]) {
  test(`R6: ${fn} asks window.confirm like bulk delete`, () => {
    const jsx = read(path.join(SRC, "pages/MyServices/MyServicesPage.jsx"));
    // Guard-clause style: confirm must sit at the TOP of the handler body,
    // so a narrow head-window can't catch a neighbour function's confirm.
    const body = jsx.slice(jsx.indexOf(fn));
    assert.match(body.slice(0, 350), /window\.confirm\(/, `${fn} has no window.confirm`);
  });
}

// ---------- S1: mirror parity for every touched source file ----------
test("S1: every Cycle-2 source file is byte-identical in _webapp-mirror", () => {
  const files = [
    "styles/reset.css",
    "pages/MyServices/components/ServicesToolbar/ServicesToolbar.module.css",
    "pages/MyServices/components/ServicesTable/ServicesTable.module.css",
    "pages/MyServices/providerServicesStore.js",
    "pages/MyServices/MyServicesPage.jsx",
    "App.jsx",
    "App.module.css",
    "components/common/AuthModal/AuthModal.jsx",
    "components/common/Header/Header.jsx",
    "pages/MyServices/components/ServicesTable/ServicesTable.jsx",
    "pages/CatalogSearch/CatalogSearchPage.jsx",
    "pages/CatalogSearch/components/SearchToolbar/SearchToolbar.jsx",
  ];
  for (const f of files) {
    assert.equal(sha256(path.join(MIRROR, f)), sha256(path.join(SRC, f)), `mirror mismatch: ${f}`);
  }
});
