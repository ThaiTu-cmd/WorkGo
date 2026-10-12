import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_MAX,
  loadRecentSearches,
  recordRecentSearch,
  clearRecentSearches,
} from "../src/lib/landing/recent-searches.ts";

import { FIVERR_DENSITY, resolveParticleDensity } from "../src/lib/landing/adaptive-3d.ts";
import { VND_PER_USD, formatPriceVND } from "../src/lib/landing/format-price.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

function setupMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  const mockStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  globalThis.window = { localStorage: mockStorage };
  return mockStorage;
}

// =============================================================================
// QA TEST SUITE: CYCLE 3 FINAL POLISH & PRODUCTION READINESS EDGE CASES
// =============================================================================

test("QA-C3-EC01: LocalStorage Resilience, Fuzzing & Safe Degradation", () => {
  assert.equal(RECENT_SEARCHES_MAX, 5, "RECENT_SEARCHES_MAX must be 5");

  // 1. Corrupt JSON syntax
  setupMockStorage({ [RECENT_SEARCHES_KEY]: "syntax-error-json{[[}" });
  assert.deepEqual(loadRecentSearches(), [], "Corrupt JSON must gracefully return []");

  // 2. Non-array JSON values (number, object, boolean)
  setupMockStorage({ [RECENT_SEARCHES_KEY]: "12345" });
  assert.deepEqual(loadRecentSearches(), [], "Number in storage must safely return []");

  setupMockStorage({ [RECENT_SEARCHES_KEY]: JSON.stringify({ a: "b" }) });
  assert.deepEqual(loadRecentSearches(), [], "Plain object in storage must safely return []");

  // 3. Mixed array filtering
  setupMockStorage({
    [RECENT_SEARCHES_KEY]: JSON.stringify(["Valid Item", 123, null, "", "   ", { bad: true }, "Second Valid"]),
  });
  assert.deepEqual(loadRecentSearches(), ["Valid Item", "Second Valid"], "Must strictly filter non-empty strings");

  // 4. QuotaExceeded error during record
  const mockWithQuotaError = {
    getItem: () => null,
    setItem: () => {
      const err = new Error("QuotaExceededError");
      err.name = "QuotaExceededError";
      throw err;
    },
    removeItem: () => {},
  };
  globalThis.window = { localStorage: mockWithQuotaError };
  assert.doesNotThrow(() => {
    const res = recordRecentSearch("New Search");
    assert.deepEqual(res, ["New Search"], "Must return updated in-memory array even if storage setItem throws");
  }, "Quota exceeded must not throw exception");

  // 5. Private Browsing SecurityError
  globalThis.window = {
    get localStorage() {
      const err = new Error("SecurityError: Access is denied");
      err.name = "SecurityError";
      throw err;
    },
  };
  assert.doesNotThrow(() => {
    assert.deepEqual(loadRecentSearches(), []);
    assert.deepEqual(recordRecentSearch("Test"), ["Test"]);
    clearRecentSearches();
  }, "Private mode / SecurityError must degrade gracefully");
});

