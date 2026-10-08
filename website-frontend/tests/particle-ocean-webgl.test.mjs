import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// =============================================================================
// TEST SUITE: Complete Elimination of Animated Background Engines (Requirement B)
// =============================================================================

test("TC-01 - Animated Engines Removed: All WebGL and 2D canvas background files eliminated", () => {
  const d1 = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const d2 = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
  const d3 = path.join(ROOT, "src/components/effects/particle-ocean.tsx");
  const d4 = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  const d5 = path.join(ROOT, "src/app/[locale]/(public)/particle-ocean-demo/page.tsx");
  const d6 = path.join(ROOT, "public/particle-ocean/index.html");
  const d7 = path.join(ROOT, "public/landing/index.html");

  assert.ok(!fs.existsSync(d1), "particle-ocean-webgl.tsx must NOT exist");
  assert.ok(!fs.existsSync(d2), "particle-ocean-webgl.config.ts must NOT exist");
  assert.ok(!fs.existsSync(d3), "particle-ocean.tsx must NOT exist");
  assert.ok(!fs.existsSync(d4), "particle-ocean-ambient.tsx must NOT exist");
  assert.ok(!fs.existsSync(d5), "particle-ocean-demo/page.tsx must NOT exist");
  assert.ok(!fs.existsSync(d6), "public/particle-ocean/index.html must NOT exist");
  assert.ok(!fs.existsSync(d7), "public/landing/index.html must NOT exist");
});

test("TC-02 - Static Replacement: LandingStaticBackground exists and is integrated", () => {
  const staticBgPath = path.join(ROOT, "src/components/landing/landing-static-background.tsx");
  assert.ok(fs.existsSync(staticBgPath), "landing-static-background.tsx must exist");

  const landingPagePath = path.join(ROOT, "src/components/landing/workgo-landing-page.tsx");
  const landingPageSrc = fs.readFileSync(landingPagePath, "utf-8");
  assert.match(landingPageSrc, /<LandingStaticBackground\s*\/>/, "workgo-landing-page.tsx must render <LandingStaticBackground />");
  assert.ok(!landingPageSrc.includes("ParticleOceanWebGL"), "workgo-landing-page.tsx must not render ParticleOceanWebGL");
});

test("TC-03 - Package Dependencies: three and @types/three removed from package.json", () => {
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  assert.ok(!pkg.dependencies || !pkg.dependencies.three, "'three' must not be in dependencies");
  assert.ok(!pkg.devDependencies || !pkg.devDependencies["@types/three"], "'@types/three' must not be in devDependencies");
});

test("TC-04 - Hero Section Contract: particle-ocean-hero does not import or instantiate WebGL", () => {
  const heroPath = path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx");
  const heroSrc = fs.readFileSync(heroPath, "utf-8");

  assert.ok(!heroSrc.includes("particle-ocean-webgl"), "particle-ocean-hero.tsx must not import WebGL engine");
  assert.ok(!heroSrc.includes("<ParticleOceanWebGL"), "particle-ocean-hero.tsx must not render ParticleOceanWebGL");
  assert.match(heroSrc, /export function ParticleOceanHero/, "particle-ocean-hero must export component");
});

test("TC-05 - Auth Atmosphere Contract: auth-atmosphere uses CSS gradients with zero canvas", () => {
  const authAtmoPath = path.join(ROOT, "src/components/effects/auth-atmosphere.tsx");
  const authAtmoSrc = fs.readFileSync(authAtmoPath, "utf-8");

  assert.ok(!authAtmoSrc.includes("ParticleOcean"), "auth-atmosphere.tsx must not import or render ParticleOcean");
  assert.match(authAtmoSrc, /color-mix/, "auth-atmosphere.tsx must use theme-aware color-mix");
});

test("TC-06 - App Shell Contract: app-shell-client does not import or render ambient canvas", () => {
  const appShellPath = path.join(ROOT, "src/components/shell/app-shell-client.tsx");
  const appShellSrc = fs.readFileSync(appShellPath, "utf-8");

  assert.ok(!appShellSrc.includes("particle-ocean-ambient"), "app-shell-client.tsx must not import particle-ocean-ambient");
  assert.ok(!appShellSrc.includes("<ParticleOceanAmbient"), "app-shell-client.tsx must not render ParticleOceanAmbient");
});
