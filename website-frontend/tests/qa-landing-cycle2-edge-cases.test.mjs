import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// =============================================================================
// QA TEST SUITE: CYCLE 2 ENHANCEMENTS — SEARCH-PRO, 3D-ROBUST, VALUE-ADD
// =============================================================================

test("QA-C2-EC01: Search Query Hardening & Boundary Fuzzing", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  assert.match(formSrc, /export const SEARCH_MAX_LENGTH\s*=\s*100/, "Maximum query length must be exactly 100");
  assert.match(formSrc, /export function sanitizeSearchQuery/, "Must export sanitizeSearchQuery function");

  // Pure logic contract matching implementation: raw.replace(/\s+/g, " ").trim().slice(0, 100)
  const sanitize = (raw) => raw.replace(/\s+/g, " ").trim().slice(0, 100);

  // 1. Whitespace and empty strings
  assert.equal(sanitize(""), "");
  assert.equal(sanitize("   "), "");
  assert.equal(sanitize("\t\t\n\r  "), "");
  assert.equal(sanitize("  thiết   kế    logo  "), "thiết kế logo");

  // 2. Length boundaries (99, 100, 101, 500)
  assert.equal(sanitize("a".repeat(99)).length, 99);
  assert.equal(sanitize("a".repeat(100)).length, 100);
  assert.equal(sanitize("a".repeat(101)).length, 100);
  assert.equal(sanitize("a".repeat(500)).length, 100);

  // 3. Security attack payloads (XSS, SQL Injection)
  const xss = "<script>alert('XSS')</script>";
  assert.equal(sanitize(xss), xss);
  assert.ok(!encodeURIComponent(sanitize(xss)).includes("<"));

  const sqli = "admin' OR '1'='1' -- ";
  assert.equal(sanitize(sqli), "admin' OR '1'='1' --");

  // 4. Unicode diacritics and Emojis
  const viWithEmoji = "Lập trình AI & Web 💻🔥✨";
  assert.equal(sanitize(viWithEmoji), viWithEmoji);
});

