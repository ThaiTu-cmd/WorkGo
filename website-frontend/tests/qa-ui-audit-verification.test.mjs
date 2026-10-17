import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const SRC_ROOT = path.join(REPO, "web-app", "src");
const WEBSITE_MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

function readFile(relPath, root = SRC_ROOT) {
  const full = path.join(root, relPath);
  assert.ok(fs.existsSync(full), `File must exist: ${relPath}`);
  return fs.readFileSync(full, "utf-8");
}

function hashFile(absPath) {
  const buf = fs.readFileSync(absPath);
  return {
    size: buf.length,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
  };
}

// =============================================================================
// HAPPY PATH: CSS Layout, Typography, Buttons, Controls, & Responsiveness
// =============================================================================

test("HP-UI-01: Header responsive rules guard 320px viewport & touch targets", () => {
  const css = readFile("components/common/Header/Header.module.css");

  // Mobile container guards (gutter-inset: 16px -> 24px, min-width:0 kept)
  assert.match(css, /\.headerContainer\s*\{[^}]*padding-left:\s*24px/);
  assert.match(css, /\.headerContainer\s*\{[^}]*min-width:\s*0/);

  // Left section & logo shrinkage
  assert.match(css, /\.leftSection\s*\{[^}]*gap:\s*12px/);
  assert.match(css, /\.leftSection\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.leftSection\s*\{[^}]*flex-shrink:\s*1/);
  assert.match(css, /\.logo\s*\{[^}]*flex-shrink:\s*0/);

  // Action buttons & buttons touch targets
  assert.match(css, /\.actionButtons\s*\{[^}]*gap:\s*10px/);
  assert.match(css, /\.actionButtons\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.actionButtons\s*\{[^}]*flex-shrink:\s*1/);

  assert.match(css, /\.signInBtn\s*\{[^}]*min-height:\s*44px/);
  assert.match(css, /\.signInBtn\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /\.joinBtn\s*\{[^}]*min-height:\s*44px/);
  assert.match(css, /\.joinBtn\s*\{[^}]*white-space:\s*nowrap/);

  // Hamburger menu toggle touch target
  assert.match(css, /\.menuToggle\s*\{[^}]*min-width:\s*44px/);
  assert.match(css, /\.menuToggle\s*\{[^}]*min-height:\s*44px/);
  assert.match(css, /\.menuToggle\s*\{[^}]*flex-shrink:\s*0/);

  // Search button touch target expansion via ::after
  assert.match(css, /\.navSearchBtn::after\s*\{[^}]*inset:\s*-8px/);

  // Mobile 400px hide signIn button to give room for hamburger
  assert.match(css, /@media\s*\(max-width:\s*400px\)\s*\{[\s\S]*?\.signInBtn\s*\{[\s\S]*?display:\s*none/);

  // Mobile drawer vertical scroll constraint
  assert.match(css, /\.mobileDrawer\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*var\(--header-height\)\)/);
  assert.match(css, /\.mobileDrawer\s*\{[^}]*overflow-y:\s*auto/);
});

test("HP-UI-02: ServicesToolbar maintains inner scroll & responsive search width", () => {
  const css = readFile("pages/MyServices/components/ServicesToolbar/ServicesToolbar.module.css");

  assert.match(css, /\.toolbarContainer\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.tabsRow\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.tabsRow\s*\{[^}]*-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /\.tabBtn\s*\{[^}]*flex-shrink:\s*0/);
  assert.match(css, /\.tabBtn\s*\{[^}]*min-width:\s*0/);

  // searchBox flexible shrinkage (replaces rigid min-width 260px)
  assert.match(css, /\.searchBox\s*\{[^}]*flex:\s*1\s+1\s+200px/);
  assert.match(css, /\.searchBox\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.filterBox\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.categorySelect\s*\{[^}]*max-width:\s*100%/);
});

test("HP-UI-03: AuthModal prevents overflow with max-height scroll and single column on mobile", () => {
  const css = readFile("components/common/AuthModal/AuthModal.module.css");

  assert.match(css, /\.modalBox\s*\{[^}]*max-height:\s*90vh/);
  assert.match(css, /\.modalBox\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(css, /\.inputField\s*\{[^}]*max-width:\s*100%/);
  assert.match(css, /\.inputField\s*\{[^}]*box-sizing:\s*border-box/);
  assert.match(css, /\.closeBtn\s*\{[^}]*min-width:\s*44px/);
  assert.match(css, /\.closeBtn\s*\{[^}]*min-height:\s*44px/);

  // 1-column layout for nameRow on mobile <= 480px
  assert.match(css, /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.nameRow\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
});

test("HP-UI-04: Toast notification is mobile-safe and handles long text", () => {
  const css = readFile("App.module.css");

  // F6 Cycle 3: positioning moved verbatim to .toastStack (same 16px/420px geometry).
  assert.match(css, /\.toastStack\s*\{[^}]*left:\s*16px/);
  assert.match(css, /\.toastStack\s*\{[^}]*right:\s*16px/);
  assert.match(css, /\.toastStack\s*\{[^}]*max-width:\s*420px/);
  assert.match(css, /\.toastNotification\s*\{[^}]*overflow-wrap:\s*break-word/);
  assert.match(css, /\.toastNotification\s*\{[^}]*word-break:\s*break-word/);
  assert.match(css, /@media\s*\(min-width:\s*640px\)\s*\{[\s\S]*?\.toastStack\s*\{[\s\S]*?left:\s*auto/);
});

test("HP-UI-05: ServiceCard text clipping and favorite button touch target", () => {
  const css = readFile("components/common/ServiceCard/ServiceCard.module.css");

  // Type badge ellipsis constraint
  assert.match(css, /\.typeBadge\s*\{[^}]*max-width:\s*60%/);
  assert.match(css, /\.typeBadge\s*\{[^}]*text-overflow:\s*ellipsis/);
  assert.match(css, /\.typeBadge\s*\{[^}]*white-space:\s*nowrap/);

  // Favorite button 44px effective touch target via ::after
  assert.match(css, /\.favoriteBtn::after\s*\{[^}]*inset:\s*-6px/);

  // Service title multi-line wrap and min-height auto
  assert.match(css, /\.serviceTitle\s*\{[^}]*min-height:\s*2\.8em/);
  assert.match(css, /\.serviceTitle\s*\{[^}]*height:\s*auto/);
  assert.match(css, /\.serviceTitle\s*\{[^}]*overflow-wrap:\s*break-word/);

  // Provider info and name truncation
  assert.match(css, /\.providerInfo\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.providerInfo\s*\{[^}]*flex:\s*1/);
  assert.match(css, /\.providerNameWrap\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.providerName\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.providerName\s*\{[^}]*text-overflow:\s*ellipsis/);
  assert.match(css, /\.providerName\s*\{[^}]*white-space:\s*nowrap/);
});

test("HP-UI-06: ServicesTable scroll containment, touch controls, and last-row dropdown", () => {
  const css = readFile("pages/MyServices/components/ServicesTable/ServicesTable.module.css");

  // Table wrapper maintains horizontal scroll while allowing dropdown overflow
  assert.match(css, /\.tableWrapper\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /\.tableWrapper\s*\{[^}]*overflow-y:\s*visible/);

  // Dropdown z-index and upward positioning on last row
  assert.match(css, /\.dropdownMenu\s*\{[^}]*z-index:\s*60/);
  assert.match(css, /\.row:last-child\s+\.dropdownMenu\s*\{[\s\S]*?bottom:\s*100%/);

  // Icon button touch target
  assert.match(css, /\.iconBtn::after\s*\{[^}]*inset:\s*-6px/);

  // Switch size 48x28
  assert.match(css, /\.switch\s*\{[^}]*width:\s*48px/);
  assert.match(css, /\.switch\s*\{[^}]*height:\s*28px/);

  // Checkbox size 20x20
  assert.match(css, /\.checkbox\s*\{[^}]*width:\s*20px/);
  assert.match(css, /\.checkbox\s*\{[^}]*height:\s*20px/);
});

test("HP-UI-07: HeroBanner text wrap and SearchBar input shrinkage", () => {
  const heroCss = readFile("components/home/HeroBanner/HeroBanner.module.css");
  assert.match(heroCss, /\.headline\s*\{[^}]*text-wrap:\s*balance/);
  assert.match(heroCss, /\.headline\s*\{[^}]*overflow-wrap:\s*break-word/);
  assert.match(heroCss, /\.searchWrapper\s*\{[^}]*min-width:\s*0/);

  const searchCss = readFile("components/common/SearchBar/SearchBar.module.css");
  assert.match(searchCss, /\.inputWrapper\s*\{[^}]*min-width:\s*0/);
  assert.match(searchCss, /\.searchInput\s*\{[^}]*min-width:\s*0/);
  assert.match(searchCss, /\.searchInput\s*\{[^}]*flex:\s*1/);
  assert.match(searchCss, /\.submitBtn\s*\{[^}]*min-height:\s*44px/);
});

test("HP-UI-08: FilterSidebar drawer behavior and header height token mobile adaptation", () => {
  const filterCss = readFile("pages/CatalogSearch/components/FilterSidebar/FilterSidebar.module.css");
  assert.match(filterCss, /\.priceInputsRow\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(filterCss, /\.priceInput\s*\{[^}]*min-width:\s*0/);
  assert.match(filterCss, /@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.sidebar\s*\{[\s\S]*?position:\s*static/);

  const varsCss = readFile("styles/variables.css");
  assert.match(varsCss, /@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?--header-height:\s*64px/);

  const resetCss = readFile("styles/reset.css");
  assert.match(resetCss, /\[id\]\s*\{[^}]*scroll-margin-top:\s*calc\(var\(--header-height\)\s*\+\s*16px\)/);
});

test("HP-UI-09: Next.js bridge webapp-shell isolates z-stacking and page overflow", () => {
  const shellCss = readFile(
    "src/components/webapp-bridge/webapp-shell.module.css",
    path.join(REPO, "website-frontend")
  );

  assert.match(shellCss, /\.appRoot\s*\{[^}]*isolation:\s*isolate/);
  assert.match(shellCss, /\.appRoot\s*\{[^}]*overflow-x:\s*clip/);
  assert.match(shellCss, /\.main\s*\{[^}]*min-width:\s*0/);
  assert.match(shellCss, /\.main\s*\{[^}]*overflow-x:\s*clip/);
  // F6 Cycle 3: positioning moved verbatim to .toastStack (same 16px/420px geometry).
  assert.match(shellCss, /\.toastStack\s*\{[^}]*left:\s*16px/);
  assert.match(shellCss, /\.toastStack\s*\{[^}]*max-width:\s*420px/);
});

test("HP-UI-10: Mirror integrity for all 10 modified CSS files", () => {
  const modifiedFiles = [
    "App.module.css",
    "components/common/AuthModal/AuthModal.module.css",
    "components/common/Header/Header.module.css",
    "components/common/SearchBar/SearchBar.module.css",
    "components/common/ServiceCard/ServiceCard.module.css",
    "components/home/HeroBanner/HeroBanner.module.css",
    "pages/CatalogSearch/components/FilterSidebar/FilterSidebar.module.css",
    "pages/MyServices/components/ServicesTable/ServicesTable.module.css",
    "pages/MyServices/components/ServicesToolbar/ServicesToolbar.module.css",
    "styles/variables.css",
    "styles/reset.css",
  ];

  for (const rel of modifiedFiles) {
    const srcPath = path.join(SRC_ROOT, rel);
    const mirrorPath = path.join(WEBSITE_MIRROR, rel);
    assert.ok(fs.existsSync(srcPath), `Source file must exist: ${rel}`);
    assert.ok(fs.existsSync(mirrorPath), `Mirror file must exist: ${rel}`);

    const srcHash = hashFile(srcPath);
    const mirrorHash = hashFile(mirrorPath);

    assert.equal(
      mirrorHash.sha256,
      srcHash.sha256,
      `Mirror SHA256 must match source for ${rel}`
    );
    assert.equal(
      mirrorHash.size,
      srcHash.size,
      `Mirror file size must match source for ${rel}`
    );
  }
});

// =============================================================================
// EDGE CASES & CORNER CASES
// =============================================================================

test("EC-UI-01: Boundary string length on ServiceTitle (150 chars without overflow or clip)", () => {
  const css = readFile("components/common/ServiceCard/ServiceCard.module.css");
  // Multi-line growth allowed, never bare fixed height
  assert.ok(!css.match(/(?<!min-)height:\s*2\.8em/), "Fixed height: 2.8em must be removed");
  assert.ok(css.includes("height: auto"), "Height must be auto");
  assert.ok(css.includes("min-height: 2.8em"), "Min-height 2.8em must be present");
  assert.ok(css.includes("overflow-wrap: break-word"), "Must break long words");
});

test("EC-UI-02: Boundary string length on Toast (120 chars without horizontal overflow)", () => {
  const css = readFile("App.module.css");
  assert.ok(css.includes("left: 16px"), "Must have left boundary guard on mobile");
  assert.ok(css.includes("right: 16px"), "Must have right boundary guard on mobile");
  assert.ok(css.includes("max-width: 420px"), "Must cap max-width on larger screens");
  assert.ok(css.includes("word-break: break-word"), "Must break long unbroken character sequences");
});

test("EC-UI-03: Provider name boundary truncation protects price display alignment", () => {
  const css = readFile("components/common/ServiceCard/ServiceCard.module.css");
  assert.match(css, /\.providerName\s*\{[^}]*text-overflow:\s*ellipsis/);
  assert.match(css, /\.providerName\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /\.providerName\s*\{[^}]*min-width:\s*0/);
});

test("EC-UI-04: Viewport 320x568 boundary - Modal NameRow collapses to 1-column", () => {
  const css = readFile("components/common/AuthModal/AuthModal.module.css");
  assert.match(
    css,
    /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.nameRow\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
    "nameRow must collapse to 1fr on viewports <= 480px"
  );
});

test("EC-UI-05: Touch target accessibility (WCAG 2.5.5 / 2.5.8) invariants", () => {
  // Check that all primary interactive buttons have effective dimension >= 44px
  const headerCss = readFile("components/common/Header/Header.module.css");
  assert.match(headerCss, /\.menuToggle\s*\{[^}]*min-width:\s*44px/);
  assert.match(headerCss, /\.menuToggle\s*\{[^}]*min-height:\s*44px/);
  assert.match(headerCss, /\.signInBtn\s*\{[^}]*min-height:\s*44px/);
  assert.match(headerCss, /\.joinBtn\s*\{[^}]*min-height:\s*44px/);
  assert.match(headerCss, /\.navSearchBtn::after\s*\{[^}]*inset:\s*-8px/);

  const cardCss = readFile("components/common/ServiceCard/ServiceCard.module.css");
  assert.match(cardCss, /\.favoriteBtn::after\s*\{[^}]*inset:\s*-6px/);

  const tableCss = readFile("pages/MyServices/components/ServicesTable/ServicesTable.module.css");
  assert.match(tableCss, /\.iconBtn::after\s*\{[^}]*inset:\s*-6px/);
  assert.match(tableCss, /\.switch\s*\{[^}]*width:\s*48px/);
  assert.match(tableCss, /\.switch\s*\{[^}]*height:\s*28px/);

  const modalCss = readFile("components/common/AuthModal/AuthModal.module.css");
  assert.match(modalCss, /\.closeBtn\s*\{[^}]*min-width:\s*44px/);
  assert.match(modalCss, /\.closeBtn\s*\{[^}]*min-height:\s*44px/);
});

test("EC-UI-06: Table horizontal scroll containment without page-level spill", () => {
  const tableCss = readFile("pages/MyServices/components/ServicesTable/ServicesTable.module.css");
  assert.match(tableCss, /\.tableWrapper\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(tableCss, /\.tableWrapper\s*\{[^}]*overflow-y:\s*visible/);
  assert.match(tableCss, /\.dataTable\s*\{[\s\S]*?min-width:\s*800px/);
});

test("EC-UI-07: Last table row upward dropdown popover avoids lower viewport boundary clipping", () => {
  const tableCss = readFile("pages/MyServices/components/ServicesTable/ServicesTable.module.css");
  assert.match(
    tableCss,
    /\.row:last-child\s+\.dropdownMenu\s*\{[\s\S]*?top:\s*auto;[\s\S]*?bottom:\s*100%/
  );
});

test("EC-UI-08: Zero backend leakage in web-app frontend code", () => {
  const axiosClient = readFile("api/axiosClient.js");
  assert.ok(!axiosClient.includes(":8888"), "Must not call :8888 directly");
  assert.ok(!axiosClient.includes(":8081"), "Must not call :8081 directly");
  assert.ok(!axiosClient.includes(":8082"), "Must not call :8082 directly");
});
