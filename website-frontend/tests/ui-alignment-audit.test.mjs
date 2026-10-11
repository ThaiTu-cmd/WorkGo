import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

test("UI-ALIGN-01 - Header has min-h guard and keeps measured h-53 for regression", () => {
  const src = read("src/components/landing/fiverr/fiverr-header.tsx");
  assert.match(src, /min-h-\[64px\]/);
  assert.match(src, /h-\[53px\]/);
  assert.match(src, /min-w-0/);
});

test("UI-ALIGN-02 - Hero wires reveal + 3d accent behind scrim", () => {
  const src = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(src, /FiverrReveal/);
  assert.match(src, /Fiverr3dAccent/);
  assert.match(src, /max-w-\[613px\]/);
  assert.match(src, /max-w-\[1078px\]/);
});

test("UI-ALIGN-03 - Category mobile uses fluid aspect-square, no fixed 88px box", () => {
  const src = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(src, /aspect-square/);
  assert.match(src, /md:w-\[129px\]/);
  assert.ok(!src.includes("w-[88px] h-[88px]"), "fixed 88px box must be gone");
});

test("UI-ALIGN-04 - Popular has single gutter (no double px on carousel)", () => {
  const src = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  assert.ok(!src.includes('className="px-6 md:px-0"'), "carousel double gutter must be gone");
});

test("UI-ALIGN-05 - Carousel arrows are inset-safe and dots exist for mobile", () => {
  const src = read("src/components/landing/fiverr/fiverr-carousel.tsx");
  assert.match(src, /left-2/);
  assert.match(src, /md:hidden/);
  assert.match(src, /ResizeObserver/);
});

test("UI-ALIGN-06 - Footer has single border and responsive grid", () => {
  const src = read("src/components/landing/fiverr/fiverr-footer.tsx");
  assert.ok(!src.includes("border-t border-t-[0.8px]"), "double border must be gone");
  assert.match(src, /lg:grid-cols-5/);
});

test("UI-ALIGN-07 - Legacy WorkGo tree still preserved (no regression)", () => {
  const src = read("src/components/landing/workgo-landing-page.tsx");
  for (const s of [
    "<FiverrLanding",
    "<LandingStaticBackground",
    "<WorkgoNavbar",
    "<ParticleOceanHero",
    "<WorkgoLandingSections",
  ]) {
    assert.ok(src.includes(s));
  }
  assert.ok(!src.includes('from "three"'), 'three must not leak into landing-page');
});

test("UI-ALIGN-08 - Append-only CSS keeps old utilities", () => {
  const css = read("src/app/globals.css");
  for (const s of [
    ".pressable",
    ".landing-static-cone",
    ".reveal",
    ".reveal-visible",
    "prefers-reduced-motion",
  ]) {
    assert.ok(css.includes(s));
  }
});