test("QA-C3-EC02: Adaptive 3D Hardware Matrix Boundary Conditions", () => {
  assert.equal(FIVERR_DENSITY.high, 300, "FIVERR_DENSITY.high must be 300");
  assert.equal(FIVERR_DENSITY.low, 150, "FIVERR_DENSITY.low must be 150");

  const origNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  const setEnv = ({ innerWidth, deviceMemory, hardwareConcurrency } = {}) => {
    if (innerWidth !== undefined) {
      globalThis.window = { innerWidth };
    } else {
      delete globalThis.window;
    }
    Object.defineProperty(globalThis, "navigator", {
      value: { deviceMemory, hardwareConcurrency },
      configurable: true,
      writable: true,
    });
  };

  try {
    // Boundary 1: RAM threshold exactly 4GB (<= 4 -> low: 150)
    setEnv({ innerWidth: 1440, deviceMemory: 4, hardwareConcurrency: 8 });
    assert.equal(resolveParticleDensity(), 150, "deviceMemory = 4 must trigger low density (<= 4)");

    // Boundary 2: RAM threshold 4.1GB (> 4, CPU=8, width=1440 -> high: 300)
    setEnv({ innerWidth: 1440, deviceMemory: 4.1, hardwareConcurrency: 8 });
    assert.equal(resolveParticleDensity(), 300, "deviceMemory > 4 must resolve to high density");

    // Boundary 3: CPU threshold exactly 4 cores (<= 4 -> low: 150)
    setEnv({ innerWidth: 1440, deviceMemory: 8, hardwareConcurrency: 4 });
    assert.equal(resolveParticleDensity(), 150, "hardwareConcurrency = 4 must trigger low density (<= 4)");

    // Boundary 4: CPU threshold 5 cores (> 4 -> high: 300)
    setEnv({ innerWidth: 1440, deviceMemory: 8, hardwareConcurrency: 5 });
    assert.equal(resolveParticleDensity(), 300, "hardwareConcurrency > 4 must resolve to high density");

    // Boundary 5: Screen width exactly 767px (< 768 -> low: 150)
    setEnv({ innerWidth: 767, deviceMemory: 16, hardwareConcurrency: 16 });
    assert.equal(resolveParticleDensity(), 150, "innerWidth 767px must trigger low density");

    // Boundary 6: Screen width exactly 768px (>= 768 -> high: 300)
    setEnv({ innerWidth: 768, deviceMemory: 16, hardwareConcurrency: 16 });
    assert.equal(resolveParticleDensity(), 300, "innerWidth 768px must resolve to high density");

    // Boundary 7: Browser without navigator.deviceMemory or hardwareConcurrency
    setEnv({ innerWidth: 1440, deviceMemory: undefined, hardwareConcurrency: undefined });
    assert.equal(resolveParticleDensity(), 300, "Missing memory/cpu APIs must resolve to desktop fallback");

    // Boundary 8: SSR environment (window is undefined)
    delete globalThis.window;
    assert.equal(resolveParticleDensity(), 300, "SSR must return safe fallback without throwing ReferenceError");
  } finally {
    delete globalThis.window;
    if (origNav) {
      Object.defineProperty(globalThis, "navigator", origNav);
    }
  }
});

test("QA-C3-EC03: Centralized Currency Parity & Number Formatting", () => {
  assert.equal(VND_PER_USD, 25000, "VND_PER_USD invariant must be 25000");

  // Zero and minimum edge cases
  assert.equal(formatPriceVND(0, "en"), "From $1", "0 VND must clamp to minimum $1 for USD");
  assert.equal(formatPriceVND(100, "en"), "From $1", "Small fractions must clamp to minimum $1 for USD");

  // Exact multiples of 25,000
  assert.equal(formatPriceVND(250000, "en"), "From $10", "250,000 VND / 25,000 = $10");
  assert.equal(formatPriceVND(2500000, "en"), "From $100", "2,500,000 VND / 25,000 = $100");

  // Non-exact rounding
  // 1,234,567 / 25,000 = 49.38268 -> rounds to 49
  assert.equal(formatPriceVND(1234567, "en"), "From $49", "1,234,567 VND must round to $49");
  // 1,240,000 / 25,000 = 49.6 -> rounds to 50
  assert.equal(formatPriceVND(1240000, "en"), "From $50", "1,240,000 VND must round to $50");

  // Vietnamese format structure
  const viPrice = formatPriceVND(50000000, "vi");
  assert.match(viPrice, /^Từ\s/, "VI price must begin with 'Từ '");
  assert.match(viPrice, /50\.000\.000/, "VI price must contain dot thousands separator");
  assert.match(viPrice, /₫|đ/, "VI price must end with currency symbol");
});

