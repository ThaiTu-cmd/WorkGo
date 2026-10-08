import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// =============================================================================
// TEST SUITE: WorkGo Visual System Redesign & Static Modernization (PLAN.md M12)
// =============================================================================

test("TC-01 - Landing Page Architecture: workgo-landing-page uses LandingStaticBackground and zero canvas/WebGL", () => {
  const landingPagePath = path.join(ROOT, "src/components/landing/workgo-landing-page.tsx");
  assert.ok(fs.existsSync(landingPagePath), "workgo-landing-page.tsx must exist");
  const src = fs.readFileSync(landingPagePath, "utf-8");

  assert.match(src, /<LandingStaticBackground\s*\/>/, "Must render <LandingStaticBackground />");
  assert.ok(!src.includes("ParticleOceanWebGL"), "Must not import or render ParticleOceanWebGL");
  assert.ok(!src.includes("from 'three'") && !src.includes('from "three"'), "Must not import three");
  assert.ok(!src.includes("<canvas"), "Must not contain canvas");
  assert.ok(!src.includes("<iframe"), "Must not contain iframe");
});

test("TC-02 - Theme-Aware Landing: navbar and sections eliminate hardcoded dark navy hex values", () => {
  const heroPath = path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx");
  const heroSrc = fs.readFileSync(heroPath, "utf-8");
  assert.ok(!heroSrc.includes("particle-ocean-webgl"), "particle-ocean-hero must not import webgl");

  const navbarPath = path.join(ROOT, "src/components/landing/workgo-navbar.tsx");
  const navSrc = fs.readFileSync(navbarPath, "utf-8");
  assert.match(navSrc, /bg-surface\/80/, "Navbar must use semantic bg-surface/80");
  assert.match(navSrc, /border-border/, "Navbar must use semantic border-border");
  assert.ok(!navSrc.includes("#030B1C"), "Navbar must not contain hardcoded #030B1C");
  assert.ok(!navSrc.includes("#06142F"), "Navbar must not contain hardcoded #06142F");

  const sectionsPath = path.join(ROOT, "src/components/landing/workgo-landing-sections.tsx");
  const sectionsSrc = fs.readFileSync(sectionsPath, "utf-8");
  assert.match(sectionsSrc, /bg-app/, "Sections container must use bg-app");
  assert.match(sectionsSrc, /scroll-mt-20/, "Sections must include scroll-mt-20");
  assert.ok(!sectionsSrc.includes("#020713"), "Sections footer must not contain hardcoded #020713");
});

test("TC-03 - CSS Architecture: globals.css contains smooth scroll, pressable, and static cone", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(css, /scroll-behavior:\s*smooth/, "globals.css must specify smooth scroll");
  assert.match(css, /\.pressable/, "globals.css must define .pressable utility");
  assert.match(css, /\.landing-static-cone/, "globals.css must define .landing-static-cone");

  assert.ok(!css.includes(".particle-ocean-root canvas"), "Must not contain .particle-ocean-root canvas");
  assert.ok(!css.includes(".planet-canvas"), "Must not contain .planet-canvas");
  assert.ok(!css.includes(".ocean-canvas"), "Must not contain .ocean-canvas");
});

test("TC-04 - Theme Sync: theme-toggle synchronizes across instances via events and MutationObserver", () => {
  const togglePath = path.join(ROOT, "src/components/shell/theme-toggle.tsx");
  const toggleSrc = fs.readFileSync(togglePath, "utf-8");

  assert.match(toggleSrc, /workgo-theme-change/, "theme-toggle must listen for workgo-theme-change");
  assert.match(toggleSrc, /MutationObserver/, "theme-toggle must instantiate MutationObserver for DOM sync");
});

test("TC-05 - Press Physics: button.tsx implements cubic-bezier spring and active scale", () => {
  const buttonPath = path.join(ROOT, "src/components/ui/button.tsx");
  const buttonSrc = fs.readFileSync(buttonPath, "utf-8");

  assert.match(buttonSrc, /active:scale-\[0\.94\]/, "button must have active:scale-[0.94]");
  assert.match(buttonSrc, /cubic-bezier\(0\.34,\s*1\.56,\s*0\.64,\s*1\)/, "button must have cubic-bezier spring easing");
});

test("TC-06 - Clean Shells: auth-atmosphere and app-shell-client contain zero canvas", () => {
  const authAtmoPath = path.join(ROOT, "src/components/effects/auth-atmosphere.tsx");
  const authAtmoSrc = fs.readFileSync(authAtmoPath, "utf-8");
  assert.ok(!authAtmoSrc.includes("ParticleOcean"), "auth-atmosphere must not import ParticleOcean");

  const appShellPath = path.join(ROOT, "src/components/shell/app-shell-client.tsx");
  const appShellSrc = fs.readFileSync(appShellPath, "utf-8");
  assert.ok(!appShellSrc.includes("particle-ocean-ambient"), "app-shell-client must not import particle-ocean-ambient");
});

test("TC-07 - Deliverables Removal: D1 through D7 do not exist and three package uninstalled", () => {
  const d1 = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const d2 = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
  const d3 = path.join(ROOT, "src/components/effects/particle-ocean.tsx");
  const d4 = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  const d5 = path.join(ROOT, "src/app/[locale]/(public)/particle-ocean-demo/page.tsx");
  const d6 = path.join(ROOT, "public/particle-ocean/index.html");
  const d7 = path.join(ROOT, "public/landing/index.html");

  assert.ok(!fs.existsSync(d1), "D1 must NOT exist");
  assert.ok(!fs.existsSync(d2), "D2 must NOT exist");
  assert.ok(!fs.existsSync(d3), "D3 must NOT exist");
  assert.ok(!fs.existsSync(d4), "D4 must NOT exist");
  assert.ok(!fs.existsSync(d5), "D5 must NOT exist");
  assert.ok(!fs.existsSync(d6), "D6 must NOT exist");
  assert.ok(!fs.existsSync(d7), "D7 must NOT exist");

  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.ok(!pkg.dependencies || !pkg.dependencies.three, "'three' must not be in dependencies");
});

test("TC-08 - Keyframes Preserved: Critical micro-interaction keyframes remain intact in globals.css", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(css, /@keyframes shimmer/, "shimmer keyframe must remain");
  assert.match(css, /@keyframes pulseGlow/, "pulseGlow keyframe must remain");
  assert.match(css, /@keyframes float/, "float keyframe must remain");
});
