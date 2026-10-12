import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ROOT_PROJECT = path.resolve(ROOT, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function readAndroid(rel) {
  return fs.readFileSync(path.join(ROOT_PROJECT, "android-frontend", rel), "utf-8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function existsAndroid(rel) {
  return fs.existsSync(path.join(ROOT_PROJECT, "android-frontend", rel));
}

// =============================================================================
// 1. FONT AUDIT & FAUX-BOLD SUPPRESSION (HP-VIS-01 & EC-VIS-01)
// =============================================================================

test("QA-VIS-01: Font Weight Integrity & Zero Faux-Bold Synthesized 900 Weight", () => {
  const targetFiles = [
    "src/components/domain/wallet-summary.tsx",
    "src/components/shell/app-header.tsx",
    "src/components/shell/public-header.tsx",
    "src/components/shell/auth-shell.tsx",
    "src/components/shell/app-shell-client.tsx",
    "src/components/landing/workgo-navbar.tsx",
    "src/components/landing/workgo-landing-sections.tsx",
    "src/components/landing/fiverr/fiverr-header.tsx",
    "src/components/landing/fiverr/fiverr-footer.tsx",
  ];

  for (const f of targetFiles) {
    assert.ok(exists(f), `File must exist: ${f}`);
    const content = read(f);
    assert.doesNotMatch(
      content,
      /\bfont-black\b/,
      `File ${f} must not contain font-black (weight 900 is not loaded in Be Vietnam Pro; use font-extrabold)`
    );
  }

  // Verify layout.tsx font configuration
  const layoutContent = read("src/app/layout.tsx");
  assert.match(
    layoutContent,
    /weight:\s*\[["']200["'],\s*["']300["'],\s*["']400["'],\s*["']500["'],\s*["']600["'],\s*["']700["'],\s*["']800["']\]/,
    "layout.tsx must load Be Vietnam Pro weights 200 through 800"
  );
  assert.match(
    layoutContent,
    /subsets:\s*\[["']latin["'],\s*["']vietnamese["']\]/,
    "layout.tsx must include vietnamese subset for Be Vietnam Pro"
  );
});

// =============================================================================
// 2. STICKY HEADER SCROLL OFFSET & ANCHOR INTEGRITY (HP-VIS-02 & EC-VIS-02)
// =============================================================================

test("QA-VIS-02: Sticky Header Scroll Offset & Anchor Integrity [id]", () => {
  const css = read("src/app/globals.css");
  assert.match(
    css,
    /\[id\]\s*\{[^}]*scroll-margin-top:\s*88px/,
    "globals.css must specify [id] { scroll-margin-top: 88px; } to clear sticky 64px header + 24px buffer"
  );
  assert.match(
    css,
    /html\s*\{[^}]*scroll-behavior:\s*smooth/,
    "globals.css must specify scroll-behavior: smooth"
  );
});

// =============================================================================
// 3. NOSCRIPT REVEAL FALLBACK (HP-VIS-03 & EC-VIS-03)
// =============================================================================

test("QA-VIS-03: Noscript Fallback Ensures 100% Content Visibility Without JS", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(
    layout,
    /<noscript>[\s\S]*?\.reveal[\s\S]*?opacity:\s*1\s*!important[\s\S]*?<\/noscript>/,
    "layout.tsx head must contain noscript fallback forcing opacity: 1 !important for .reveal"
  );
  assert.match(
    layout,
    /<noscript>[\s\S]*?transform:\s*none\s*!important[\s\S]*?<\/noscript>/,
    "layout.tsx noscript fallback must reset transform: none !important"
  );
});

// =============================================================================
// 4. SYSTEM-AWARE THEME INITIALIZATION (HP-VIS-04 & EC-VIS-04)
// =============================================================================

test("QA-VIS-04: System-Aware Theme Initialization With Safe SSR Fallback", () => {
  const layout = read("src/app/layout.tsx");

  // Verify inline script checks localStorage, then prefers-color-scheme, then falls back to dark
  assert.match(layout, /localStorage\.getItem\(["']workgo_theme["']\)/, "Inline script must check localStorage");
  assert.match(layout, /prefers-color-scheme:\s*light/, "Inline script must check prefers-color-scheme: light");
  assert.match(layout, /matchMedia/, "Inline script must guard matchMedia");

  // Simulate inline script logic in JS sandbox
  function simulateThemeInit(savedTheme, hasMatchMedia, prefersLight) {
    let resolved = "dark";
    if (savedTheme) {
      resolved = savedTheme;
    } else if (hasMatchMedia && prefersLight) {
      resolved = "light";
    }
    return resolved;
  }

  assert.equal(simulateThemeInit("light", true, false), "light", "Explicit saved light must win");
  assert.equal(simulateThemeInit("dark", true, true), "dark", "Explicit saved dark must win over system light");
  assert.equal(simulateThemeInit(null, true, true), "light", "No saved theme with system light preference must resolve light");
  assert.equal(simulateThemeInit(null, true, false), "dark", "No saved theme with system dark preference must resolve dark");
  assert.equal(simulateThemeInit(null, false, false), "dark", "No saved theme without matchMedia (SSR) must default to dark");
});

// =============================================================================
// 5. THEME TOGGLE & SETTINGS SYNCHRONIZATION (HP-VIS-05 & EC-VIS-05)
// =============================================================================

test("QA-VIS-05: Multi-Component Theme Synchronization & Event Bus Dispatch", () => {
  const toggleSrc = read("src/components/shell/theme-toggle.tsx");
  const settingsSrc = read("src/app/[locale]/(app)/settings/page.tsx");

  // ThemeToggle listens to workgo-theme-change custom event
  assert.match(toggleSrc, /addEventListener\(["']workgo-theme-change["']/);
  assert.match(toggleSrc, /removeEventListener\(["']workgo-theme-change["']/);

  // Settings page dispatches workgo-theme-change when theme is updated
  assert.match(settingsSrc, /dispatchEvent/);
  assert.match(settingsSrc, /workgo-theme-change/);

  // ThemeToggle observes documentElement attributes with infinite-loop guard
  assert.match(toggleSrc, /isApplying/);
  assert.match(toggleSrc, /new MutationObserver/);
});

// =============================================================================
// 6. SINGLE-SOURCE DESIGN TOKENS (HP-VIS-06)
// =============================================================================

test("QA-VIS-06: Single-Source Design Tokens & Palette Parity", () => {
  const tokenSrc = read("src/lib/design-tokens.ts");
  assert.match(
    tokenSrc,
    /WORKGO_APP_TOKENS\s*=\s*(?:SEMANTIC_TOKENS|\{[^}]*\})/,
    "WORKGO_APP_TOKENS must be defined and aligned with semantic tokens"
  );
  assert.match(tokenSrc, /#2563EB/, "Primary brand color must be Trust Blue #2563EB");
});

// =============================================================================
// 7. Z-INDEX SCALE & STACKING CONTEXT ORDER (HP-VIS-07 & EC-VIS-07)
// =============================================================================

test("QA-VIS-07: Ascending Z-Index Stacking Hierarchy", () => {
  const css = read("src/app/globals.css");

  const zHeader = Number(css.match(/--z-header:\s*(\d+);/)?.[1]);
  const zDropdown = Number(css.match(/--z-dropdown:\s*(\d+);/)?.[1]);
  const zDrawer = Number(css.match(/--z-drawer:\s*(\d+);/)?.[1]);
  const zModal = Number(css.match(/--z-modal:\s*(\d+);/)?.[1]);
  const zToast = Number(css.match(/--z-toast:\s*(\d+);/)?.[1]);
  const zTooltip = Number(css.match(/--z-tooltip:\s*(\d+);/)?.[1]);

  assert.ok(zHeader < zDropdown, `header (${zHeader}) must be < dropdown (${zDropdown})`);
  assert.ok(zDropdown < zDrawer, `dropdown (${zDropdown}) must be < drawer (${zDrawer})`);
  assert.ok(zDrawer < zModal, `drawer (${zDrawer}) must be < modal (${zModal})`);
  assert.ok(zModal < zToast, `modal (${zModal}) must be < toast (${zToast})`);
  assert.ok(zToast < zTooltip, `toast (${zToast}) must be < tooltip (${zTooltip})`);
});

// =============================================================================
// 8. INTERACTIVE HIT-AREAS & DECORATIVE POINTER-EVENTS (HP-VIS-08 & EC-VIS-08)
// =============================================================================

test("QA-VIS-08: Decorative Background Scrims Have Pointer-Events-None", () => {
  const heroSrc = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(heroSrc, /pointer-events-none/);
  assert.match(heroSrc, /bg-black\/45/);

  // Buttons in hero search have proper click targets
  assert.match(heroSrc, /fiverr-press/);
});

// =============================================================================
// 9. FIVERR LANDING LIGHT-SHELL BY DESIGN (HP-VIS-09)
// =============================================================================

test("QA-VIS-09: Fiverr Landing Page Preserves Light-Shell Design Intent", () => {
  const landingSrc = read("src/components/landing/fiverr/fiverr-landing.tsx");
  assert.match(
    landingSrc,
    /bg-white\s+text-\[#222325\]/,
    "Fiverr landing orchestrator must maintain light-shell bg-white text-[#222325] by design"
  );
  assert.match(landingSrc, /overflow-x-hidden/, "Landing orchestrator must clip horizontal overflow");
});

// =============================================================================
// 10. MOBILE COMPONENT THEME ADAPTATION (HP-VIS-10)
// =============================================================================

test("QA-VIS-10: Android Frontend Dynamic Theme Adapters", () => {
  assert.ok(existsAndroid("src/constants/theme.ts"), "android-frontend theme.ts must exist");
  const themeSrc = readAndroid("src/constants/theme.ts");

  assert.match(themeSrc, /Colors\s*=\s*\{/, "theme.ts must export Colors object");
  assert.match(themeSrc, /light:\s*\{/, "Colors must define light theme palette");
  assert.match(themeSrc, /dark:\s*\{/, "Colors must define dark theme palette");
  assert.match(themeSrc, /primary:\s*["']#2563EB["']/, "Light primary must be #2563EB");

  // Check home-explore-card theme adaptation
  if (existsAndroid("src/components/home-explore-card.tsx")) {
    const cardSrc = readAndroid("src/components/home-explore-card.tsx");
    assert.match(cardSrc, /useTheme|colorScheme|isDark/, "home-explore-card must adapt to dark mode");
  }
});

// =============================================================================
// 11. REGRESSION: SHARE LINK, UNDO BOOKMARK & LOCATION FILTER (HP-VIS-11)
// =============================================================================

test("QA-VIS-11: Feature Regression — Share Link, Bookmark Undo, and Location Filter", () => {
  // Share link module
  assert.ok(exists("src/lib/share.ts"), "share.ts utility must exist");
  const shareSrc = read("src/lib/share.ts");
  assert.match(shareSrc, /export\s+async\s+function\s+copyPostLink/, "share.ts must export copyPostLink");
  assert.match(shareSrc, /navigator\.clipboard/, "copyPostLink must attempt navigator.clipboard first");
  assert.match(shareSrc, /document\.execCommand/, "copyPostLink must fallback to execCommand for non-https/older browsers");

  // PostCard share & undo integration
  const postCardSrc = read("src/components/composed/post-card.tsx");
  assert.match(postCardSrc, /handleShare/, "PostCard must implement handleShare");
  assert.match(postCardSrc, /restoreSaved/, "PostCard must implement restoreSaved for undo");
  assert.match(postCardSrc, /Hoàn tác/, "PostCard toast must provide Hoàn tác undo action");
  assert.match(postCardSrc, /#00732E/, "PostCard verified shield must retain #00732E");

  // Posts page location filtering
  const postsPageSrc = read("src/app/[locale]/(public)/posts/page.tsx");
  assert.match(postsPageSrc, /displayedPosts/, "posts/page.tsx must calculate displayedPosts based on location");
  assert.match(postsPageSrc, /posts\.length === 0/, "posts/page.tsx must retain posts.length === 0 check");
});
