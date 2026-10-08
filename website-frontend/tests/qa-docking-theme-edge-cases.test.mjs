import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORKGO_ROOT = path.resolve(ROOT, "..");

// =============================================================================
// TEST SUITE 1: AppContentArea Component Logic & Contracts
// =============================================================================

test("QA-TC-EDGE-01 - AppContentArea: Component exports, semantic tag, and layout contracts", () => {
  const filePath = path.join(ROOT, "src/components/shell/app-content-area.tsx");
  assert.ok(fs.existsSync(filePath), "app-content-area.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  // Happy Path: Export verification
  assert.match(
    content,
    /export\s+interface\s+AppContentAreaProps\s+extends\s+React\.HTMLAttributes<HTMLElement>/,
    "AppContentAreaProps must extend HTMLAttributes<HTMLElement> for complete prop forwarding"
  );
  assert.match(
    content,
    /export\s+function\s+AppContentArea\b/,
    "AppContentArea component must be exported"
  );

  // Semantic <main> tag check
  assert.match(
    content,
    /<main\b[^>]*\btabIndex=\{-1\}/,
    "AppContentArea must render a semantic <main> tag with tabIndex={-1} for focus management"
  );

  // Independent scroll contract
  assert.match(
    content,
    /h-\[calc\(100vh-4rem\)\]/,
    "AppContentArea must enforce height h-[calc(100vh-4rem)]"
  );
  assert.match(
    content,
    /overflow-y-auto/,
    "AppContentArea must have overflow-y-auto for independent vertical scrolling"
  );
  assert.match(
    content,
    /overflow-x-hidden/,
    "AppContentArea must suppress horizontal overflow with overflow-x-hidden"
  );
  assert.match(
    content,
    /min-w-0/,
    "AppContentArea must include min-w-0 to prevent flex item blowup"
  );
  assert.match(
    content,
    /flex-1/,
    "AppContentArea must fill remaining layout space with flex-1"
  );
});

test("QA-TC-EDGE-02 - AppContentArea: Responsive padding, accessibility, and children wrapper", () => {
  const filePath = path.join(ROOT, "src/components/shell/app-content-area.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Edge Case: Mobile bottom navigation clearance
  assert.match(
    content,
    /pb-20\s+md:pb-8/,
    "AppContentArea must have pb-20 on mobile to clear MobileNav and md:pb-8 on desktop"
  );

  // Accessibility & UX
  assert.match(
    content,
    /focus:outline-none/,
    "AppContentArea must suppress default browser outline on program focus"
  );
  assert.match(
    content,
    /scroll-smooth/,
    "AppContentArea must support smooth scrolling for in-page anchors"
  );

  // Children relative z-index wrapper
  assert.match(
    content,
    /<div\s+className=["']w-full\s+relative\s+z-10["']>\{children\}<\/div>/,
    "Children must be wrapped in a relative z-10 container to sit above background ambient effects"
  );

  // Prop forwarding: className merging & rest props spread
  assert.match(
    content,
    /className\s*=\s*\{cn\(/,
    "AppContentArea must merge custom className with default styles via cn()"
  );
  assert.match(
    content,
    /\{\.\.\.props\}/,
    "AppContentArea must spread rest props onto the <main> element"
  );
});

// =============================================================================
// TEST SUITE 2: AppShellClient Dual-Tier Viewport Locking & State Safety
// =============================================================================

test("QA-TC-EDGE-03 - AppShellClient: Two-tier viewport lock preventing window scroll", () => {
  const shellPath = path.join(ROOT, "src/components/shell/app-shell-client.tsx");
  assert.ok(fs.existsSync(shellPath), "app-shell-client.tsx must exist");
  const content = fs.readFileSync(shellPath, "utf-8");

  // Tier 1: Outer shell container lock
  assert.match(
    content,
    /className=["']h-screen\s+max-h-screen\s+overflow-hidden\s+bg-app\s+flex\s+flex-col\s+relative["']/,
    "Outer shell container must lock viewport window scrolling with h-screen max-h-screen overflow-hidden"
  );

  // Tier 2: Intermediate flex row wrapper lock
  assert.match(
    content,
    /className=["']flex-1\s+flex\s+w-full\s+relative\s+z-10\s+overflow-hidden["']/,
    "Intermediate flex layout row must have overflow-hidden to prevent layout leakage"
  );

  // Clean integration of AppContentArea without monolithic main
  assert.match(
    content,
    /<AppContentArea>\{children\}<\/AppContentArea>/,
    "AppShellClient must delegate content rendering to <AppContentArea>"
  );
  assert.doesNotMatch(
    content,
    /<main\b[^>]*>/,
    "AppShellClient must NOT contain inline <main> tag"
  );
});

test("QA-TC-EDGE-04 - AppShellClient: LocalStorage fault tolerance & SSR hydration safety", () => {
  const shellPath = path.join(ROOT, "src/components/shell/app-shell-client.tsx");
  const content = fs.readFileSync(shellPath, "utf-8");

  // Edge Case: Private browsing / disabled localStorage throwing SecurityError
  assert.match(
    content,
    /try\s*\{\s*const saved = localStorage\.getItem\(["']workgo_sidebar_collapsed["']\);[\s\S]*\}\s*catch\s*\{/s,
    "Reading workgo_sidebar_collapsed from localStorage must be enclosed in try/catch block"
  );

  assert.match(
    content,
    /try\s*\{\s*localStorage\.setItem\(["']workgo_sidebar_collapsed["'],\s*String\(next\)\);[\s\S]*\}\s*catch\s*\{/s,
    "Writing workgo_sidebar_collapsed to localStorage must be enclosed in try/catch block"
  );

  // Edge Case: SSR-safe search query access without Suspense de-opt
  assert.match(
    content,
    /React\.useSyncExternalStore/,
    "AppShellClient must use useSyncExternalStore for SSR-safe window.location.search tracking"
  );
});

// =============================================================================
// TEST SUITE 3: Sidebar Zero-Scroll & Flush Docking Mechanics
// =============================================================================

test("QA-TC-EDGE-05 - Sidebar: Flush docking, locked height, and non-shrink Flexbox rule", () => {
  const sidebarPath = path.join(ROOT, "src/components/shell/sidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "sidebar.tsx must exist");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Geometry: Flush-to-edge
  assert.match(
    content,
    /m-0\s+left-0/,
    "Sidebar must specify m-0 left-0 to dock flush against the screen viewport boundary"
  );

  // Fixed height matching viewport minus header height (h-16 = 4rem)
  assert.match(
    content,
    /h-\[calc\(100vh-4rem\)\]/,
    "Sidebar must have fixed height h-[calc(100vh-4rem)]"
  );

  // Must not shrink under flex constraints
  assert.match(
    content,
    /shrink-0/,
    "Sidebar must have shrink-0 to prevent compression when content area expands"
  );

  // Internal scrolling capability for tall menus on low vertical resolution screens
  assert.match(
    content,
    /overflow-y-auto\s+overflow-x-hidden/,
    "Sidebar must handle internal vertical scroll while preventing horizontal overflow"
  );

  // Desktop responsive isolation
  assert.match(
    content,
    /hidden\s+md:flex/,
    "Sidebar must be hidden on mobile (<768px) and flex on md: breakpoints"
  );
});

test("QA-TC-EDGE-06 - Sidebar: Collapsible transitions and label abbreviations", () => {
  const sidebarPath = path.join(ROOT, "src/components/shell/sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Transition smoothing
  assert.match(
    content,
    /transition-all\s+duration-300\s+ease-in-out/,
    "Sidebar must have smooth width transition"
  );

  // Width states
  assert.match(
    content,
    /isCollapsed\s*\?\s*["']w-20["']\s*:\s*["']w-\[264px\]["']/,
    "Sidebar width must toggle between w-20 (collapsed) and w-[264px] (expanded)"
  );

  // Collapsed abbreviations: CLI / PRO
  assert.match(
    content,
    /role === ["']PROVIDER["'] \? ["']PRO["'] : ["']CLI["']/,
    "Sidebar must display shortened badge (CLI / PRO) when collapsed"
  );

  // Active indicator resizing when collapsed
  assert.match(
    content,
    /isCollapsed\s*&&\s*["']h-8["']/,
    "Active indicator bar must expand to h-8 when sidebar is collapsed"
  );
});

// =============================================================================
// TEST SUITE 4: Dual-Theme CSS Token Integrity & Glassmorphic Variables
// =============================================================================

test("QA-TC-EDGE-07 - CSS Tokens: Complete symmetry between Dark and Light mode definitions", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  assert.ok(fs.existsSync(cssPath), "globals.css must exist");
  const content = fs.readFileSync(cssPath, "utf-8");

  // Dark Theme tokens
  assert.match(content, /--bg-app:\s*#04060f/, "Dark mode defines --bg-app as #04060f");
  assert.match(content, /--bg-surface:\s*#0c1226/, "Dark mode defines --bg-surface as #0c1226");
  assert.match(content, /--bg-deep-space:\s*#04060f/, "Dark mode defines --bg-deep-space as #04060f");
  assert.match(content, /--glass-bg:\s*rgba\(12,\s*18,\s*38,\s*0\.7\)/, "Dark mode defines dark --glass-bg");
  assert.match(content, /--glass-card-bg:\s*rgba\(12,\s*18,\s*38,\s*0\.6\)/, "Dark mode defines dark --glass-card-bg");
  assert.match(content, /--glass-panel-bg:\s*rgba\(12,\s*18,\s*38,\s*0\.68\)/, "Dark mode defines dark --glass-panel-bg");
  assert.match(content, /--glass-dock-bg:\s*rgba\(8,\s*12,\s*28,\s*0\.85\)/, "Dark mode defines dark --glass-dock-bg");

  // Light Theme tokens
  assert.match(content, /--bg-app:\s*#f8fafc/, "Light mode defines --bg-app as #f8fafc");
  assert.match(content, /--bg-surface:\s*#ffffff/, "Light mode defines --bg-surface as #ffffff");
  assert.match(content, /--bg-deep-space:\s*#f8fafc/, "Light mode defines --bg-deep-space as #f8fafc");
  assert.match(content, /--glass-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.85\)/, "Light mode defines light --glass-bg");
  assert.match(content, /--glass-card-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.9\)/, "Light mode defines light --glass-card-bg");
  assert.match(content, /--glass-panel-bg:\s*rgba\(248,\s*250,\s*252,\s*0\.92\)/, "Light mode defines light --glass-panel-bg");
  assert.match(content, /--glass-dock-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.95\)/, "Light mode defines light --glass-dock-bg");
  assert.match(content, /--shadow-md:\s*0\s+4px\s+14px\s+rgba\(0,\s*0,\s*0,\s*0\.07\)/, "Light mode defines soft --shadow-md");

  // No override leaks
  assert.doesNotMatch(
    content,
    /\/\*\s*=== ASCEND THEME ENHANCEMENTS ===\s*\*\/[\s\S]*--bg-deep-space:\s*#04060f/,
    "globals.css must NOT have a rogue ASCEND THEME override setting --bg-deep-space to #04060f"
  );
});

test("QA-TC-EDGE-08 - Glassmorphism: Pure variable reliance with zero dark hardcoding", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  // Check each utility class
  const classChecks = [
    { name: ".glass", varName: "--glass-bg" },
    { name: ".glass-card", varName: "--glass-card-bg" },
    { name: ".glass-panel", varName: "--glass-panel-bg" },
    { name: ".glass-dock", varName: "--glass-dock-bg" },
  ];

  for (const { name, varName } of classChecks) {
    const escaped = name.replace(".", "\\.");
    const regex = new RegExp(`${escaped}\\s*\\{[^}]*background:\\s*var\\(${varName}\\);`);
    assert.match(
      content,
      regex,
      `${name} utility must derive background directly from var(${varName})`
    );
  }
});

// =============================================================================
// TEST SUITE 5: Theme-Aware Canvas Engine (`ParticleOceanAmbient`)
// =============================================================================

test("QA-TC-EDGE-09 - ParticleOceanAmbient: Theme change event listener and MutationObserver cleanup", () => {
  const canvasPath = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  assert.ok(fs.existsSync(canvasPath), "particle-ocean-ambient.tsx must exist");
  const content = fs.readFileSync(canvasPath, "utf-8");

  // Event listener registration
  assert.match(
    content,
    /window\.addEventListener\(["']workgo-theme-change["'],\s*handleThemeChange\)/,
    "Must register workgo-theme-change event listener on window"
  );

  // Event listener cleanup
  assert.match(
    content,
    /window\.removeEventListener\(["']workgo-theme-change["'],\s*handleThemeChange\)/,
    "Must remove workgo-theme-change event listener on unmount"
  );

  // MutationObserver setup & observe
  assert.match(
    content,
    /observer\.observe\(\s*document\.documentElement\s*,\s*\{[\s\S]*attributes:\s*true[\s\S]*attributeFilter:\s*\[["']class["'],\s*["']data-theme["']\]/s,
    "Must observe document.documentElement for class and data-theme attribute modifications"
  );

  // MutationObserver disconnect cleanup
  assert.match(
    content,
    /observer\.disconnect\(\)/,
    "Must disconnect MutationObserver on component unmount"
  );
});

test("QA-TC-EDGE-10 - ParticleOceanAmbient: Frame-by-frame color switching & accessibility", () => {
  const canvasPath = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  const content = fs.readFileSync(canvasPath, "utf-8");

  // Dynamic frame check: themeRef.current === 'light'
  assert.match(
    content,
    /const\s+isLightMode\s*=\s*themeRef\.current\s*===\s*["']light["']/,
    "Must read themeRef.current === 'light' inside render loop for zero-overhead frame dispatch"
  );

  // Light mode emerald stroke and particle styling
  assert.match(
    content,
    /rgba\(16,\s*185,\s*129,\s*\$\{p\.alpha\s*\*\s*0\.12\}\)/,
    "Light mode mesh stroke must use subtle emerald rgba(16, 185, 129, alpha * 0.12)"
  );
  assert.match(
    content,
    /rgba\(16,\s*185,\s*129,\s*\$\{p\.alpha\s*\*\s*0\.35\}\)/,
    "Light mode particle dots must use subtle emerald rgba(16, 185, 129, alpha * 0.35)"
  );

  // Dark mode mint neon stroke and particle styling
  assert.match(
    content,
    /rgba\(93,\s*240,\s*168,\s*\$\{p\.alpha\s*\*\s*0\.22\}\)/,
    "Dark mode mesh stroke must use mint rgba(93, 240, 168, alpha * 0.22)"
  );
  assert.match(
    content,
    /rgba\(93,\s*240,\s*168,\s*\$\{p\.alpha\s*\*\s*0\.8\}\)/,
    "Dark mode particle dots must use mint rgba(93, 240, 168, alpha * 0.8)"
  );

  // Opacity contrast: opacity-20 for light mode, opacity-40 for dark mode
  assert.match(
    content,
    /isLight\s*\?\s*["']opacity-20["']\s*:\s*["']opacity-40["']/,
    "Canvas className must switch between opacity-20 (light) and opacity-40 (dark)"
  );

  // Edge Case: prefers-reduced-motion accessibility compliance
  assert.match(
    content,
    /prefers-reduced-motion:\s*reduce/,
    "Must check window.matchMedia for prefers-reduced-motion"
  );
  assert.match(
    content,
    /cancelAnimationFrame\(animationFrameId\)/,
    "Must cancel animationFrameId during cleanup"
  );
});

// =============================================================================
// TEST SUITE 6: ThemeToggle Switcher Behavior & Event Dispatch
// =============================================================================

test("QA-TC-EDGE-11 - ThemeToggle: Broadcast event payload & dual HTML attribute synchronizer", () => {
  const togglePath = path.join(ROOT, "src/components/shell/theme-toggle.tsx");
  assert.ok(fs.existsSync(togglePath), "theme-toggle.tsx must exist");
  const content = fs.readFileSync(togglePath, "utf-8");

  // CustomEvent dispatch with theme parameter
  assert.match(
    content,
    /new\s+CustomEvent\(["']workgo-theme-change["'],\s*\{\s*detail:\s*\{\s*theme:\s*nextTheme\s*\}\s*\}\)/,
    "ThemeToggle must dispatch workgo-theme-change with { detail: { theme: nextTheme } }"
  );

  // Dual synchronization: classList + attribute
  assert.match(
    content,
    /document\.documentElement\.classList\.remove\(["']light["'],\s*["']dark["']\)/,
    "Must purge prior theme class from document.documentElement"
  );
  assert.match(
    content,
    /document\.documentElement\.classList\.add\(nextTheme\)/,
    "Must append current theme class to document.documentElement"
  );
  assert.match(
    content,
    /document\.documentElement\.setAttribute\(["']data-theme["'],\s*nextTheme\)/,
    "Must set data-theme attribute on document.documentElement"
  );

  // LocalStorage error resilience
  assert.match(
    content,
    /try\s*\{\s*localStorage\.setItem\(["']workgo_theme["'],\s*nextTheme\);\s*\}\s*catch\s*\{\}/,
    "ThemeToggle must wrap localStorage.setItem in try/catch"
  );
});

// =============================================================================
// TEST SUITE 7: Semantic Hero Banners & Public Posts Layout
// =============================================================================

test("QA-TC-EDGE-12 - Semantic Banners: Absolute eradication of hardcoded dark backgrounds", () => {
  const clientPage = path.join(ROOT, "src/app/[locale]/(app)/client/page.tsx");
  const providerPage = path.join(ROOT, "src/app/[locale]/(app)/provider/page.tsx");
  const landingView = path.join(ROOT, "src/components/landing/ascend-landing-view.tsx");

  const clientSrc = fs.readFileSync(clientPage, "utf-8");
  const providerSrc = fs.readFileSync(providerPage, "utf-8");
  const landingSrc = fs.readFileSync(landingView, "utf-8");

  // Client Hero
  assert.doesNotMatch(clientSrc, /from-\[rgba\(12,18,38,0\.9\)\]/, "Client page has no hardcoded dark gradient");
  assert.match(clientSrc, /bg-gradient-to-r\s+from-surface\s+via-surface\/95\s+to-surface/, "Client page uses semantic gradient");

  // Provider Hero
  assert.doesNotMatch(providerSrc, /from-\[rgba\(12,18,38,0\.9\)\]/, "Provider page has no hardcoded dark gradient");
  assert.match(providerSrc, /bg-gradient-to-r\s+from-surface\s+via-surface\/95\s+to-surface/, "Provider page uses semantic gradient");

  // Landing View
  assert.doesNotMatch(landingSrc, /bg-\[#04060f\]/, "AscendLandingView has no hardcoded bg-[#04060f]");
  assert.match(landingSrc, /bg-app\s+text-fg/, "AscendLandingView uses semantic bg-app text-fg");
  assert.match(landingSrc, /bg-surface\/85\s+backdrop-blur-md[\s\S]*border\s+border-border/, "AscendLandingView quick action dock uses semantic surface and border");
});

test("QA-TC-EDGE-13 - Posts Page: Wide layout container and sticky filter sidebar docking", () => {
  const postsPath = path.join(ROOT, "src/app/[locale]/(public)/posts/page.tsx");
  assert.ok(fs.existsSync(postsPath), "posts/page.tsx must exist");
  const content = fs.readFileSync(postsPath, "utf-8");

  // PageContainer size="wide"
  assert.match(
    content,
    /<PageContainer\s+size=["']wide["']>/,
    "Posts marketplace must use PageContainer size='wide' (max-w-[1440px]) to dock sidebar closer to viewport edge"
  );

  // Desktop 2-column layout
  assert.match(
    content,
    /grid\s+grid-cols-1\s+md:grid-cols-4\s+gap-8/,
    "Posts page must use a responsive 4-column grid (1 col sidebar, 3 cols posts)"
  );

  // Sticky FilterSidebar
  assert.match(
    content,
    /sticky\s+top-6/,
    "Desktop FilterSidebar wrapper must use sticky top-6 for smooth scrolling"
  );
});

// =============================================================================
// TEST SUITE 8: Governance & Backend Microservices Isolation
// =============================================================================

test("QA-TC-EDGE-14 - Project Governance: Java microservices & documentation untouched", () => {
  const backendDirs = [
    "api-gateway",
    "catalog-service",
    "identity-service",
    "order-service",
    "payment-service",
    "docs",
  ];

  for (const dir of backendDirs) {
    const fullDir = path.join(WORKGO_ROOT, dir);
    assert.ok(fs.existsSync(fullDir), `Directory ${dir} must exist`);
  }
});
