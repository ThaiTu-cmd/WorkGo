import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Dynamic imports of TypeScript modules
import {
  WORKGO_PALETTE,
  SEMANTIC_TOKENS,
  hexToLinear as tokensHexToLinear,
  cxGlass,
} from "../src/lib/design-tokens.ts";

// =============================================================================
// QA TEST SUITE: WORKGO VISUAL SYSTEM REDESIGN - DEEP VERIFICATION GATE
// Covers Happy Paths, Edge Cases, Boundary Conditions, Accessibility, and i18n
// =============================================================================

// -----------------------------------------------------------------------------
// 1. UNIT TESTS: design-tokens.ts
// -----------------------------------------------------------------------------

test("TC-DEEP-01 - Unit: hexToLinear (design-tokens) mathematical accuracy and edge cases", () => {
  // Happy Path: Pure Black & Pure White
  const black = tokensHexToLinear("#000000");
  assert.deepEqual(black, { r: 0, g: 0, b: 0 }, "Black must map to { r: 0, g: 0, b: 0 }");

  const white = tokensHexToLinear("#FFFFFF");
  assert.deepEqual(white, { r: 1, g: 1, b: 1 }, "White must map to { r: 1, g: 1, b: 1 }");

  // Primary Electric Blue #1677FF
  const electric = tokensHexToLinear("#1677FF");
  assert.ok(electric.r > 0 && electric.r < 0.05, "Electric blue red component is low");
  assert.ok(electric.g > 0.15 && electric.g < 0.25, "Electric blue green component is mid");
  assert.strictEqual(electric.b, 1, "Electric blue blue component is 1");

  // Shorthand 3-digit hex #fff and #000
  const shorthandWhite = tokensHexToLinear("#fff");
  assert.deepEqual(shorthandWhite, { r: 1, g: 1, b: 1 }, "#fff must expand to { r: 1, g: 1, b: 1 }");

  const shorthandBlack = tokensHexToLinear("#000");
  assert.deepEqual(shorthandBlack, { r: 0, g: 0, b: 0 }, "#000 must expand to { r: 0, g: 0, b: 0 }");

  // Case insensitivity & Hash prefix omission
  const lowerHex = tokensHexToLinear("#1677ff");
  const noHashHex = tokensHexToLinear("1677FF");
  assert.deepEqual(lowerHex, electric, "Lowercase hex must match uppercase");
  assert.deepEqual(noHashHex, electric, "Hex without hash must match hex with hash");

  // Edge & Corner cases: empty string, invalid hex
  const emptyRes = tokensHexToLinear("");
  assert.deepEqual(emptyRes, { r: 0, g: 0, b: 0 }, "Empty string safely falls back to black");

  const invalidRes = tokensHexToLinear("invalid-color");
  assert.deepEqual(invalidRes, { r: 0, g: 0, b: 0 }, "Invalid hex safely falls back to black");
});

test("TC-DEEP-02 - Unit: cxGlass returns correct CSS class mappings", () => {
  assert.strictEqual(cxGlass("default"), "glass");
  assert.strictEqual(cxGlass("dark"), "glass-dark");
  assert.strictEqual(cxGlass("card"), "glass-card");
  assert.strictEqual(cxGlass("panel"), "glass-panel");
  assert.strictEqual(cxGlass("dock"), "glass-dock");
  assert.strictEqual(cxGlass(undefined), "glass", "Undefined variant falls back to 'glass'");
});

