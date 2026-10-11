import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("UI-MOTION-01 - Motion primitives exist", () => {
  for (const f of [
    "src/lib/motion.ts",
    "src/components/landing/fiverr/fiverr-reveal.tsx",
    "src/components/landing/fiverr/fiverr-3d-accent.tsx",
    "src/components/landing/fiverr/fiverr-button.tsx",
  ]) {
    assert.ok(exists(f), f);
  }
});

test("UI-MOTION-02 - Motion lib exposes easing + guards", () => {
  const src = read("src/lib/motion.ts");
  assert.match(src, /EASES/);
  assert.match(src, /prefersReducedMotion/);
  assert.match(src, /useReveal/);
  assert.match(src, /IntersectionObserver/);
});

test("UI-MOTION-03 - 3D accent is lazy + guarded", () => {
  const src = read("src/components/landing/fiverr/fiverr-3d-accent.tsx");
  assert.match(src, /ssr:\s*false/);
  assert.match(src, /prefers-reduced-motion/);
  assert.match(src, /WebGL|webgl/);
});

test("UI-MOTION-04 - No three in forbidden files", () => {
  for (const f of [
    "src/components/landing/workgo-landing-page.tsx",
    "src/components/landing/workgo-navbar.tsx",
  ]) {
    assert.ok(!read(f).includes("three"));
  }
});

test("UI-MOTION-05 - Reduced-motion killswitch present in CSS", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /\.reveal-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