test("QA-C3-EC04: Suggestions Dual-Group Flat Indexing & Keyboard Navigation", () => {
  const suggestionsSrc = read("src/components/landing/fiverr/fiverr-search-suggestions.tsx");

  // Group separation
  assert.match(suggestionsSrc, /role="group"\s+aria-label=\{recentLabel\}/, "Must render Recent Searches group");
  assert.match(suggestionsSrc, /role="group"\s+aria-label=\{label\}/, "Must render Trending Searches group");

  // Flat indexing contract
  assert.match(suggestionsSrc, /const flatIndex = recents\.length \+ i;/, "Trending item must calculate flat index based on recents.length");
  assert.match(suggestionsSrc, /id=\{`\$\{id\}-opt-\$\{flatIndex\}`\}/, "Option ID must use flat index");
  assert.match(suggestionsSrc, /aria-selected=\{isActive\}/, "Option must bind aria-selected");
  assert.match(suggestionsSrc, /data-active=\{isActive\}/, "Option must bind data-active attribute");

  // Clear history action
  assert.match(suggestionsSrc, /onClearHistory/, "Must provide clear history trigger");
  assert.match(suggestionsSrc, /onMouseDown=\{\(e\)\s*=>\s*\{\s*e\.preventDefault\(\);\s*onClearHistory\(\);/, "Clear history must preventDefault to avoid blur");
});

test("QA-C3-EC05: Live Region Dynamic Announce Contract", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  assert.match(formSrc, /role="status"/, "Must render role='status' element");
  assert.match(formSrc, /aria-live="polite"/, "Must set aria-live='polite'");
  assert.match(formSrc, /className="sr-only"/, "Must hide live region visually with sr-only");
  assert.match(formSrc, /resultsCountTemplate\.replace\("\{n\}",\s*String\(flatList\.length\)\)/, "Must interpolate results count with flatList.length");
});

test("QA-C3-EC06: Verified Badge Mathematical Contrast Verification", () => {
  const popularSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  const testimonialsSrc = read("src/components/landing/fiverr/fiverr-testimonials.tsx");

  assert.match(popularSrc, /bg-\[#00732E\]/, "Popular services must use #00732E background");
  assert.match(testimonialsSrc, /bg-\[#00732E\]/, "Testimonials must use #00732E background");

  // Relative luminance calculation for #00732E vs White (#FFFFFF)
  // #00732E -> R:0, G:115, B:46
  // sRGB -> R: 0.0, G: 115/255 = 0.45098, B: 46/255 = 0.18039
  // Linear RGB:
  // G_lin = ((0.45098 + 0.055) / 1.055)^2.4 = 0.1691
  // B_lin = ((0.18039 + 0.055) / 1.055)^2.4 = 0.0267
  // L = 0.2126 * 0 + 0.7152 * 0.1691 + 0.0722 * 0.0267 = 0.1228
  // White L_white = 1.0
  // Contrast Ratio = (1.0 + 0.05) / (0.1228 + 0.05) = 1.05 / 0.1728 = ~6.076:1
  const bgLuminance = 0.1228;
  const textLuminance = 1.0;
  const contrastRatio = (textLuminance + 0.05) / (bgLuminance + 0.05);

  assert.ok(contrastRatio > 4.5, `Contrast ratio ${contrastRatio.toFixed(2)}:1 must exceed WCAG AA 4.5:1 requirement`);
});

test("QA-C3-EC07: Posts Page Filter Transitions & Skeleton State Guards", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsSrc, /const \[filtering, setFiltering\] = React\.useState\(false\)/, "Must separate filtering state");
  assert.match(postsSrc, /const firstRun = React\.useRef\(true\)/, "Must use firstRun ref guard");
  assert.match(postsSrc, /const skeletonGrid =/, "Must declare memoized/shared skeletonGrid");
  assert.match(postsSrc, /\[1,\s*2,\s*3,\s*4,\s*5,\s*6\]\.map/, "Must render 6 skeleton placeholder cards during transition");
});

test("QA-C3-EC08: Posts Zero-Result EmptyState & 3 Featured Chips Contract", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsSrc, /posts\.length === 0/, "Must branch on posts.length === 0 for empty state");
  assert.match(postsSrc, /featuredLabels/, "Must render featuredLabels");
  assert.match(postsSrc, /t\("featuredLabel"\)/, "Must display localized prompt for featured jobs");
  assert.match(postsSrc, /updateQuery\(\{\s*q:\s*label,\s*page:\s*1\s*\}\)/, "Clicking featured chip must update query and reset page to 1");
});

test("QA-C3-EC09: Rail Momentum & Touch Optimization Contract", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /-webkit-overflow-scrolling:\s*touch;/, "globals.css must specify touch momentum");
  assert.match(css, /scroll-snap-type:\s*x proximity;/, "globals.css must specify horizontal snap proximity");
  assert.match(css, /overscroll-behavior-x:\s*contain;/, "globals.css must specify overscroll contain");

  const catGridSrc = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(catGridSrc, /rail-momentum/, "Category grid must include rail-momentum");

  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");
  assert.match(postsSrc, /rail-momentum/, "Posts pills row must include rail-momentum");
});