test("TC-DEEP-03 - Unit: WORKGO_PALETTE & SEMANTIC_TOKENS completeness and contrast", () => {
  const canonicalColors = [
    "deepNavy", "navy", "darkBlue", "oceanBlue", "electricBlue", "brightBlue",
    "cyan", "iceBlue", "iceHighlight", "white", "lightBg", "lightSurface", "lightSecondary"
  ];
  for (const c of canonicalColors) {
    assert.ok(c in WORKGO_PALETTE, `WORKGO_PALETTE must contain key: ${c}`);
    assert.match(WORKGO_PALETTE[c], /^#[0-9A-Fa-f]{6}$/, `${c} must be valid 6-char hex`);
  }

  const darkKeys = Object.keys(SEMANTIC_TOKENS.dark).sort();
  const lightKeys = Object.keys(SEMANTIC_TOKENS.light).sort();
  assert.deepEqual(darkKeys, lightKeys, "Dark and Light semantic token keys must match 1:1");

  assert.strictEqual(SEMANTIC_TOKENS.dark.bgApp, WORKGO_PALETTE.deepNavy);
  assert.strictEqual(SEMANTIC_TOKENS.dark.textPrimary, WORKGO_PALETTE.white);
  assert.strictEqual(SEMANTIC_TOKENS.light.bgApp, WORKGO_PALETTE.lightBg);
  assert.strictEqual(SEMANTIC_TOKENS.light.textPrimary, WORKGO_PALETTE.navy);
});

test("TC-DEEP-04 - Unit: LandingStaticBackground component contract and accessibility", () => {
  const bgPath = path.join(ROOT, "src/components/landing/landing-static-background.tsx");
  assert.ok(fs.existsSync(bgPath), "landing-static-background.tsx must exist");
  const bgSrc = fs.readFileSync(bgPath, "utf-8");

  assert.match(bgSrc, /"use client"/, "Must be client component");
  assert.match(bgSrc, /fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-app/, "Root container must be fixed and pointer-events-none with bg-app");
  assert.match(bgSrc, /aria-hidden="true"/, "Must be marked aria-hidden='true'");
  assert.match(bgSrc, /landing-static-cone/, "Must render landing-static-cone");
  assert.match(bgSrc, /landing-static-vignette/, "Must render landing-static-vignette");
});

test("TC-DEEP-05 - Unit & Edge Case: ThemeToggle lifecycle, multi-instance synchronization, and cleanup", () => {
  const togglePath = path.join(ROOT, "src/components/shell/theme-toggle.tsx");
  assert.ok(fs.existsSync(togglePath), "theme-toggle.tsx must exist");
  const toggleSrc = fs.readFileSync(togglePath, "utf-8");

  // Fallback to "dark" on empty localStorage
  assert.match(toggleSrc, /localStorage\.getItem\(["']workgo_theme["']\).*?\|\|\s*["']dark["']/);

  // Sync and dispatch
  assert.match(toggleSrc, /window\.addEventListener\(["']workgo-theme-change["'],\s*onCustom\)/);
  assert.match(toggleSrc, /window\.removeEventListener\(["']workgo-theme-change["'],\s*onCustom\)/);

  // MutationObserver setup and teardown
  assert.match(toggleSrc, /attributeFilter:\s*\[["']class["'],\s*["']data-theme["']\]/);
  assert.match(toggleSrc, /obs\.disconnect\(\)/);

  // CustomEvent dispatch
  assert.match(toggleSrc, /new CustomEvent\(["']workgo-theme-change["'],\s*\{\s*detail:\s*\{\s*theme:\s*nextTheme\s*\}\s*\}\)/);
});

// -----------------------------------------------------------------------------
// 2. INTEGRATION & LOGIC TESTS: status-badge.tsx
// -----------------------------------------------------------------------------

test("TC-DEEP-06 - Logic: StatusBadge mapping matrix, case-insensitivity, and override", () => {
  const badgeSrc = fs.readFileSync(path.join(ROOT, "src/components/ui/status-badge.tsx"), "utf-8");

  assert.match(badgeSrc, /normalized\s*=\s*\(status\s*\|\|\s*""\)\.toUpperCase\(\)/);

  for (const s of ["COMPLETED", "ACCEPTED", "RESOLVED", "SUCCESS", "ACTIVE"]) {
    assert.ok(badgeSrc.includes(`case "${s}":`), `StatusBadge must handle ${s} under success`);
  }

  for (const s of ["IN_PROGRESS", "PENDING"]) {
    assert.ok(badgeSrc.includes(`case "${s}":`), `StatusBadge must handle ${s} under warning`);
  }

  for (const s of ["CANCELLED", "REJECTED", "FAILED", "SUSPENDED", "DISPUTED"]) {
    assert.ok(badgeSrc.includes(`case "${s}":`), `StatusBadge must handle ${s} under danger`);
  }

  for (const s of ["OPEN", "CLIENT", "PROVIDER", "ADMIN"]) {
    assert.ok(badgeSrc.includes(`case "${s}":`), `StatusBadge must handle ${s} under info`);
  }

  assert.match(badgeSrc, /if\s*\(explicitVariant\)\s*\{/);
});

// -----------------------------------------------------------------------------
// 3. INTEGRATION & CONTRACT TESTS: Components
// -----------------------------------------------------------------------------

test("TC-DEEP-07 - Contract: ParticleOceanHero supports theme-aware classes and pressable CTAs", () => {
  const heroSrc = fs.readFileSync(path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx"), "utf-8");

  assert.match(heroSrc, /export function ParticleOceanHero/);
  assert.ok(!heroSrc.includes("particle-ocean-webgl"), "particle-ocean-hero must not import webgl");
  assert.match(heroSrc, /text-fg/, "Hero headline must use text-fg");
  assert.match(heroSrc, /text-fg-secondary/, "Hero subtitle must use text-fg-secondary");
  assert.match(heroSrc, /pressable/, "Hero CTAs must include pressable utility");
  assert.match(heroSrc, /pointer-events-auto/);
});

test("TC-DEEP-08 - Contract: WorkgoNavbar integrates i18n, mobile drawer, and pressable links", () => {
  const navSrc = fs.readFileSync(path.join(ROOT, "src/components/landing/workgo-navbar.tsx"), "utf-8");

  assert.match(navSrc, /useTranslations\(["']landing\.nav["']\)/);
  assert.match(navSrc, /setMobileMenuOpen/);
  assert.match(navSrc, /bg-surface\/80/, "Navbar must use semantic surface token");
  assert.match(navSrc, /border-border/, "Navbar must use semantic border token");
  assert.match(navSrc, /pressable/, "Navbar links must include pressable utility");
  assert.match(navSrc, /<LanguageSwitcher/);
  assert.match(navSrc, /<ThemeToggle/);
});

test("TC-DEEP-09 - Contract: WorkgoLandingSections features 6 cards, showcase, CTA, and footer", () => {
  const secSrc = fs.readFileSync(path.join(ROOT, "src/components/landing/workgo-landing-sections.tsx"), "utf-8");

  assert.match(secSrc, /featureCards\s*=\s*\[/);
  assert.match(secSrc, /featuredJobs\s*=\s*\[/);
  assert.match(secSrc, /id=["']features["']/);
  assert.match(secSrc, /id=["']showcase["']/);
  assert.match(secSrc, /id=["']pricing["']/);
  assert.match(secSrc, /scroll-mt-20/);
  assert.match(secSrc, /landing-cta-panel/);
  assert.match(secSrc, /footer\.solutions/);
  assert.match(secSrc, /footer\.company/);
  assert.match(secSrc, /footer\.legal/);
});

test("TC-DEEP-10 - Contract: AuthAtmosphere handles intensity modes and zero canvas", () => {
  const authAtmoSrc = fs.readFileSync(path.join(ROOT, "src/components/effects/auth-atmosphere.tsx"), "utf-8");

  assert.match(authAtmoSrc, /aria-hidden=["']true["']/);
  assert.match(authAtmoSrc, /pointer-events-none/);
  assert.ok(!authAtmoSrc.includes("ParticleOcean"), "AuthAtmosphere must not import ParticleOcean");
  assert.match(authAtmoSrc, /color-mix/);

  const authShellSrc = fs.readFileSync(path.join(ROOT, "src/components/shell/auth-shell.tsx"), "utf-8");
  assert.match(authShellSrc, /<AuthAtmosphere intensity=["']subtle["'] \/>/);
  assert.match(authShellSrc, /max-w-\[480px\]/);
});

test("TC-DEEP-11 - Contract: AppShellClient does not import or render ambient canvas", () => {
  const clientShellSrc = fs.readFileSync(path.join(ROOT, "src/components/shell/app-shell-client.tsx"), "utf-8");

  assert.ok(!clientShellSrc.includes("particle-ocean-ambient"), "AppShellClient must not import particle-ocean-ambient");
  assert.ok(!clientShellSrc.includes("<ParticleOceanAmbient"), "AppShellClient must not render ParticleOceanAmbient");
});

test("TC-DEEP-12 - Architecture: Clean Landing with LandingStaticBackground and zero iframes", () => {
  const landingViewSrc = fs.readFileSync(path.join(ROOT, "src/components/landing/ascend-landing-view.tsx"), "utf-8");

  assert.ok(!landingViewSrc.includes("<iframe"), "Landing view must have 0 <iframe> elements");
  assert.match(landingViewSrc, /\{mounted && <WorkgoLandingPage/);

  const landingPageSrc = fs.readFileSync(path.join(ROOT, "src/components/landing/workgo-landing-page.tsx"), "utf-8");
  assert.match(landingPageSrc, /<LandingStaticBackground\s*\/>/);
  assert.ok(!landingPageSrc.includes("ParticleOceanWebGL"), "Must not render ParticleOceanWebGL");
  assert.match(landingPageSrc, /<WorkgoNavbar/);
  assert.match(landingPageSrc, /<ParticleOceanHero/);
  assert.match(landingPageSrc, /<WorkgoLandingSections/);
});

test("TC-DEEP-13 - Tokens & Design System: Complete elimination of active mint from critical components", () => {
  const filesToCheck = [
    "src/components/shell/app-header.tsx",
    "src/components/shell/public-header.tsx",
    "src/components/shell/auth-shell.tsx",
    "src/components/ui/button.tsx",
  ];

  for (const f of filesToCheck) {
    const content = fs.readFileSync(path.join(ROOT, f), "utf-8");
    assert.ok(
      !content.includes("5df0a8") && !content.includes("2fd38a"),
      `File ${f} must not contain active legacy mint hexes`
    );
  }

  const cardSrc = fs.readFileSync(path.join(ROOT, "src/components/ui/card.tsx"), "utf-8");
  assert.match(cardSrc, /tone\s*=\s*["']solid["']/);
  assert.match(cardSrc, /isGlass\s*=\s*glass\s*\|\|\s*tone\s*===\s*["']glass["']/);
});

test("TC-DEEP-14 - i18n: 100% Dictionary parity for all landing subsections", () => {
  const vi = JSON.parse(fs.readFileSync(path.join(ROOT, "src/dictionaries/vi.json"), "utf-8"));
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, "src/dictionaries/en.json"), "utf-8"));

  assert.ok(vi.landing, "vi.json must contain landing section");
  assert.ok(en.landing, "en.json must contain landing section");

  const subsections = ["nav", "hero", "features", "showcase", "cta", "footer"];
  for (const sub of subsections) {
    assert.ok(vi.landing[sub], `vi.landing must contain subsection: ${sub}`);
    assert.ok(en.landing[sub], `en.landing must contain subsection: ${sub}`);

    const viSubKeys = Object.keys(vi.landing[sub]).sort();
    const enSubKeys = Object.keys(en.landing[sub]).sort();

    assert.deepEqual(
      viSubKeys,
      enSubKeys,
      `Subsection '${sub}' must have 100% key parity between vi.json and en.json`
    );
  }
});

test("TC-DEEP-15 - Press Physics & Reduced-Motion Accessibility Contracts", () => {
  const buttonPath = path.join(ROOT, "src/components/ui/button.tsx");
  const buttonSrc = fs.readFileSync(buttonPath, "utf-8");

  // Button spring physics
  assert.match(buttonSrc, /ease-\[cubic-bezier\(0\.34,1\.56,0\.64,1\)\]/);
  assert.match(buttonSrc, /active:scale-\[0\.94\]/);
  assert.match(buttonSrc, /disabled:active:scale-100/, "Disabled button must not scale on active click");

  // CSS pressable and reduced motion
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const cssSrc = fs.readFileSync(cssPath, "utf-8");

  assert.match(cssSrc, /\.pressable:active\s*\{[\s\S]*?scale\(0\.95\)/);
  assert.match(cssSrc, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?scroll-behavior:\s*auto;/);
});

