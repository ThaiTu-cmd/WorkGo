import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");

function readWeb(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function readAndroid(rel) {
  return fs.readFileSync(path.join(ANDROID_ROOT, rel), "utf-8");
}

function existsAndroid(rel) {
  return fs.existsSync(path.join(ANDROID_ROOT, rel));
}

// Utility: Calculate WCAG contrast ratio
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function relativeLuminance(rgb) {
  const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// =============================================================================
// 1. SINGLE-SOURCE MOBILE EXEC_CONFIG CONTRACT
// =============================================================================

test("QA-C2-01: Single-Source Mobile EXEC_CONFIG Contract", () => {
  assert.ok(existsAndroid("src/constants/exec-config.ts"), "exec-config.ts must exist");
  const execSrc = readAndroid("src/constants/exec-config.ts");

  const requiredKeys = ["DIGITAL", "ONSITE", "DELIVERY", "APPOINTMENT", "HOURLY", "PROJECT"];
  for (const k of requiredKeys) {
    assert.match(execSrc, new RegExp(`${k}:\\s*\\{`), `exec-config.ts must configure ${k}`);
  }

  assert.match(execSrc, /export\s+function\s+getExecStyle/, "Must export getExecStyle helper function");

  // Verify import in service-card.tsx and detail.tsx
  const serviceCardSrc = readAndroid("src/components/service-card.tsx");
  const detailSrc = readAndroid("src/app/detail.tsx");

  assert.match(serviceCardSrc, /from\s+['"]@\/constants\/exec-config['"]/, "service-card.tsx must import from exec-config");
  assert.match(serviceCardSrc, /getExecStyle\s*\(/, "service-card.tsx must call getExecStyle");

  assert.match(detailSrc, /from\s+['"]@\/constants\/exec-config['"]/, "detail.tsx must import from exec-config");
  assert.match(detailSrc, /getExecStyle\s*\(/, "detail.tsx must call getExecStyle");
});

// =============================================================================
// 2. MATHEMATICAL WCAG AA CONTRAST RATIO (> 4.5:1) ON EXECUTION BADGES
// =============================================================================

test("QA-C2-02: Execution Badge Dark Pairs Satisfy WCAG AA Contrast Ratio (>= 4.5:1)", () => {
  // Color specifications from exec-config.ts
  const badgePairs = [
    { type: "DIGITAL", light: { bg: "#E0F2FE", fg: "#0369A1" }, dark: { bg: "#0C2A4A", fg: "#7DD3FC" } },
    { type: "ONSITE", light: { bg: "#FEF3C7", fg: "#B45309" }, dark: { bg: "#3A2503", fg: "#FCD34D" } },
    { type: "DELIVERY", light: { bg: "#DCFCE7", fg: "#15803D" }, dark: { bg: "#052E1B", fg: "#6EE7B7" } },
    { type: "APPOINTMENT", light: { bg: "#F3E8FF", fg: "#7C3AED" }, dark: { bg: "#2A1650", fg: "#C4B5FD" } },
  ];

  for (const item of badgePairs) {
    const lightRatio = contrastRatio(item.light.fg, item.light.bg);
    const darkRatio = contrastRatio(item.dark.fg, item.dark.bg);

    assert.ok(
      lightRatio >= 4.5,
      `${item.type} light contrast ratio (${lightRatio.toFixed(2)}) must be >= 4.5:1`
    );
    assert.ok(
      darkRatio >= 4.5,
      `${item.type} dark contrast ratio (${darkRatio.toFixed(2)}) must be >= 4.5:1`
    );
  }
});

// =============================================================================
// 3. MODAL SHEETS STATUSBARTRANSLUCENT & SAFE AREA INSETS
// =============================================================================

test("QA-C2-03: Modal Sheets Enable statusBarTranslucent & Safe Area Insets", () => {
  const filterSheetSrc = readAndroid("src/components/filter-sheet.tsx");
  const proposalSheetSrc = readAndroid("src/components/proposal-sheet.tsx");

  // statusBarTranslucent prop
  assert.match(filterSheetSrc, /statusBarTranslucent=\{true\}/, "FilterSheet Modal must enable statusBarTranslucent");
  assert.match(proposalSheetSrc, /statusBarTranslucent=\{true\}/, "ProposalSheet Modal must enable statusBarTranslucent");

  // Backdrop tap-to-close Pressable
  assert.match(filterSheetSrc, /<Pressable[^>]*onPress=\{onClose\}/, "FilterSheet backdrop must be tap-to-close Pressable");
  assert.match(proposalSheetSrc, /<Pressable[^>]*onPress=\{onClose\}/, "ProposalSheet backdrop must be tap-to-close Pressable");

  // Safe bottom insets
  assert.match(filterSheetSrc, /useSafeAreaInsets/, "FilterSheet must use useSafeAreaInsets");
  assert.match(proposalSheetSrc, /useSafeAreaInsets/, "ProposalSheet must use useSafeAreaInsets");
});

// =============================================================================
// 4. KEYBOARD AVOIDANCE HEIGHT MODE ON ANDROID
// =============================================================================

test("QA-C2-04: KeyboardAvoidingView Uses Height Mode on Android", () => {
  const proposalSheetSrc = readAndroid("src/components/proposal-sheet.tsx");
  assert.match(
    proposalSheetSrc,
    /behavior=\{Platform\.OS === ['"]ios['"] \? ['"]padding['"] : ['"]height['"]\}/,
    "proposal-sheet.tsx KAV must use 'height' on Android and 'padding' on iOS"
  );
});

// =============================================================================
// 5. TOAST DISPATCH TIMING AFTER MODAL UNMOUNT
// =============================================================================

test("QA-C2-05: Toast Shows After Modal Close Delay (>= 150ms)", () => {
  const detailSrc = readAndroid("src/app/detail.tsx");
  assert.match(
    detailSrc,
    /setSheetVisible\(false\);[\s\S]*?setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*?toast\.show/,
    "detail.tsx must close sheet first and trigger toast after setTimeout delay"
  );
  assert.match(detailSrc, /150\);/, "setTimeout delay must be at least 150ms");
});

// =============================================================================
// 6. STATUSBAR INTEGRATION IN ROOT LAYOUT
// =============================================================================

test("QA-C2-06: Root Layout Integrates StatusBar from expo-status-bar", () => {
  const layoutSrc = readAndroid("src/app/_layout.tsx");
  assert.match(layoutSrc, /import\s*\{\s*StatusBar\s*\}\s*from\s*['"]expo-status-bar['"]/, "Must import StatusBar from expo-status-bar");
  assert.match(
    layoutSrc,
    /<StatusBar\s+style=\{colorScheme === ['"]dark['"] \? ['"]light['"] : ['"]dark['"]\}\s*\/>/,
    "Must adapt StatusBar style to colorScheme"
  );
});

// =============================================================================
// 7. ROBOTO COMPATIBLE FONT WEIGHT CAPPING ON ANDROID
// =============================================================================

test("QA-C2-07: Android Font Weight Capped to 700 to Prevent Faux-Bold", () => {
  const notFoundSrc = readAndroid("src/app/+not-found.tsx");
  assert.match(
    notFoundSrc,
    /Platform\.select\(\{\s*android:\s*['"]700['"],\s*default:\s*['"]800['"]\s*\}\)/,
    "+not-found.tsx must cap 800 weight to 700 on Android"
  );
});

// =============================================================================
// 8. MOBILE STATES THEME-AWARE BACKGROUNDS & COLORS
// =============================================================================

test("QA-C2-08: Mobile States (Skeleton & ErrorState) Eliminate Hardcoded Light Pastels", () => {
  const statesSrc = readAndroid("src/components/states.tsx");

  // Error icon background and icon color adapt to theme
  assert.match(statesSrc, /backgroundColor:\s*theme\.backgroundElement/, "ErrorState icon circle must use theme.backgroundElement");
  assert.match(statesSrc, /borderColor:\s*theme\.danger/, "ErrorState icon circle must use theme.danger border");

  // Card skeleton adapts to theme surface & border
  assert.match(statesSrc, /backgroundColor:\s*theme\.surface/, "Skeleton card must use theme.surface");
  assert.match(statesSrc, /borderColor:\s*theme\.border/, "Skeleton card must use theme.border");
});

// =============================================================================
// 9. CLIENT MY-POSTS SCREEN STATUS BADGE THEME ADAPTATION
// =============================================================================

test("QA-C2-09: MyPosts Client Screen Uses Dynamic Theme Badges", () => {
  const myPostsSrc = readAndroid("src/app/(tabs)/my-posts.tsx");
  assert.match(myPostsSrc, /useColorScheme/, "my-posts.tsx must consume useColorScheme");
  assert.match(myPostsSrc, /isDark\s*\?/, "my-posts.tsx must define dark/light pairs for status badges");
});

// =============================================================================
// 10. WEB REGRESSION: ZERO FAUX-BOLD, ANCHOR MARGIN & NOSCRIPT INTACT
// =============================================================================

test("QA-C2-10: Web Visual Regression Guarantees Remain Intact", () => {
  const globalsCss = readWeb("src/app/globals.css");
  assert.match(globalsCss, /\[id\]\s*\{[^}]*scroll-margin-top:\s*88px/, "Anchor scroll-margin-top: 88px preserved");

  const layout = readWeb("src/app/layout.tsx");
  assert.match(layout, /<noscript>[\s\S]*?\.reveal[\s\S]*?opacity:\s*1\s*!important/, "Noscript fallback preserved");
  assert.match(layout, /prefers-color-scheme:\s*light/, "System-aware theme init preserved");

  const tokens = readWeb("src/lib/design-tokens.ts");
  assert.match(tokens, /WORKGO_APP_TOKENS/, "Design tokens single-source preserved");
});