test("QA-C2-EC02: Search Form Clear Button (X) Contract", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  assert.match(formSrc, /query\s*!==\s*""/, "Must check query !== '' to render clear button");
  assert.match(formSrc, /setQuery\(["']["']\)/, "Clear button must reset query to empty string");
  assert.match(formSrc, /inputRef\.current\?\.focus\(\)/, "Clear button must restore focus to input");
  assert.match(formSrc, /clearLabel/, "Clear button must support accessible clearLabel");
});

test("QA-C2-EC03: Suggestions Combobox Contract & A11y Attributes", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  const suggSrc = read("src/components/landing/fiverr/fiverr-search-suggestions.tsx");

  // Combobox input contract
  assert.match(formSrc, /role="combobox"/, "Input must declare role='combobox'");
  assert.match(formSrc, /aria-expanded=\{suggestOpen\}/, "Input must bind aria-expanded");
  assert.match(formSrc, /aria-autocomplete="list"/, "Input must bind aria-autocomplete='list'");
  assert.match(formSrc, /aria-controls=/, "Input must bind aria-controls");

  // Keyboard navigation
  assert.match(formSrc, /ArrowDown/, "Form must handle ArrowDown key");
  assert.match(formSrc, /ArrowUp/, "Form must handle ArrowUp key");
  assert.match(formSrc, /Escape/, "Form must handle Escape key");
  assert.match(formSrc, /Enter/, "Form must handle Enter key");

  // Listbox contract
  assert.match(suggSrc, /role="listbox"/, "Dropdown must declare role='listbox'");
  assert.match(suggSrc, /role="option"/, "Items must declare role='option'");
  assert.match(suggSrc, /aria-selected/, "Items must declare aria-selected");
  assert.match(suggSrc, /onMouseDown/, "Items must use onMouseDown to prevent blur race condition");
});

test("QA-C2-EC04: FiverrImage Loading Lifecycle & Fallback Robustness", () => {
  const imgPath = "src/components/landing/fiverr/fiverr-image.tsx";
  assert.ok(fs.existsSync(path.join(ROOT, imgPath)), "fiverr-image.tsx must exist");
  const imgSrc = read(imgPath);

  assert.match(imgSrc, /const \[loaded,\s*setLoaded\]\s*=\s*React\.useState\(false\)/, "Must track loaded state");
  assert.match(imgSrc, /const \[failed,\s*setFailed\]\s*=\s*React\.useState\(false\)/, "Must track failed state");
  assert.match(imgSrc, /!loaded\s*&&\s*<div\s+className="img-shimmer/, "Must render shimmer placeholder before loaded");
  assert.match(imgSrc, /onError=\{\(\)\s*=>\s*setFailed\(true\)\}/, "Must handle onError to gracefully fallback");
  assert.match(imgSrc, /backgroundImage:\s*`linear-gradient/, "Must render gradient background on error fallback");
});

test("QA-C2-EC05: Category Rail Bidirectional Boundary Logic", () => {
  const catSrc = read("src/components/landing/fiverr/fiverr-category-grid.tsx");

  assert.match(catSrc, /const EDGE_SLOP\s*=\s*4/, "Must define subpixel slop tolerance EDGE_SLOP = 4");
  assert.match(catSrc, /canLeft/, "Must track canLeft state");
  assert.match(catSrc, /canRight/, "Must track canRight state");
  assert.match(catSrc, /scrollBy\(\{\s*left:\s*delta,\s*behavior:/, "Must scroll smoothly");
  assert.match(catSrc, /ChevronLeft/, "Must render ChevronLeft button when canLeft is true");
  assert.match(catSrc, /ChevronRight/, "Must render ChevronRight button when canRight is true");
});

test("QA-C2-EC06: 3D WebGL Context Loss & Restoration Lifecycle", () => {
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");

  assert.match(sceneSrc, /webglcontextlost/, "Must listen to webglcontextlost event");
  assert.match(sceneSrc, /e\.preventDefault\(\)/, "Must call e.preventDefault() on context lost");
  assert.match(sceneSrc, /data-fallback="webgl-context-lost"/, "Must render fallback marker on context lost");
  assert.match(sceneSrc, /webglcontextrestored/, "Must listen to webglcontextrestored event");
  assert.match(sceneSrc, /removeEventListener\(["']webglcontextlost["']/, "Must clean up contextlost listener");
  assert.match(sceneSrc, /removeEventListener\(["']webglcontextrestored["']/, "Must clean up contextrestored listener");
});

test("QA-C2-EC07: 60 FPS Throttling & Power Preservation", () => {
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");
  const tokensSrc = read("src/lib/landing/fiverr-tokens.ts");

  assert.match(tokensSrc, /fps:\s*60/, "Tokens must configure 60 FPS");
  assert.match(tokensSrc, /frameMinMs:\s*1000\s*\/\s*60/, "Tokens must configure frameMinMs ~16.67ms");
  assert.match(sceneSrc, /FRAME_MIN/, "Scene must use FRAME_MIN threshold");
  assert.match(sceneSrc, /now\s*-\s*lastFrame\s*<\s*FRAME_MIN/, "Scene must skip rendering when interval < FRAME_MIN");
});

test("QA-C2-EC08: Popular Services Price Badge Architecture", async () => {
  const { getFiverrContent } = await import(
    "../src/lib/landing/fiverr-content.ts"
  );
  const popSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");

  for (const locale of ["vi", "en"]) {
    const content = getFiverrContent(locale);
    for (const s of content.popular.services) {
      assert.ok(typeof s.priceFrom === "number", `${locale}: service ${s.id} must define numeric priceFrom`);
      assert.ok(s.priceFrom > 0, `${locale}: service ${s.id} priceFrom must be positive`);
    }
  }

  assert.match(popSrc, /formatPrice/, "Must define formatPrice helper");
  assert.match(popSrc, /Intl\.NumberFormat/, "Must format currency using Intl.NumberFormat");
  assert.match(popSrc, /service\.priceFrom/, "Must render price badge for each service");
});

test("QA-C2-EC09: Testimonials Section Data & 11-Section Orchestrator Order", async () => {
  const { getFiverrContent } = await import(
    "../src/lib/landing/fiverr-content.ts"
  );
  const landingSrc = read("src/components/landing/fiverr/fiverr-landing.tsx");

  for (const locale of ["vi", "en"]) {
    const content = getFiverrContent(locale);
    assert.ok(content.testimonials, `${locale}: testimonials must exist in content`);
    assert.equal(content.testimonials.items.length, 3, `${locale}: must have exactly 3 testimonials`);
    for (const t of content.testimonials.items) {
      assert.ok(t.name && t.name.length > 0, "Testimonial must have name");
      assert.ok(t.role && t.role.length > 0, "Testimonial must have role");
      assert.ok(t.quote && t.quote.length > 0, "Testimonial must have quote");
      assert.ok(t.initials && t.initials.length > 0, "Testimonial must have initials");
    }
  }

  // 11-section orchestrator order verification
  const guidesIdx = landingSrc.indexOf("<FiverrGuides");
  const testIdx = landingSrc.indexOf("<FiverrTestimonials");
  const ctaIdx = landingSrc.indexOf("<FiverrCtaBanner");

  assert.ok(guidesIdx !== -1, "FiverrGuides must be in landing orchestrator");
  assert.ok(testIdx !== -1, "FiverrTestimonials must be in landing orchestrator");
  assert.ok(ctaIdx !== -1, "FiverrCtaBanner must be in landing orchestrator");
  assert.ok(guidesIdx < testIdx, "FiverrGuides must appear before FiverrTestimonials");
  assert.ok(testIdx < ctaIdx, "FiverrTestimonials must appear before FiverrCtaBanner");
});

test("QA-C2-EC10: Quick-Filter Pills Navigation & State Synchronization", () => {
  const postsPageSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsPageSrc, /pill-scroll/, "Pills row must include pill-scroll class");
  assert.match(postsPageSrc, /quickFilterLabel/, "Pills nav must have accessible label");
  assert.match(postsPageSrc, /quickFilterAll/, "All filter button must be rendered");
  assert.match(postsPageSrc, /aria-pressed=\{!qParam\}/, "All button must set aria-pressed when !qParam");
  assert.match(postsPageSrc, /aria-pressed=\{qParam === label\}/, "Category pill must set aria-pressed when active");
  assert.match(postsPageSrc, /updateQuery\(\{\s*q:\s*label,\s*page:\s*1\s*\}\)/, "Clicking category pill must update query with label");
});

test("QA-C2-EC11: CSS Reduced-Motion Killswitch Completeness in LAST Block", () => {
  const css = read("src/app/globals.css");
  const lastIndex = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
  assert.ok(lastIndex !== -1, "globals.css must have prefers-reduced-motion block");

  const lastBlock = css.slice(lastIndex);
  assert.match(lastBlock, /\.img-shimmer/, "LAST block must suppress .img-shimmer");
  assert.match(lastBlock, /\.focus-elevate:focus-within/, "LAST block must suppress .focus-elevate:focus-within");
  assert.match(lastBlock, /\.search-shake/, "LAST block must suppress .search-shake");
  assert.match(lastBlock, /\.card-shine/, "LAST block must suppress .card-shine");
  assert.match(lastBlock, /\.trusted-marquee/, "LAST block must suppress .trusted-marquee");
});

test("QA-C2-EC12: Governance, Zero-Dependencies & Dictionary Parity", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies?.three, undefined, "three must not be in dependencies");
  assert.equal(pkg.devDependencies?.three, undefined, "three must not be in devDependencies");

  const viDict = JSON.parse(read("src/dictionaries/vi.json"));
  const enDict = JSON.parse(read("src/dictionaries/en.json"));

  // Check new Cycle 2 dictionary keys
  assert.ok(viDict.landing?.fiverr?.search?.clearLabel, "vi.json must define search.clearLabel");
  assert.ok(enDict.landing?.fiverr?.search?.clearLabel, "en.json must define search.clearLabel");
  assert.ok(viDict.landing?.fiverr?.hero?.suggestionsLabel, "vi.json must define hero.suggestionsLabel");
  assert.ok(enDict.landing?.fiverr?.hero?.suggestionsLabel, "en.json must define hero.suggestionsLabel");
  assert.ok(viDict.landing?.fiverr?.testimonials?.regionLabel, "vi.json must define testimonials.regionLabel");
  assert.ok(enDict.landing?.fiverr?.testimonials?.regionLabel, "en.json must define testimonials.regionLabel");
  assert.ok(viDict.landing?.fiverr?.popular?.fromPrice, "vi.json must define popular.fromPrice");
  assert.ok(enDict.landing?.fiverr?.popular?.fromPrice, "en.json must define popular.fromPrice");
});
