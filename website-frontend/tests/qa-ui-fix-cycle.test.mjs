import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../");
const SRC = path.join(REPO, "web-app", "src");
const MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");
const WEBSITE = path.join(REPO, "website-frontend");
const read = (p) => fs.readFileSync(p, "utf-8");
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const shellCss = () => read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.module.css"));
const shellTsx = () => read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));

// UI fix cycle (2026-10-17) static guards for B1..B5:
// B1 TrungSubNav fixed under Header; B2 trung-pages full width (no 650px shrink);
// B3 mobile hero submit button height; B4 header band 1100-1440 no overflow;
// B5 offline banner top-stack contract.

function blockOf(css, selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}");
  const m = css.match(re);
  assert.ok(m, `missing rule block: ${selector}`);
  return m[1];
}

// ---------- UF-01: shell top-stack contract ----------
test("UF-01: shell top-stack contract + pageScope/offsetScope/appRootNoHeader", () => {
  const css = shellCss();

  const scope = blockOf(css, ".webapp-scope");
  assert.match(scope, /--base-header-height:\s*76px/);
  assert.match(scope, /--subnav-height:\s*61px/);
  assert.match(scope, /--offline-h:\s*0px/);
  assert.match(scope, /--top-stack:\s*calc\(/);

  const pageScope = blockOf(css, ".pageScope");
  assert.match(pageScope, /--header-height:\s*var\(--top-stack\)/);
  assert.match(pageScope, /flex:\s*1/);
  assert.match(pageScope, /min-width:\s*0/);

  const offsetScope = blockOf(css, ".offsetScope");
  assert.match(offsetScope, /padding-top:\s*var\(--header-height\)/);

  const noHeader = blockOf(css, ".appRootNoHeader");
  assert.match(noHeader, /--base-header-height:\s*0px/);
  assert.ok(
    css.indexOf(".appRootNoHeader") > css.indexOf(".webapp-scope"),
    ".appRootNoHeader must be declared after .webapp-scope (same specificity — later wins)"
  );
});

// ---------- UF-02: isolation regressions ----------
test("UF-02: appRoot/main isolation kept, no bare main selector in shell css", () => {
  const css = shellCss();

  const appRoot = blockOf(css, ".appRoot");
  assert.match(appRoot, /isolation:\s*isolate/);
  assert.match(appRoot, /overflow-x:\s*clip/);

  const main = blockOf(css, ".main");
  assert.match(main, /min-width:\s*0/);
  assert.match(main, /overflow-x:\s*clip/);

  assert.ok(!/(^|\})\s*main\s*\{/.test(css), "shell css must not contain a bare main selector");
});

// ---------- UF-03: shell tsx wrappers + banner publish ----------
test("UF-03: shell tsx has pageScope/offsetScope(>=15)/appRootNoHeader + offline-h RO, keeps toast contract", () => {
  const tsx = shellTsx();
  assert.match(tsx, /styles\.pageScope/);
  assert.ok(
    (tsx.match(/styles\.offsetScope/g) || []).length >= 15,
    "at least 15 offsetScope wrappers (detail/my-services/service-form + 15 trung-pages)"
  );
  assert.match(tsx, /styles\.appRootNoHeader/);
  assert.match(tsx, /offlineBannerRef/);
  assert.match(tsx, /ResizeObserver/);
  assert.match(tsx, /--offline-h/);
  assert.match(tsx, /slice\(-2\)/);
  assert.match(tsx, /3500/);
  assert.match(tsx, /dismissToast/);
  assert.match(tsx, /role="status"/);
  assert.match(tsx, /data-offline-banner/);
});

// ---------- UF-04: SubNav fixed bar, one scroll container ----------
test("UF-04: TrungSubNav bar fixed under header with hidden scrollbar container", () => {
  const css = read(path.join(WEBSITE, "src/components/trung-pages/_ui/TrungSubNav.module.css"));

  const bar = blockOf(css, ".bar");
  assert.match(bar, /position:\s*fixed/);
  assert.match(
    bar,
    /top:\s*calc\(var\(--offline-h,\s*0px\)\s*\+\s*var\(--base-header-height,\s*76px\)\)/
  );
  assert.match(bar, /height:\s*var\(--subnav-height,\s*61px\)/);
  assert.match(bar, /z-index:\s*990/);
  assert.ok(!/overflow-x:\s*auto/.test(bar), ".bar must not be a horizontal scroll container");

  const inner = blockOf(css, ".inner");
  assert.match(inner, /scrollbar-width:\s*none/);
  assert.match(css, /\.inner::-webkit-scrollbar\s*\{[^}]*display:\s*none/);
});

// ---------- UF-05: Header source guard ----------
test("UF-05: Header source (offline top, container cap, nowrap, no focus-expand, 1100/1280, band)", () => {
  const css = read(path.join(SRC, "components/common/Header/Header.module.css"));

  assert.match(css, /top:\s*var\(--offline-h,\s*0px\)/);

  const headerContainer = blockOf(css, ".header .headerContainer");
  assert.match(headerContainer, /max-width:\s*var\(--container-max,\s*1320px\)/);

  assert.ok(
    [...css.matchAll(/\.navLink\s*\{([^}]*)\}/g)].some((m) => /white-space:\s*nowrap/.test(m[1])),
    ".navLink must be white-space: nowrap"
  );

  assert.match(blockOf(css, ".navSearch"), /min-width:\s*0/);
  assert.ok(!/width:\s*320px/.test(css), "navSearch focus-expand width:320px must be gone");
  assert.match(blockOf(css, ".navSearchInput"), /min-width:\s*0/);

  const bandIdx = css.indexOf("@media (min-width: 1100px) and (max-width: 1440px)");
  assert.ok(bandIdx >= 0, "1100-1440px band must exist");
  const band = css.slice(bandIdx);
  assert.match(band, /\.desktopNav\s*\{[^}]*gap:\s*16px/);
  assert.match(band, /\.navLink\s*\{[^}]*font-size:\s*0\.9rem/);
  assert.match(band, /\.navSearch\s*\{[^}]*width:\s*240px/);

  assert.match(css, /@media\s*\(min-width:\s*1280px\)\s*\{\s*\.navSearch\s*\{\s*display:\s*flex/);
  assert.match(css, /@media\s*\(min-width:\s*1100px\)\s*\{\s*\.desktopNav\s*\{\s*display:\s*flex/);
  assert.match(css, /@media\s*\(min-width:\s*1100px\)\s*\{\s*\.menuToggle\s*\{\s*display:\s*none/);
});

// ---------- UF-06: mobile SearchBar button ----------
test("UF-06: mobile SearchBar submitBtn height:auto, base min-height stays 44px", () => {
  const css = read(path.join(SRC, "components/common/SearchBar/SearchBar.module.css"));

  assert.match(css, /\.submitBtn\s*\{[^}]*min-height:\s*44px/);

  const idx = css.indexOf("@media (max-width: 768px)");
  assert.ok(idx >= 0, "mobile media query must exist");
  const mobile = css.slice(idx);
  assert.match(mobile, /\.submitBtn\s*\{[^}]*height:\s*auto/);
});

// ---------- UF-07: mirror byte-identity ----------
test("UF-07: Header + SearchBar mirror files are byte-identical to web-app source", () => {
  for (const f of [
    "components/common/Header/Header.module.css",
    "components/common/SearchBar/SearchBar.module.css",
  ]) {
    assert.equal(sha256(path.join(MIRROR, f)), sha256(path.join(SRC, f)), `mirror hash mismatch: ${f}`);
  }
});

// ---------- UF-08: shell tsx invariants ----------
test("UF-08: shell tsx keeps route comment, TrungSubNav render, Footer guard", () => {
  const tsx = shellTsx();
  assert.match(tsx, /15 trung-pages/);
  assert.match(tsx, /TrungSubNav/);
  assert.match(tsx, /\{currentPage\s*!==\s*"service-form"\s*&&\s*<Footer\b[^>]*\/>\}/);
});
