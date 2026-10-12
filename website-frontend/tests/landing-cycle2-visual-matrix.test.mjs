import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

test("C2-MATRIX-01: Header responsive typography and nowrap layout across 1440/1024/768 breakpoints", () => {
  const headerSrc = read("src/components/landing/fiverr/fiverr-header.tsx");

  assert.match(headerSrc, /whitespace-nowrap/, "Nav buttons must have whitespace-nowrap");
  assert.match(headerSrc, /shrink-0/, "Nav buttons must prevent flex shrinking");
  assert.match(headerSrc, /min-h-\[64px\]\s*md:h-\[53px\]/, "Header height must have 64px min-h with 53px desktop height");
  assert.match(headerSrc, /hidden min-w-0 items-center.*?xl:flex/, "becomeSeller must hide on desktop < xl");
  assert.match(headerSrc, /lg:hidden/, "Mobile cluster triggers on viewports < lg");
});

test("C2-MATRIX-02: Hero typography, text-balance, and 3D accent layer responsive literals", () => {
  const heroSrc = read("src/components/landing/fiverr/fiverr-hero.tsx");

  assert.match(heroSrc, /text-balance-hero/, "Hero heading must include text-balance-hero");
  assert.match(heroSrc, /min-h-\[450px\]/, "Hero must maintain mobile min-h-[450px]");
  assert.match(heroSrc, /md:h-\[680px\]/, "Hero must maintain desktop md:h-[680px]");
  assert.match(heroSrc, /<Fiverr3dAccent/, "Hero must include Fiverr3dAccent layer");
  assert.match(heroSrc, /opacity-60/, "3D accent must have opacity-60 for optimal contrast");
});

test("C2-MATRIX-03: Category rail supports smooth 2-way navigation with edge auto-hide", () => {
  const catSrc = read("src/components/landing/fiverr/fiverr-category-grid.tsx");

  assert.match(catSrc, /ChevronLeft/, "Must render ChevronLeft");
  assert.match(catSrc, /ChevronRight/, "Must render ChevronRight");
  assert.match(catSrc, /EDGE_SLOP\s*=\s*4/, "Must define EDGE_SLOP = 4 for subpixel tolerance");
  assert.match(catSrc, /fiverr-no-scrollbar/, "Rail must suppress native scrollbar");
  assert.match(catSrc, /aspect-square\s*min-h-\[88px\]/, "Mobile category grid must use fluid aspect-square");
});

test("C2-MATRIX-04: Popular services equal-height cards and FiverrImage integration", () => {
  const popSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");

  assert.match(popSrc, /h-\[300px\]/, "Card height must be exactly 300px for alignment");
  assert.match(popSrc, /min-h-\[56px\].*?line-clamp-2/, "Title must clamp to 2 lines with 56px minimum height");
  assert.match(popSrc, /min-h-\[36px\].*?line-clamp-2/, "Blurb must clamp to 2 lines with 36px minimum height");
  assert.match(popSrc, /<FiverrImage/, "Must render FiverrImage");
  assert.match(popSrc, /formatPrice/, "Must render price badge via formatPrice");
});

test("C2-MATRIX-05: Tilt card focus elevation and keyboard tab navigation", () => {
  const tiltSrc = read("src/components/landing/fiverr/fiverr-tilt-card.tsx");

  assert.match(tiltSrc, /focus-elevate/, "Tilt card must have focus-elevate class");
  assert.match(tiltSrc, /tabIndex=\{-1\}/, "Wrapper must have tabIndex={-1} to delegate focus to child interactive elements");
  assert.match(tiltSrc, /preserve-3d/, "Must retain 3D transform style preserve-3d");

  const css = read("src/app/globals.css");
  assert.match(css, /\.focus-elevate:focus-within/, "globals.css must define .focus-elevate:focus-within");
  assert.match(css, /transform:\s*translateY\(-4px\)/, "focus-within must lift card by -4px");
});

test("C2-MATRIX-06: Testimonials and Quick-filter pills grid structure", () => {
  const testSrc = read("src/components/landing/fiverr/fiverr-testimonials.tsx");
  assert.match(testSrc, /grid-cols-1.*?md:grid-cols-3/, "Testimonials must render 1 column on mobile and 3 on desktop");

  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");
  assert.match(postsSrc, /pill-scroll.*?fiverr-no-scrollbar/, "Pills row must have horizontal scrolling classes");
});

test("C2-MATRIX-07: Reduced-motion media query suppresses shimmer, focus lift, and animations in the LAST block", () => {
  const css = read("src/app/globals.css");

  // Verify the LAST media query block contains all required killswitch classes
  const lastIndex = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
  assert.ok(lastIndex !== -1, "Must contain prefers-reduced-motion media query");

  const lastBlock = css.slice(lastIndex);
  assert.match(lastBlock, /\.img-shimmer/, "LAST reduced-motion block must suppress .img-shimmer");
  assert.match(lastBlock, /\.focus-elevate:focus-within/, "LAST reduced-motion block must suppress .focus-elevate lift");
  assert.match(lastBlock, /\.search-shake/, "LAST reduced-motion block must suppress .search-shake");
});
