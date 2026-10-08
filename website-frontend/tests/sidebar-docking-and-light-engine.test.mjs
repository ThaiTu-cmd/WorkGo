import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("QA-TC-01 - Modular Separation: AppContentArea exists separately and is imported in AppShellClient", () => {
  const contentAreaFile = path.join(ROOT, "src/components/shell/app-content-area.tsx");
  assert.ok(fs.existsSync(contentAreaFile), "app-content-area.tsx must exist as a dedicated component file");
  const contentAreaSource = fs.readFileSync(contentAreaFile, "utf-8");

  assert.match(
    contentAreaSource,
    /export\s+function\s+AppContentArea/,
    "app-content-area.tsx must export AppContentArea component"
  );
  assert.match(
    contentAreaSource,
    /<main[^>]*className=/,
    "AppContentArea must render semantic <main> tag with styling"
  );

  const shellFile = path.join(ROOT, "src/components/shell/app-shell-client.tsx");
  const shellSource = fs.readFileSync(shellFile, "utf-8");

  assert.match(
    shellSource,
    /import\s+\{\s*AppContentArea\s*\}\s*from\s+["']\.\/app-content-area["']/,
    "app-shell-client.tsx must import AppContentArea"
  );
  assert.match(
    shellSource,
    /<AppContentArea>\{children\}<\/AppContentArea>/,
    "app-shell-client.tsx must wrap page children in <AppContentArea>"
  );
  assert.doesNotMatch(
    shellSource,
    /<main\b[^>]*>\{children\}<\/main>/,
    "app-shell-client.tsx must not contain inline monolithic <main>{children}</main>"
  );
});

test("QA-TC-02 - Zero-Scroll Sidebar: Docked flush-to-edge (m-0, left-0) and locked viewport height", () => {
  const sidebarFile = path.join(ROOT, "src/components/shell/sidebar.tsx");
  assert.ok(fs.existsSync(sidebarFile), "sidebar.tsx must exist");
  const sidebarSource = fs.readFileSync(sidebarFile, "utf-8");

  // Aside styling checks
  assert.match(
    sidebarSource,
    /h-\[calc\(100vh-4rem\)\]/,
    "Sidebar must have locked height h-[calc(100vh-4rem)] matching viewport minus header"
  );
  assert.match(
    sidebarSource,
    /overflow-y-auto/,
    "Sidebar must manage internal scroll if menu items exceed height"
  );
  assert.match(
    sidebarSource,
    /overflow-x-hidden/,
    "Sidebar must suppress horizontal overflow"
  );
  assert.match(
    sidebarSource,
    /m-0\s+left-0/,
    "Sidebar must be docked flush to the screen edge with m-0 left-0"
  );
  assert.match(
    sidebarSource,
    /shrink-0/,
    "Sidebar must not shrink under Flexbox layout"
  );
});

test("QA-TC-03 - Independent Content Scroll: AppContentArea scrolls independently with locked outer shell", () => {
  const shellFile = path.join(ROOT, "src/components/shell/app-shell-client.tsx");
  const shellSource = fs.readFileSync(shellFile, "utf-8");

  // Outer shell container must lock viewport window scrolling
  assert.match(
    shellSource,
    /h-screen\s+max-h-screen\s+overflow-hidden/,
    "AppShellClient container must be locked with h-screen max-h-screen overflow-hidden"
  );

  const contentAreaFile = path.join(ROOT, "src/components/shell/app-content-area.tsx");
  const contentAreaSource = fs.readFileSync(contentAreaFile, "utf-8");

  // Content area must scroll independently
  assert.match(
    contentAreaSource,
    /h-\[calc\(100vh-4rem\)\]/,
    "AppContentArea must have fixed height h-[calc(100vh-4rem)]"
  );
  assert.match(
    contentAreaSource,
    /overflow-y-auto/,
    "AppContentArea must have overflow-y-auto for independent scrolling"
  );
  assert.match(
    contentAreaSource,
    /min-w-0/,
    "AppContentArea must have min-w-0 to prevent flexbox child overflow"
  );
  assert.match(
    contentAreaSource,
    /flex-1/,
    "AppContentArea must fill remaining horizontal space with flex-1"
  );
});

test("QA-TC-05 - Dynamic Glassmorphism: CSS classes adapt to light and dark theme variables", () => {
  const cssFile = path.join(ROOT, "src/app/globals.css");
  const cssSource = fs.readFileSync(cssFile, "utf-8");

  // Glass classes must use CSS variables
  assert.match(
    cssSource,
    /\.glass\s*\{\s*background:\s*var\(--glass-bg\);/s,
    ".glass utility class must use var(--glass-bg)"
  );
  assert.match(
    cssSource,
    /\.glass-card\s*\{\s*background:\s*var\(--glass-card-bg\);/s,
    ".glass-card utility class must use var(--glass-card-bg)"
  );
  assert.match(
    cssSource,
    /\.glass-panel\s*\{\s*background:\s*var\(--glass-panel-bg\);/s,
    ".glass-panel utility class must use var(--glass-panel-bg)"
  );
  assert.match(
    cssSource,
    /\.glass-dock\s*\{\s*background:\s*var\(--glass-dock-bg\);/s,
    ".glass-dock utility class must use var(--glass-dock-bg)"
  );

  // Border must use dynamic variable
  assert.match(
    cssSource,
    /border:\s*1px\s+solid\s+var\(--glass-border\);/,
    "Glass utilities must use var(--glass-border)"
  );

  // No hardcoded dark glass backgrounds in glass utilities
  const glassUtilityBlock = cssSource.slice(cssSource.indexOf("/* Glassmorphism utilities */"));
  assert.doesNotMatch(
    glassUtilityBlock,
    /\.glass\s*\{[^}]*background:\s*rgba\(12,\s*18,\s*38/,
    ".glass must not hardcode dark background rgba(12, 18, 38, ...)"
  );
  assert.doesNotMatch(
    glassUtilityBlock,
    /\.glass-card\s*\{[^}]*background:\s*rgba\(12,\s*18,\s*38/,
    ".glass-card must not hardcode dark background rgba(12, 18, 38, ...)"
  );
});

test("QA-TC-06 - Background Canvas: ParticleOceanAmbient is theme-aware and responds to events", () => {
  const canvasFile = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  assert.ok(fs.existsSync(canvasFile), "particle-ocean-ambient.tsx must exist");
  const canvasSource = fs.readFileSync(canvasFile, "utf-8");

  // Must listen to workgo-theme-change event
  assert.match(
    canvasSource,
    /workgo-theme-change/,
    "ParticleOceanAmbient must listen to workgo-theme-change event"
  );

  // Must use MutationObserver for runtime DOM class synchronization
  assert.match(
    canvasSource,
    /MutationObserver/,
    "ParticleOceanAmbient must use MutationObserver to detect theme attribute changes"
  );

  // Must adapt wave/particle stroke and fill colors for light mode
  assert.match(
    canvasSource,
    /rgba\(16,\s*185,\s*129/,
    "ParticleOceanAmbient must support light mode emerald palette rgba(16, 185, 129, ...)"
  );

  // Must reduce canvas opacity on light mode
  assert.match(
    canvasSource,
    /opacity-20/,
    "ParticleOceanAmbient must reduce opacity to opacity-20 in light mode"
  );
});

test("QA-TC-08 - Semantic Banners: Client, Provider, and Landing view eliminate hardcoded dark colors", () => {
  const clientPage = path.join(ROOT, "src/app/[locale]/(app)/client/page.tsx");
  const clientSource = fs.readFileSync(clientPage, "utf-8");
  assert.doesNotMatch(
    clientSource,
    /from-\[rgba\(12,18,38,0\.9\)\]/,
    "Client page must not contain hardcoded dark gradient from-[rgba(12,18,38,0.9)]"
  );
  assert.match(
    clientSource,
    /from-surface\s+via-surface\/95\s+to-surface/,
    "Client page must use semantic surface gradient"
  );

  const providerPage = path.join(ROOT, "src/app/[locale]/(app)/provider/page.tsx");
  const providerSource = fs.readFileSync(providerPage, "utf-8");
  assert.doesNotMatch(
    providerSource,
    /from-\[rgba\(12,18,38,0\.9\)\]/,
    "Provider page must not contain hardcoded dark gradient from-[rgba(12,18,38,0.9)]"
  );
  assert.match(
    providerSource,
    /from-surface\s+via-surface\/95\s+to-surface/,
    "Provider page must use semantic surface gradient"
  );

  const landingView = path.join(ROOT, "src/components/landing/ascend-landing-view.tsx");
  const landingSource = fs.readFileSync(landingView, "utf-8");
  assert.doesNotMatch(
    landingSource,
    /bg-\[#04060f\]/,
    "AscendLandingView must not hardcode bg-[#04060f]"
  );
  assert.match(
    landingSource,
    /bg-app\s+text-fg/,
    "AscendLandingView must use semantic bg-app text-fg"
  );
});