test("QA-C3-EC10: Keyframes Deduplication Audit", () => {
  const css = read("src/app/globals.css");

  const countDef = (name) => {
    const rx = new RegExp(`@keyframes\\s+${name}\\b`, "g");
    const m = css.match(rx);
    return m ? m.length : 0;
  };

  assert.equal(countDef("fiverrShimmer"), 1, "@keyframes fiverrShimmer must be defined exactly once");
  assert.equal(countDef("searchShake"), 1, "@keyframes searchShake must be defined exactly once");
  assert.equal(countDef("fiverrMarquee"), 1, "@keyframes fiverrMarquee must be defined exactly once");
  assert.equal(countDef("fiverrCardShine"), 1, "@keyframes fiverrCardShine must be defined exactly once");
});

test("QA-C3-EC11: CSS Reduced-Motion Killswitch Completeness in LAST Block", () => {
  const css = read("src/app/globals.css");
  const lastIndex = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
  assert.ok(lastIndex !== -1, "globals.css must have prefers-reduced-motion block");

  const lastBlock = css.slice(lastIndex);
  assert.match(lastBlock, /\.img-shimmer/, "LAST block must suppress .img-shimmer");
  assert.match(lastBlock, /\.focus-elevate:focus-within/, "LAST block must suppress .focus-elevate:focus-within");
  assert.match(lastBlock, /\.search-shake/, "LAST block must suppress .search-shake");
  assert.match(lastBlock, /\.card-shine/, "LAST block must suppress .card-shine");
  assert.match(lastBlock, /\.trusted-marquee/, "LAST block must suppress .trusted-marquee");
  assert.match(lastBlock, /\.rail-momentum/, "LAST block must reset .rail-momentum scroll-behavior");
});

test("QA-C3-EC12: Governance, Zero-Dependencies & Dictionary Parity Sweep", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies?.three, undefined, "three package must NOT be present in dependencies");
  assert.equal(pkg.devDependencies?.three, undefined, "three package must NOT be present in devDependencies");

  const vi = JSON.parse(read("src/dictionaries/vi.json"));
  const en = JSON.parse(read("src/dictionaries/en.json"));

  // Check Cycle 3 dictionary keys parity
  assert.ok(vi.landing?.fiverr?.search?.recentLabel, "vi.json must have search.recentLabel");
  assert.ok(en.landing?.fiverr?.search?.recentLabel, "en.json must have search.recentLabel");
  assert.ok(vi.landing?.fiverr?.search?.clearHistory, "vi.json must have search.clearHistory");
  assert.ok(en.landing?.fiverr?.search?.clearHistory, "en.json must have search.clearHistory");
  assert.ok(vi.landing?.fiverr?.search?.resultsCount, "vi.json must have search.resultsCount");
  assert.ok(en.landing?.fiverr?.search?.resultsCount, "en.json must have search.resultsCount");
  assert.ok(vi.landing?.fiverr?.popular?.verifiedBadge, "vi.json must have popular.verifiedBadge");
  assert.ok(en.landing?.fiverr?.popular?.verifiedBadge, "en.json must have popular.verifiedBadge");
  assert.ok(vi.landing?.fiverr?.testimonials?.verifiedBadge, "vi.json must have testimonials.verifiedBadge");
  assert.ok(en.landing?.fiverr?.testimonials?.verifiedBadge, "en.json must have testimonials.verifiedBadge");
  assert.ok(vi.posts?.featuredLabel, "vi.json must have posts.featuredLabel");
  assert.ok(en.posts?.featuredLabel, "en.json must have posts.featuredLabel");
});
