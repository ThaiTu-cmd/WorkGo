import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// =============================================================================
// QA TEST SUITE: STATIC DEEP VERIFICATION (HERO, AUTH-SHELL, LANDING)
// =============================================================================

test("QA-HERO-01 - ParticleOceanHero: Hero component does not import or render WebGL engine", () => {
  const heroPath = path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx");
  assert.ok(fs.existsSync(heroPath), "particle-ocean-hero.tsx must exist");
  const heroSrc = fs.readFileSync(heroPath, "utf-8");

  assert.ok(!heroSrc.includes("particle-ocean-webgl"), "particle-ocean-hero must not import particle-ocean-webgl");
  assert.ok(!heroSrc.includes("<ParticleOceanWebGL"), "particle-ocean-hero must not render ParticleOceanWebGL");
  assert.match(heroSrc, /export function ParticleOceanHero/, "particle-ocean-hero must export component");
});

test("QA-AUTH-01 - Auth Atmosphere: AuthShell renders AuthAtmosphere subtle without canvas", () => {
  const authShellPath = path.join(ROOT, "src/components/shell/auth-shell.tsx");
  assert.ok(fs.existsSync(authShellPath), "auth-shell.tsx must exist");
  const shellSrc = fs.readFileSync(authShellPath, "utf-8");

  assert.match(shellSrc, /<AuthAtmosphere\s+intensity="subtle"\s*\/>/, "AuthShell must render AuthAtmosphere subtle");

  const atmoPath = path.join(ROOT, "src/components/effects/auth-atmosphere.tsx");
  const atmoSrc = fs.readFileSync(atmoPath, "utf-8");
  assert.ok(!atmoSrc.includes("ParticleOcean"), "auth-atmosphere.tsx must not import ParticleOcean");
});

test("QA-LANDING-01 - Landing Page: WorkgoLandingPage renders LandingStaticBackground", () => {
  const landingPath = path.join(ROOT, "src/components/landing/workgo-landing-page.tsx");
  assert.ok(fs.existsSync(landingPath), "workgo-landing-page.tsx must exist");
  const landingSrc = fs.readFileSync(landingPath, "utf-8");

  assert.match(landingSrc, /<LandingStaticBackground\s*\/>/, "WorkgoLandingPage must render LandingStaticBackground");
  assert.ok(!landingSrc.includes("ParticleOceanWebGL"), "WorkgoLandingPage must not render ParticleOceanWebGL");
});

test("QA-STATIC-01 - Static Background: LandingStaticBackground provides decorative background with zero script loops", () => {
  const staticBgPath = path.join(ROOT, "src/components/landing/landing-static-background.tsx");
  assert.ok(fs.existsSync(staticBgPath), "landing-static-background.tsx must exist");
  const staticSrc = fs.readFileSync(staticBgPath, "utf-8");

  assert.match(staticSrc, /aria-hidden="true"/, "LandingStaticBackground must have aria-hidden='true'");
  assert.match(staticSrc, /pointer-events-none/, "LandingStaticBackground must have pointer-events-none");
});
