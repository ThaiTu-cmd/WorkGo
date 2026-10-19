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

function extractBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  assert.ok(match, `CSS selector '${selector}' was not found in stylesheet`);
  return match[1];
}

// ---------------------------------------------------------------------------
// QA-UI-FIX-01: Top-stack CSS variable contract in .webapp-scope
// ---------------------------------------------------------------------------
test("QA-UI-FIX-01: Top-stack CSS contract defines exact tokens and fallback stack formula", () => {
  const css = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.module.css"));
  const scope = extractBlock(css, ".webapp-scope");

  assert.match(scope, /--base-header-height:\s*76px;/);
  assert.match(scope, /--subnav-height:\s*61px;/);
  assert.match(scope, /--offline-h:\s*0px;/);
  assert.match(
    scope,
    /--top-stack:\s*calc\(\s*var\(--offline-h\)\s*\+\s*var\(--base-header-height\)\s*\+\s*var\(--subnav-height\)\s*\);/
  );
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-02: .pageScope flex column layout and --header-height rebinding
// ---------------------------------------------------------------------------
test("QA-UI-FIX-02: .pageScope re-points --header-height to --top-stack and prevents 650px shrink-wrap", () => {
  const css = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.module.css"));
  const pageScope = extractBlock(css, ".pageScope");

  assert.match(pageScope, /flex:\s*1;/);
  assert.match(pageScope, /min-width:\s*0;/);
  assert.match(pageScope, /display:\s*flex;/);
  assert.match(pageScope, /flex-direction:\s*column;/);
  assert.match(pageScope, /--header-height:\s*var\(--top-stack\);/);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-03: .offsetScope provides top padding for non-offsetting pages
// ---------------------------------------------------------------------------
test("QA-UI-FIX-03: .offsetScope enforces padding-top equal to --header-height", () => {
  const css = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.module.css"));
  const offsetScope = extractBlock(css, ".offsetScope");

  assert.match(offsetScope, /padding-top:\s*var\(--header-height\);/);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-04: .appRootNoHeader specificity and override
// ---------------------------------------------------------------------------
test("QA-UI-FIX-04: .appRootNoHeader resets --base-header-height to 0px and appears after .webapp-scope", () => {
  const css = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.module.css"));
  const noHeader = extractBlock(css, ".appRootNoHeader");

  assert.match(noHeader, /--base-header-height:\s*0px;/);

  const scopeIdx = css.indexOf(".webapp-scope");
  const noHeaderIdx = css.indexOf(".appRootNoHeader");
  assert.ok(
    noHeaderIdx > scopeIdx,
    "For equal specificity (0,1,0), .appRootNoHeader must appear after .webapp-scope to win cascade"
  );
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-05: TrungSubNav positioning, z-index and single scroll container
// ---------------------------------------------------------------------------
test("QA-UI-FIX-05: TrungSubNav bar is fixed below header with z-index 990 and hidden scrollbars", () => {
  const css = read(path.join(WEBSITE, "src/components/trung-pages/_ui/TrungSubNav.module.css"));
  const bar = extractBlock(css, ".bar");
  const inner = extractBlock(css, ".inner");

  assert.match(bar, /position:\s*fixed;/);
  assert.match(
    bar,
    /top:\s*calc\(var\(--offline-h,\s*0px\)\s*\+\s*var\(--base-header-height,\s*76px\)\);/
  );
  assert.match(bar, /height:\s*var\(--subnav-height,\s*61px\);/);
  assert.match(bar, /z-index:\s*990;/);
  assert.match(bar, /overflow:\s*hidden;/);

  assert.match(inner, /max-width:\s*1320px;/);
  assert.match(inner, /overflow-x:\s*auto;/);
  assert.match(inner, /overflow-y:\s*hidden;/);
  assert.match(inner, /scrollbar-width:\s*none;/);
  assert.match(inner, /-ms-overflow-style:\s*none;/);
  assert.match(css, /\.inner::-webkit-scrollbar\s*\{[^}]*display:\s*none;/);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-06: Header responsive constraints and no focus-expand
// ---------------------------------------------------------------------------
test("QA-UI-FIX-06: Header capped to 1320px, navLink nowrap, and navSearch focus-expand removed", () => {
  const css = read(path.join(SRC, "components/common/Header/Header.module.css"));

  assert.match(css, /\.header\s*\{[^}]*top:\s*var\(--offline-h,\s*0px\);/);

  const container = extractBlock(css, ".header .headerContainer");
  assert.match(container, /max-width:\s*var\(--container-max,\s*1320px\);/);
  assert.match(container, /width:\s*100%;/);

  const navLinks = [...css.matchAll(/\.navLink\s*\{([^}]*)\}/g)];
  assert.ok(
    navLinks.some((m) => /white-space:\s*nowrap;/.test(m[1])),
    "navLink must have white-space: nowrap to avoid 2-line label wrapping"
  );

  assert.match(extractBlock(css, ".navSearch"), /min-width:\s*0;/);
  assert.match(extractBlock(css, ".navSearchInput"), /min-width:\s*0;/);
  assert.ok(!/width:\s*320px/.test(css), "focus-within expansion to 320px must be completely removed");
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-07: Header breakpoints at 1100px and 1280px + band 1100-1440px
// ---------------------------------------------------------------------------
test("QA-UI-FIX-07: Header uses 1100px desktop breakpoint, 1280px search breakpoint, and 1100-1440 compression", () => {
  const css = read(path.join(SRC, "components/common/Header/Header.module.css"));

  assert.match(
    css,
    /@media\s*\(min-width:\s*1100px\)\s*\{\s*\.desktopNav\s*\{\s*display:\s*flex;/
  );
  assert.match(
    css,
    /@media\s*\(min-width:\s*1100px\)\s*\{\s*\.menuToggle\s*\{\s*display:\s*none;/
  );
  assert.match(
    css,
    /@media\s*\(min-width:\s*1280px\)\s*\{\s*\.navSearch\s*\{\s*display:\s*flex;/
  );
  assert.match(
    css,
    /@media\s*\(min-width:\s*1280px\)\s*\{\s*\.actionButtons\s*\{\s*flex-shrink:\s*0;/
  );

  const bandIdx = css.indexOf("@media (min-width: 1100px) and (max-width: 1440px)");
  assert.ok(bandIdx >= 0, "Band 1100-1440px media query must be present");
  const band = css.slice(bandIdx);
  assert.match(band, /\.desktopNav\s*\{[^}]*gap:\s*16px;/);
  assert.match(band, /\.navLink\s*\{[^}]*font-size:\s*0\.9rem;/);
  assert.match(band, /\.navSearch\s*\{[^}]*width:\s*240px;/);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-08: SearchBar mobile button height: auto fix
// ---------------------------------------------------------------------------
test("QA-UI-FIX-08: SearchBar mobile submitBtn has height: auto and preserves 44px min-height", () => {
  const css = read(path.join(SRC, "components/common/SearchBar/SearchBar.module.css"));

  const baseBtn = extractBlock(css, ".submitBtn");
  assert.match(baseBtn, /min-height:\s*44px;/);

  const mobileQueryIdx = css.indexOf("@media (max-width: 768px)");
  assert.ok(mobileQueryIdx >= 0, "max-width: 768px query must exist");
  const mobileSlice = css.slice(mobileQueryIdx);
  assert.match(mobileSlice, /\.submitBtn\s*\{[^}]*height:\s*auto;/);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-09: Offline banner ResizeObserver inline style publisher
// ---------------------------------------------------------------------------
test("QA-UI-FIX-09: WebAppShell manages --offline-h dynamically with ResizeObserver and inline style", () => {
  const tsx = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));

  assert.match(tsx, /const\s+appRootRef\s*=\s*useRef<HTMLDivElement>\(null\);/);
  assert.match(tsx, /const\s+offlineBannerRef\s*=\s*useRef<HTMLDivElement>\(null\);/);
  assert.match(tsx, /const\s+observer\s*=\s*new\s+ResizeObserver\(sync\);/);
  assert.match(tsx, /root\.style\.setProperty\("--offline-h",\s*`\$\{banner\.offsetHeight\}px`\);/);
  assert.match(tsx, /root\.style\.removeProperty\("--offline-h"\);/);
  assert.match(tsx, /data-offline-banner/);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-10: Exact 18 offsetScope wrappers in webapp-shell.tsx
// ---------------------------------------------------------------------------
test("QA-UI-FIX-10: Exactly 18 routes are wrapped in styles.offsetScope while home and catalog remain untouched", () => {
  const tsx = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));

  const requiredRoutes = [
    "detail",
    "my-services",
    "service-form",
    "register",
    "login",
    "profile-settings",
    "address-book",
    "provider-onboarding",
    "provider-profile",
    "job-list",
    "job-post",
    "submit-proposal",
    "proposal-review",
    "payment-gateway",
    "wallet",
    "payout-settings",
    "review-form",
    "dispute-center",
  ];

  for (const route of requiredRoutes) {
    const routeRegex = new RegExp(
      `currentPage\\s*===\\s*"${route}"[\\s\\S]*?styles\\.offsetScope`
    );
    assert.ok(routeRegex.test(tsx), `Route '${route}' must be wrapped in styles.offsetScope`);
  }

  // Home must NOT have offsetScope (uses main)
  const homeBlock = tsx.match(/currentPage\s*===\s*"home"[\s\S]*?<\/main>/);
  assert.ok(homeBlock, "home block exists");
  assert.ok(!homeBlock[0].includes("offsetScope"), "home block must not contain offsetScope");

  // Catalog must NOT have offsetScope (has built-in top padding)
  const catalogBlock = tsx.match(/currentPage\s*===\s*"catalog"[\s\S]*?<CatalogSearchPage/);
  assert.ok(catalogBlock, "catalog block exists");
  assert.ok(!catalogBlock[0].includes("offsetScope"), "catalog block must not contain offsetScope");
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-11: Mirror SHA-256 equivalence and MANIFEST parity
// ---------------------------------------------------------------------------
test("QA-UI-FIX-11: Mirror files are byte-identical to source and MANIFEST totalBytes is 380949", () => {
  const headerSrc = path.join(SRC, "components/common/Header/Header.module.css");
  const headerMirror = path.join(MIRROR, "components/common/Header/Header.module.css");
  assert.equal(sha256(headerSrc), sha256(headerMirror), "Header.module.css hash mismatch between src and mirror");

  const searchSrc = path.join(SRC, "components/common/SearchBar/SearchBar.module.css");
  const searchMirror = path.join(MIRROR, "components/common/SearchBar/SearchBar.module.css");
  assert.equal(sha256(searchSrc), sha256(searchMirror), "SearchBar.module.css hash mismatch between src and mirror");

  const manifest = JSON.parse(read(path.join(MIRROR, "MANIFEST.json")));
  assert.equal(manifest.totalFiles, 85, "Mirror totalFiles must be 85");
  assert.equal(manifest.totalBytes, 380949, "Mirror totalBytes must be 380949");

  const teamManifest = JSON.parse(read(path.join(REPO, ".team/WEBAPP_MIRROR_MANIFEST.json")));
  assert.equal(teamManifest.website.totalBytes, 380949, "Team mirror manifest totalBytes must match 380949");
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-12: Zero bare main selector in webapp-shell.module.css
// ---------------------------------------------------------------------------
test("QA-UI-FIX-12: webapp-shell.module.css does not contain any bare main selector", () => {
  const css = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.module.css"));
  assert.ok(
    !/(^|\})\s*main\s*\{/.test(css),
    "Bare 'main {' selector found in webapp-shell.module.css, which causes global style pollution"
  );
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-13: Toast notification contract preservation
// ---------------------------------------------------------------------------
test("QA-UI-FIX-13: Toast contract invariants remain intact in webapp-shell.tsx", () => {
  const tsx = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));

  assert.match(tsx, /\.slice\(-2\)/, "Toast queue max length must be 2");
  assert.match(tsx, /3500/, "Toast auto-dismiss timeout must be 3500ms");
  assert.match(tsx, /dismissToast/, "dismissToast handler must exist");
  assert.match(tsx, /role="status"/, "Toast must have role='status' for a11y");
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-14: Zero console.* calls in webapp-shell and trung-pages
// ---------------------------------------------------------------------------
test("QA-UI-FIX-14: Zero console.* calls exist in webapp-shell.tsx and trung-pages", () => {
  const shellTsx = read(path.join(WEBSITE, "src/components/webapp-bridge/webapp-shell.tsx"));
  assert.ok(!/console\.(log|warn|error|info|debug)\(/.test(shellTsx), "console.* statement in webapp-shell.tsx");

  const trungPagesDir = path.join(WEBSITE, "src/components/trung-pages");
  const walk = (dir) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(f)) {
        const content = read(full);
        assert.ok(
          !/console\.(log|warn|error|info|debug)\(/.test(content),
          `console.* statement found in ${f}`
        );
      }
    }
  };
  walk(trungPagesDir);
});

// ---------------------------------------------------------------------------
// QA-UI-FIX-15: Sweep evidence results verification
// ---------------------------------------------------------------------------
test("QA-UI-FIX-15: Browser sweep results confirm 100% PASS on all 7 viewports with 0 console errors", () => {
  const sweepJsonPath = path.join(REPO, ".team/evidence/ui-fix/sweep-results.json");
  assert.ok(fs.existsSync(sweepJsonPath), "sweep-results.json must exist in .team/evidence/ui-fix/");

  const data = JSON.parse(read(sweepJsonPath));
  assert.equal(data.pass, true, "Overall sweep pass must be true");
  assert.equal(data.failCount, 0, "Sweep failCount must be 0");
  assert.deepEqual(data.consoleErrors, [], "Sweep consoleErrors array must be empty");

  const requiredViewports = ["320x568", "390x844", "768x1024", "1024x800", "1280x800", "1440x900", "1536x900"];
  for (const vp of requiredViewports) {
    assert.ok(data.viewports[vp], `Viewport ${vp} results must be present`);
    assert.equal(data.viewports[vp].S1?.pass, true, `Viewport ${vp} S1 must pass`);
    assert.equal(data.viewports[vp].S3?.pass, true, `Viewport ${vp} S3 must pass`);
  }
  assert.equal(data.viewports["390x844"].S5?.pass, true, "390x844 S5 must pass");
  assert.equal(data.viewports["390x844"].S6?.pass, true, "390x844 S6 must pass");
  assert.equal(data.viewports["1440x900"].S2?.pass, true, "1440x900 S2 must pass");
  assert.equal(data.viewports["1440x900"].S6?.pass, true, "1440x900 S6 must pass");
  assert.equal(data.viewports["1440x900"].S7?.pass, true, "1440x900 S7 must pass");
});
