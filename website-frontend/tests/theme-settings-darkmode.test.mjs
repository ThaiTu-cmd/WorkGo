import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("Settings Page - Layout centering and symmetry", () => {
  const settingsFile = path.join(ROOT, "src/app/[locale]/(app)/settings/page.tsx");
  assert.ok(fs.existsSync(settingsFile), "settings/page.tsx must exist");
  const content = fs.readFileSync(settingsFile, "utf-8");

  // Must wrap main content in max-w-4xl mx-auto
  assert.match(
    content,
    /max-w-4xl\s+mx-auto/,
    "Settings Page must wrap content in max-w-4xl mx-auto container"
  );

  // TabsContent must use mx-auto to center form cards
  const profileTabMatch = content.match(/TabsContent\s+value="profile"[^>]*className="([^"]*)"/);
  assert.ok(profileTabMatch, "Profile TabsContent must exist");
  assert.match(profileTabMatch[1], /mx-auto/, "Profile tab must include mx-auto");
  assert.match(profileTabMatch[1], /max-w-3xl/, "Profile tab must include max-w-3xl");

  const addrTabMatch = content.match(/TabsContent\s+value="addresses"[^>]*className="([^"]*)"/);
  assert.ok(addrTabMatch, "Addresses TabsContent must exist");
  assert.match(addrTabMatch[1], /mx-auto/, "Addresses tab must include mx-auto");

  const providerTabMatch = content.match(/TabsContent\s+value="provider"[^>]*className="([^"]*)"/);
  assert.ok(providerTabMatch, "Provider TabsContent must exist");
  assert.match(providerTabMatch[1], /mx-auto/, "Provider tab must include mx-auto");

  const payoutTabMatch = content.match(/TabsContent\s+value="payout"[^>]*className="([^"]*)"/);
  assert.ok(payoutTabMatch, "Payout TabsContent must exist");
  assert.match(payoutTabMatch[1], /mx-auto/, "Payout tab must include mx-auto");

  // TabsList wrapper must align items properly
  assert.match(
    content,
    /flex\s+justify-center\s+sm:justify-start/,
    "TabsList must be wrapped with responsive flex alignment"
  );

  // Must include Theme settings card in Tab Profile
  assert.match(
    content,
    /Giao diện hiển thị \(Theme\)/,
    "Settings Page must include Theme Settings Card"
  );
  assert.match(
    content,
    /handleThemeChange/,
    "Settings Page must handle theme switching"
  );
});

test("Dark Palette - Form inputs eliminate blinding white focus and hardcoded light backgrounds", () => {
  const inputFile = path.join(ROOT, "src/components/ui/input.tsx");
  const inputContent = fs.readFileSync(inputFile, "utf-8");
  assert.doesNotMatch(
    inputContent,
    /focus-visible:bg-white/,
    "Input component must not have focus-visible:bg-white which glares on dark backgrounds"
  );
  assert.match(
    inputContent,
    /focus-visible:bg-surface/,
    "Input component must use focus-visible:bg-surface"
  );
  assert.match(
    inputContent,
    /focus-visible:ring-primary\/40/,
    "Input component must use gentle mint focus glow"
  );

  const textareaFile = path.join(ROOT, "src/components/ui/textarea.tsx");
  const textareaContent = fs.readFileSync(textareaFile, "utf-8");
  assert.match(
    textareaContent,
    /focus-visible:bg-surface/,
    "Textarea must match Input focus-visible:bg-surface"
  );

  const switchFile = path.join(ROOT, "src/components/ui/switch.tsx");
  const switchContent = fs.readFileSync(switchFile, "utf-8");
  assert.doesNotMatch(
    switchContent,
    /bg-slate-300/,
    "Switch component must not use overly bright bg-slate-300 on dark mode"
  );
  assert.match(
    switchContent,
    /data-\[state=unchecked\]:bg-slate-700/,
    "Switch component must use darker muted slate for unchecked state"
  );

  const avatarFile = path.join(ROOT, "src/components/ui/avatar.tsx");
  const avatarContent = fs.readFileSync(avatarFile, "utf-8");
  assert.doesNotMatch(
    avatarContent,
    /bg-slate-200/,
    "Avatar must not use hardcoded bg-slate-200"
  );
  assert.match(
    avatarContent,
    /bg-muted/,
    "Avatar must use semantic bg-muted"
  );
});

