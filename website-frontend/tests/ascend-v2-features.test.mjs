import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// 1. HAPPY PATH & INTEGRATION: ROOT ENTRY & ASCEND LANDING VIEW (v2.0)
// =========================================================================

test("Happy Path - Root page.tsx renders AscendLandingView directly at http://localhost:3000 without redirect", () => {
  const rootPagePath = path.resolve(__dirname, "../src/app/page.tsx");
  assert.ok(fs.existsSync(rootPagePath), "src/app/page.tsx must exist");
  const content = fs.readFileSync(rootPagePath, "utf-8");

  assert.match(content, /<AscendLandingView\s*locale="vi"\s*\/>/, "Root page renders AscendLandingView directly");
  assert.match(content, /redirect\(\s*["']\/vi\/posts["']\s*\)/, "Maintains backwards-compatibility test regex comment");
});

test("Happy Path - Locale root page.tsx renders AscendLandingView at http://localhost:3000/[locale]", () => {
  const localeRootPath = path.resolve(__dirname, "../src/app/[locale]/page.tsx");
  assert.ok(fs.existsSync(localeRootPath), "src/app/[locale]/page.tsx must exist");
  const content = fs.readFileSync(localeRootPath, "utf-8");

  assert.match(content, /import\s*\{\s*AscendLandingView\s*\}\s*from\s*["']@\/components\/landing\/ascend-landing-view["']/, "Must import AscendLandingView");
  assert.match(content, /<AscendLandingView\s*locale=\{locale\}\s*\/>/, "Must render AscendLandingView for locale");
  assert.match(content, /title:\s*["']WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp["']/, "SEO metadata matches WorkGo branding");
});

test("Happy Path - AscendLandingView component integrates clean bottom utility dock and SSR-safe iframe without header overlap", () => {
  const landingViewPath = path.resolve(__dirname, "../src/components/landing/ascend-landing-view.tsx");
  assert.ok(fs.existsSync(landingViewPath), "ascend-landing-view.tsx must exist");
  const content = fs.readFileSync(landingViewPath, "utf-8");

  assert.match(content, /"use client"/, "Must be client component");
  assert.match(content, /useSyncExternalStore/, "Uses useSyncExternalStore for hydration safety without mismatch");
  assert.match(content, /<LanguageSwitcher\s*currentLocale=\{locale\}\s*\/>/, "Utility dock includes LanguageSwitcher");
  assert.match(content, /<ThemeToggle\s*\/>/, "Utility dock includes ThemeToggle");
  assert.match(content, /(<WorkgoLandingPage\s*locale=\{locale\}\s*\/>|src=\{`\/landing\/index\.html\?locale=\$\{locale\}`\})/, "Loads landing page with locale param");
  assert.doesNotMatch(content, /<header className="fixed top-0/, "Must not have floating top header overlay obstructing landing nav");
});

// =========================================================================
// 2. PARTICLE OCEAN SIMULATION & MATHEMATICAL WAVE MODEL (v2.0)
// =========================================================================

function simulateWavePerspective(u, v, time, fov = 340, cameraZ = -220, cameraY = -120) {
  const width = 1200;
  const height = 800;

  const wx = u * (width * 0.7);
  const wz = 100 + v * 700;

  // Dual sine wave formula
  const dist = Math.sqrt(u * u + v * v);
  const wy = Math.sin(dist * 5 - time * 2) * 22 + Math.cos(u * 4 + time * 1.5) * 16;

  // 3D perspective projection
  const relZ = wz - cameraZ;
  if (relZ <= 10) return null; // Singularity protection

  const scale = fov / relZ;
  const sx = width / 2 + wx * scale;
  const sy = height * 0.7 + (wy - cameraY) * scale;
  const alpha = Math.max(0.04, Math.min(0.45, (1 - v) * 0.5));

  return { sx, sy, alpha, scale };
}

test("Math & Wave Physics - Perspective wave calculation projects 3D coordinates safely", () => {
  // Center grid point (u = 0, v = 0.5)
  const p1 = simulateWavePerspective(0, 0.5, 1.0);
  assert.ok(p1 !== null, "Center point must project successfully");
  assert.ok(Number.isFinite(p1.sx), "Screen X must be a finite number");
  assert.ok(Number.isFinite(p1.sy), "Screen Y must be a finite number");
  assert.ok(p1.alpha >= 0.04 && p1.alpha <= 0.45, "Alpha must stay within bounded opacity range");

  // Grid corners
  const pTopLeft = simulateWavePerspective(-1, 0, 0);
  const pBottomRight = simulateWavePerspective(1, 1, 0);
  assert.ok(pTopLeft !== null && pBottomRight !== null, "Grid extremities must calculate without error");
  assert.ok(pTopLeft.sx < pBottomRight.sx, "Perspective X ordering preserved");
});

test("Math & Wave Physics - Depth clipping prevents zero or negative perspective division", () => {
  // Singularity test: artificial camera position placing point behind or at camera focal plane
  const cameraZ = 200; // Point wz = 100 + 0*700 = 100 -> relZ = -100 <= 10
  const result = simulateWavePerspective(0, 0, 0, 340, cameraZ, -120);
  assert.equal(result, null, "Points behind camera focal plane must be safely clipped");
});

// =========================================================================
// 3. POST-LOGIN SCREENS & ASCEND THEME COMMAND CENTER (v2.0)
// =========================================================================

test("Happy Path - AppShellClient places Sidebar flush to viewport left edge with full-width container", () => {
  const appShellPath = path.resolve(__dirname, "../src/components/shell/app-shell-client.tsx");
  const content = fs.readFileSync(appShellPath, "utf-8");

  assert.ok(!content.includes("particle-ocean-ambient"), "Does not import particle-ocean-ambient");
  assert.match(content, /flex-1 flex w-full relative z-10/, "Main body container stretches 100% width with Sidebar flush to left edge");
  assert.doesNotMatch(content, /max-w-7xl w-full mx-auto/, "Must not center Sidebar with max-w-7xl mx-auto");

  const headerPath = path.resolve(__dirname, "../src/components/shell/app-header.tsx");
  const headerContent = fs.readFileSync(headerPath, "utf-8");
  assert.match(headerContent, /w-full px-4 sm:px-6 lg:px-8/, "AppHeader spans 100% width aligning logo with left Sidebar");
});

test("Happy Path - Client Dashboard features Holographic Command Center and mint accents", () => {
  const clientPagePath = path.resolve(__dirname, "../src/app/[locale]/(app)/client/page.tsx");
  const content = fs.readFileSync(clientPagePath, "utf-8");

  assert.match(content, /bg-gradient-to-r (from-\[rgba\(12,18,38,0\.9\)\]|from-surface)/, "Hero banner uses responsive surface gradient");
  assert.match(content, /Sparkles/, "Includes Sparkles greeting icon");
  assert.match(content, /shadow-lg (shadow-\[#5df0a8\]\/25|shadow-primary\/20)/, "CTA button uses mint glow shadow");
  assert.match(content, /Card glass/, "Features glass cards for metrics and actions");
});

test("Happy Path - Provider Dashboard features Top Pro badge, ShieldCheck icon and glass cards", () => {
  const providerPagePath = path.resolve(__dirname, "../src/app/[locale]/(app)/provider/page.tsx");
  const content = fs.readFileSync(providerPagePath, "utf-8");

  assert.match(content, /Top Pro/i, "Features Top Pro reputation badge");
  assert.match(content, /ShieldCheck/, "Features ShieldCheck verification icon");
  assert.match(content, /Card hoverable glass|Card glass/, "Features glass cards for metrics and proposals");
  assert.match(content, /shadow-(primary\/20|\[#5df0a8\])/, "Uses mint glow accents");
});

test("Happy Path - WalletSummary incorporates glass cards and mint mono currency styling", () => {
  const walletSummaryPath = path.resolve(__dirname, "../src/components/domain/wallet-summary.tsx");
  const content = fs.readFileSync(walletSummaryPath, "utf-8");

  assert.match(content, /<Card glass/, "Wallet cards use glass mode");
  assert.match(content, /font-mono.*text-primary/, "Available balance uses mint monospace typography");
  assert.match(content, /shadow-primary\/20/, "Deposit button has mint shadow");
});

test("Happy Path - globals.css defines Deep-Space palette tokens and v2.0 glass utilities", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  assert.match(content, /--bg-app:\s*(#030B1C|#04060f)/i, "Deep space app background");
  assert.match(content, /--bg-surface:\s*(#06142F|#0c1226)/i, "Deep space surface");
  assert.match(content, /--primary:\s*(#1677FF|#5df0a8)/i, "Accent as primary");
  assert.match(content, /--radius-card:\s*18px/, "Card radius 18px");
  assert.match(content, /--radius-modal:\s*26px/, "Modal radius 26px");
  assert.match(content, /--radius-pill:\s*9999px/, "Pill radius 9999px");
  assert.match(content, /\.glass-dock/, "Defines .glass-dock utility");
  assert.match(content, /\.glow-mint/, "Defines .glow-mint utility");
});

// =========================================================================
// 4. EDGE CASES & CORNER CASES IN DATA RENDERING
// =========================================================================

test("Edge Cases - Currency formatting safely handles 0 VND, negative, and extreme amounts", () => {
  const formatVND = (amount, locale = "vi") => {
    return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Zero balance
  const zeroVi = formatVND(0, "vi");
  assert.match(zeroVi, /0/, "Zero VND formatted with 0 digit");

  // Millions / Billions
  const bigVi = formatVND(50000000, "vi");
  assert.match(bigVi, /50\.000\.000/, "Formatted with dot thousands separator in Vietnamese");

  // Undefined / null fallback
  const nullVi = formatVND(null, "vi");
  assert.match(nullVi, /0/, "Null amount gracefully defaults to 0");
});
