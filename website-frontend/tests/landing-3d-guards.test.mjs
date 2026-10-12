import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("3D-GUARD-01: Pure WebGL 3D scene exists with matrix projection and accessibility guards", () => {
  const scenePath = "src/components/landing/fiverr/fiverr-3d-hero-scene.tsx";
  assert.ok(exists(scenePath), "fiverr-3d-hero-scene.tsx must exist");
  const sceneSrc = read(scenePath);

  // WebGL projection and rendering loop
  assert.match(sceneSrc, /getContext\("webgl2"\)|getContext\("webgl"\)/, "Must initialize WebGL context");
  assert.match(sceneSrc, /createPerspective|uProjection|uModelView/, "Must apply 3D perspective matrix transform");
  assert.match(sceneSrc, /requestAnimationFrame/, "Must manage rendering via requestAnimationFrame");

  // Performance and resource management
  assert.match(sceneSrc, /IntersectionObserver/, "Must pause rendering when offscreen via IntersectionObserver");
  assert.match(sceneSrc, /visibilitychange/, "Must pause rendering when document is hidden");
  assert.match(sceneSrc, /cancelAnimationFrame/, "Must clean up animation frame on unmount or pause");

  // Accessibility & Data Saver Guards (E9, E10)
  assert.match(sceneSrc, /prefers-reduced-motion: reduce/, "Must guard against reduced motion");
  assert.match(sceneSrc, /saveData/, "Must respect navigator saveData preference");
});

test("3D-GUARD-02: Landing page core entry points contain NO heavy static three.js dependencies", () => {
  const mainLanding = read("src/components/landing/workgo-landing-page.tsx");
  const fiverrLanding = read("src/components/landing/fiverr/fiverr-landing.tsx");

  assert.doesNotMatch(mainLanding, /from ["']three["']/, "workgo-landing-page.tsx must not statically import three.js");
  assert.doesNotMatch(fiverrLanding, /from ["']three["']/, "fiverr-landing.tsx must not statically import three.js");

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies?.three, undefined, "three must not be installed in dependencies to preserve zero bundle regression");
});

test("3D-GUARD-03: FiverrTiltCard implements 3D perspective, pointer-fine checks, and reduced-motion guard", () => {
  const tiltPath = "src/components/landing/fiverr/fiverr-tilt-card.tsx";
  assert.ok(exists(tiltPath), "fiverr-tilt-card.tsx must exist");
  const tiltSrc = read(tiltPath);

  assert.match(tiltSrc, /perspective/, "Must configure 3D perspective");
  assert.match(tiltSrc, /rotateX|rotateY/, "Must calculate 3D rotation angles");
  assert.match(tiltSrc, /prefers-reduced-motion: reduce/, "Must disable tilt on prefers-reduced-motion");
  assert.match(tiltSrc, /pointer:\s*fine/, "Must only activate tilt on fine-pointer devices (not touch)");
});

test("3D-GUARD-04: Hero component mounts 3D layer with poster video fallback", () => {
  const heroSrc = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(heroSrc, /<Fiverr3dAccent/, "Hero must render 3D accent layer");
  assert.match(heroSrc, /onError/, "Hero video must handle onError to gracefully fallback to poster image");
  assert.match(heroSrc, /videoError/, "Hero must maintain videoError state");
});

test("3D-GUARD-05: Design tokens export 3D physics and easing constants", () => {
  const tokensSrc = read("src/lib/landing/fiverr-tokens.ts");
  assert.match(tokensSrc, /export const FIVERR_3D/, "Must export FIVERR_3D tokens");
  assert.match(tokensSrc, /export const FIVERR_EASE/, "Must export FIVERR_EASE tokens");
});

test("3D-GUARD-06: globals.css suppresses search-shake and animations on prefers-reduced-motion", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, "Must define reduced-motion media query");
  assert.match(css, /\.search-shake\s*\{[^}]*animation:\s*none/, "Must suppress search-shake animation for reduced-motion");
});
