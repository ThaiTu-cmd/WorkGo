import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// =============================================================================
// TEST SUITE: Animated Background Video Workflow & Integration
// =============================================================================

test("TC-ANIM-01 - Assets: WebM, MP4, and static fallback assets exist in public/assets", () => {
  const assetsDir = path.join(ROOT, "public/assets");
  assert.ok(fs.existsSync(assetsDir), "public/assets directory must exist");

  const webmPath = path.join(assetsDir, "particle-ocean.webm");
  const mp4Path = path.join(assetsDir, "particle-ocean.mp4");
  const webpPath = path.join(assetsDir, "particle-ocean-fallback.webp");
  const jpgPath = path.join(assetsDir, "particle-ocean-fallback.jpg");

  assert.ok(fs.existsSync(webmPath), "particle-ocean.webm must exist");
  assert.ok(fs.existsSync(mp4Path), "particle-ocean.mp4 must exist");
  assert.ok(fs.existsSync(webpPath), "particle-ocean-fallback.webp must exist");
  assert.ok(fs.existsSync(jpgPath), "particle-ocean-fallback.jpg must exist");

  const webmStats = fs.statSync(webmPath);
  const mp4Stats = fs.statSync(mp4Path);
  const webpStats = fs.statSync(webpPath);

  // Performance budget checks
  assert.ok(webmStats.size > 100 * 1024, "WebM should have realistic payload > 100KB");
  assert.ok(webmStats.size < 3 * 1024 * 1024, "WebM should be optimized < 3MB");
  assert.ok(mp4Stats.size > 100 * 1024, "MP4 should have realistic payload > 100KB");
  assert.ok(mp4Stats.size < 5 * 1024 * 1024, "MP4 should be optimized < 5MB");
  assert.ok(webpStats.size < 600 * 1024, "Static fallback WebP should be lightweight < 600KB");
});

test("TC-ANIM-02 - Component Architecture: AnimatedBackground satisfies video contract", () => {
  const compPath = path.join(ROOT, "src/components/effects/animated-background.tsx");
  assert.ok(fs.existsSync(compPath), "animated-background.tsx must exist");
  const src = fs.readFileSync(compPath, "utf-8");

  // Client component
  assert.match(src, /"use client"/, "Must be a client component");

  // Export check
  assert.match(src, /export function AnimatedBackground/, "Must export AnimatedBackground component");

  // Video attributes: autoplay, muted, loop, playsInline, object-cover
  assert.match(src, /autoPlay/, "Video must have autoPlay attribute");
  assert.match(src, /muted/, "Video must have muted attribute");
  assert.match(src, /loop/, "Video must have loop attribute");
  assert.match(src, /playsInline/, "Video must have playsInline attribute");
  assert.match(src, /object-cover/, "Video must have object-cover class");

  // Source ordering: WebM preferred before MP4
  const webmIndex = src.indexOf('type="video/webm"');
  const mp4Index = src.indexOf('type="video/mp4"');
  assert.ok(webmIndex !== -1, "Must contain WebM source");
  assert.ok(mp4Index !== -1, "Must contain MP4 source");
  assert.ok(webmIndex < mp4Index, "WebM source must appear before MP4 fallback source");

  // Non-blocking interaction contract
  assert.match(src, /pointer-events-none/, "Must have pointer-events-none");
  assert.match(src, /-z-10/, "Must be positioned on background layer (-z-10)");
  assert.match(src, /aria-hidden="true"/, "Must have aria-hidden='true' for accessibility");
});

test("TC-ANIM-03 - Accessibility: prefers-reduced-motion triggers static background fallback", () => {
  const compPath = path.join(ROOT, "src/components/effects/animated-background.tsx");
  const src = fs.readFileSync(compPath, "utf-8");

  // Check reduced-motion detection
  assert.match(src, /prefers-reduced-motion:\s*reduce/, "Must detect prefers-reduced-motion media query");
  assert.match(src, /isReducedMotion/, "Must branch on isReducedMotion");
  assert.match(src, /poster=\{fallbackImageSrc\}/, "Video must provide poster fallback");
});

test("TC-ANIM-04 - Landing Page Integration: LandingStaticBackground embeds AnimatedBackground", () => {
  const landingBgPath = path.join(ROOT, "src/components/landing/landing-static-background.tsx");
  assert.ok(fs.existsSync(landingBgPath), "landing-static-background.tsx must exist");
  const src = fs.readFileSync(landingBgPath, "utf-8");

  assert.match(src, /import \{ AnimatedBackground \} from ["']@\/components\/effects\/animated-background["']/, "Must import AnimatedBackground");
  assert.match(src, /<AnimatedBackground/, "Must render AnimatedBackground");
  assert.match(src, /landing-static-cone/, "Must preserve landing-static-cone");
  assert.match(src, /landing-static-vignette/, "Must preserve landing-static-vignette");

  // Check workgo-landing-page.tsx still renders LandingStaticBackground
  const landingPagePath = path.join(ROOT, "src/components/landing/workgo-landing-page.tsx");
  const pageSrc = fs.readFileSync(landingPagePath, "utf-8");
  assert.match(pageSrc, /<LandingStaticBackground\s*\/>/, "WorkgoLandingPage must render LandingStaticBackground");
});

test("TC-ANIM-05 - Auth Pages Integration: AuthAtmosphere embeds AnimatedBackground for Login & Register", () => {
  const atmoPath = path.join(ROOT, "src/components/effects/auth-atmosphere.tsx");
  assert.ok(fs.existsSync(atmoPath), "auth-atmosphere.tsx must exist");
  const atmoSrc = fs.readFileSync(atmoPath, "utf-8");

  assert.match(atmoSrc, /import \{ AnimatedBackground \} from ["']\.\/animated-background["']/, "Must import AnimatedBackground");
  assert.match(atmoSrc, /<AnimatedBackground/, "Must render AnimatedBackground");
  assert.match(atmoSrc, /color-mix/, "Must retain color-mix radial light cones");

  // Check AuthShell wraps login and register routes
  const shellPath = path.join(ROOT, "src/components/shell/auth-shell.tsx");
  const shellSrc = fs.readFileSync(shellPath, "utf-8");
  assert.match(shellSrc, /<AuthAtmosphere intensity=["']subtle["'] \/>/, "AuthShell must render AuthAtmosphere subtle");

  const authLayoutPath = path.join(ROOT, "src/app/[locale]/(auth)/layout.tsx");
  const layoutSrc = fs.readFileSync(authLayoutPath, "utf-8");
  assert.match(layoutSrc, /<AuthShell locale=\{locale\}>\{children\}<\/AuthShell>/, "AuthLayout must wrap children in AuthShell");
});