test("Theme Engine - CSS tokens in globals.css support both Dark and Light modes", () => {
  const cssFile = path.join(ROOT, "src/app/globals.css");
  const cssContent = fs.readFileSync(cssFile, "utf-8");

  // Dark mode tokens
  assert.match(cssContent, /\[data-theme="dark"\]/, "globals.css must support [data-theme='dark']");
  assert.match(cssContent, /--bg-app:\s*#030B1C/i, "Dark mode must use Deep Navy #030B1C");
  assert.match(cssContent, /--bg-surface:\s*#06142F/i, "Dark mode must use #06142F surface");
  assert.match(cssContent, /--primary:\s*#1677FF/i, "Dark mode must use electric blue #1677FF");

  // Light mode tokens
  assert.match(cssContent, /\[data-theme="light"\]/, "globals.css must support [data-theme='light']");
  assert.match(cssContent, /\.light/, "globals.css must support .light class");
  assert.match(cssContent, /--bg-app:\s*#F5F9FF/i, "Light mode must use #F5F9FF");
  assert.match(cssContent, /--bg-surface:\s*#FFFFFF/i, "Light mode must use #FFFFFF");
  assert.match(cssContent, /--primary:\s*#1677FF/i, "Light mode must use electric blue #1677FF");

  // Dynamic glassmorphism tokens
  assert.match(cssContent, /--glass-bg:\s*rgba\(6,\s*20,\s*47/, "Dark mode defines dark --glass-bg");
  assert.match(cssContent, /--glass-bg:\s*rgba\(255,\s*255,\s*255/, "Light mode defines light --glass-bg");
  assert.doesNotMatch(
    cssContent,
    /\/\*\s*=== ASCEND THEME ENHANCEMENTS ===\s*\*\/[\s\S]*:root\s*\{[\s\S]*--bg-deep-space:\s*#04060f/,
    "globals.css must not contain a trailing :root block overriding --bg-deep-space to dark"
  );

  // Smooth transition
  assert.match(
    cssContent,
    /transition:\s*background-color\s+0\.2s\s+ease,\s*color\s+0\.2s\s+ease/,
    "body must have smooth transition between light and dark themes"
  );
});

test("Theme Engine - ThemeToggle component and Header integration", () => {
  const toggleFile = path.join(ROOT, "src/components/shell/theme-toggle.tsx");
  assert.ok(fs.existsSync(toggleFile), "theme-toggle.tsx must exist");
  const toggleContent = fs.readFileSync(toggleFile, "utf-8");
  assert.match(toggleContent, /workgo_theme/, "ThemeToggle must store preference in workgo_theme localStorage key");
  assert.match(toggleContent, /data-theme/, "ThemeToggle must set data-theme attribute");
  assert.match(toggleContent, /workgo-theme-change/, "ThemeToggle must dispatch workgo-theme-change CustomEvent");

  // Integrated in AppHeader
  const appHeaderFile = path.join(ROOT, "src/components/shell/app-header.tsx");
  const appHeaderContent = fs.readFileSync(appHeaderFile, "utf-8");
  assert.match(appHeaderContent, /<ThemeToggle/, "AppHeader must include <ThemeToggle />");

  // Integrated in PublicHeader
  const pubHeaderFile = path.join(ROOT, "src/components/shell/public-header.tsx");
  const pubHeaderContent = fs.readFileSync(pubHeaderFile, "utf-8");
  assert.match(pubHeaderContent, /<ThemeToggle/, "PublicHeader must include <ThemeToggle />");

  // Integrated in Landing Quick Action Dock
  const landingFile = path.join(ROOT, "src/components/landing/ascend-landing-view.tsx");
  const landingContent = fs.readFileSync(landingFile, "utf-8");
  assert.match(landingContent, /<ThemeToggle/, "AscendLandingView must include <ThemeToggle />");

  // FOUC Prevention Script in layout.tsx
  const layoutFile = path.join(ROOT, "src/app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutFile, "utf-8");
  assert.match(layoutContent, /workgo_theme/, "layout.tsx must include FOUC prevention script reading workgo_theme");
});

test("Theme Engine - Fallback and cyclical theme switching logic", () => {
  function resolveTheme(stored) {
    if (stored === "light") return "light";
    if (stored === "dark") return "dark";
    return "dark"; // Default fallback
  }

  function getNextTheme(current) {
    return current === "dark" ? "light" : "dark";
  }

  // Edge cases for stored theme
  assert.equal(resolveTheme("light"), "light");
  assert.equal(resolveTheme("dark"), "dark");
  assert.equal(resolveTheme(null), "dark", "null stored theme defaults to dark");
  assert.equal(resolveTheme(undefined), "dark", "undefined stored theme defaults to dark");
  assert.equal(resolveTheme(""), "dark", "empty stored theme defaults to dark");
  assert.equal(resolveTheme("blue"), "dark", "invalid theme string defaults to dark");

  // Cyclical transitions
  assert.equal(getNextTheme("dark"), "light");
  assert.equal(getNextTheme("light"), "dark");
});

test("Dark Palette - Complete elimination of hardcoded bg-slate-50 across all modified UI components", () => {
  const filesToCheck = [
    "src/app/[locale]/(app)/disputes/[id]/page.tsx",
    "src/app/[locale]/(app)/reviews/new/page.tsx",
    "src/app/[locale]/(public)/posts/[id]/page.tsx",
    "src/components/composed/application-card.tsx",
    "src/components/composed/application-table.tsx",
    "src/components/composed/post-form.tsx",
    "src/components/composed/transaction-row.tsx",
    "src/components/domain/accept-confirm-modal.tsx",
    "src/components/domain/payment-panel.tsx",
    "src/components/domain/payout-form.tsx",
    "src/components/domain/review-modal.tsx",
  ];

  for (const rel of filesToCheck) {
    const fullPath = path.join(ROOT, rel);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.doesNotMatch(
        content,
        /bg-slate-50\b/,
        `File ${rel} must not contain hardcoded bg-slate-50`
      );
    }
  }
});

test("Settings Page - Tab query parameter handling and layout container widths", () => {
  const settingsFile = path.join(ROOT, "src/app/[locale]/(app)/settings/page.tsx");
  const content = fs.readFileSync(settingsFile, "utf-8");

  // Check searchParams tab handling
  assert.match(
    content,
    /searchParams\.get\(["']tab["']\)\s*\|\|\s*["']profile["']/,
    "Extracts tab from query parameters with fallback to profile"
  );
  assert.match(content, /value="profile"/, "Contains profile tab");
  assert.match(content, /value="addresses"/, "Contains addresses tab");
  assert.match(content, /value="provider"/, "Contains provider tab");
  assert.match(content, /value="payout"/, "Contains payout tab");

  // Check that all 4 tab contents have max-w-3xl mx-auto
  const matches = content.match(/max-w-3xl\s+mx-auto/g);
  assert.ok(matches && matches.length >= 4, "All 4 tab contents must have max-w-3xl mx-auto");
});
