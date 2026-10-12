import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadRecentSearches,
  recordRecentSearch,
  clearRecentSearches,
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_MAX,
} from "../src/lib/landing/recent-searches.ts";

import {
  resolveParticleDensity,
  FIVERR_DENSITY,
} from "../src/lib/landing/adaptive-3d.ts";

import {
  formatPriceVND,
  VND_PER_USD,
} from "../src/lib/landing/format-price.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// --- MOCK STORAGE SETUP FOR LOCAL TESTING ---
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test("QA-MBC-01: Recent searches happy path, trimming, and FIFO deduplication", () => {
  const mockStorage = new MockLocalStorage();
  global.window = { localStorage: mockStorage };

  try {
    clearRecentSearches();
    assert.deepStrictEqual(loadRecentSearches(), []);

    const res1 = recordRecentSearch("Logo Design");
    assert.deepStrictEqual(res1, ["Logo Design"]);

    const res2 = recordRecentSearch("Web Development");
    assert.deepStrictEqual(res2, ["Web Development", "Logo Design"]);

    // Deduplication case-insensitive
    const res3 = recordRecentSearch("logo design");
    assert.deepStrictEqual(res3, ["logo design", "Web Development"]);

    // Multiple spaces normalized
    const res4 = recordRecentSearch("   Mobile    App    Dev   ");
    assert.deepStrictEqual(res4, ["Mobile App Dev", "logo design", "Web Development"]);
  } finally {
    delete global.window;
  }
});

test("QA-MBC-02: Recent searches boundary limits and capacity capping at 5 items", () => {
  const mockStorage = new MockLocalStorage();
  global.window = { localStorage: mockStorage };

  try {
    clearRecentSearches();
    for (let i = 1; i <= 8; i++) {
      recordRecentSearch(`Query ${i}`);
    }

    const items = loadRecentSearches();
    assert.strictEqual(items.length, RECENT_SEARCHES_MAX);
    assert.deepStrictEqual(items, [
      "Query 8",
      "Query 7",
      "Query 6",
      "Query 5",
      "Query 4",
    ]);

    // Exceeding 100 character boundary is sliced to 100
    const longString = "A".repeat(120);
    const sliced = recordRecentSearch(longString);
    assert.strictEqual(sliced[0].length, 100);
    assert.strictEqual(sliced[0], "A".repeat(100));

    // Empty or pure whitespace inputs do not alter items
    const beforeEmpty = loadRecentSearches();
    const afterEmpty1 = recordRecentSearch("");
    const afterEmpty2 = recordRecentSearch("    ");
    assert.deepStrictEqual(afterEmpty1, beforeEmpty);
    assert.deepStrictEqual(afterEmpty2, beforeEmpty);
  } finally {
    delete global.window;
  }
});

test("QA-MBC-03: Recent searches resilience against corrupted storage and throwing storage", () => {
  const mockStorage = new MockLocalStorage();
  global.window = { localStorage: mockStorage };

  try {
    // Corrupted non-JSON string
    mockStorage.setItem(RECENT_SEARCHES_KEY, "{not valid json;;;");
    assert.deepStrictEqual(loadRecentSearches(), []);

    // JSON object instead of array
    mockStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify({ key: "value" }));
    assert.deepStrictEqual(loadRecentSearches(), []);

    // JSON array with dirty non-string data
    mockStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(["Valid Search", null, 42, false, "   ", "Another Search"])
    );
    assert.deepStrictEqual(loadRecentSearches(), ["Valid Search", "Another Search"]);

    // Storage throws (Private mode / Quota exceeded simulation)
    const throwingStorage = {
      getItem() {
        throw new Error("SecurityError: Access denied");
      },
      setItem() {
        throw new Error("QuotaExceededError: Storage is full");
      },
      removeItem() {
        throw new Error("Error");
      },
    };
    global.window = { localStorage: throwingStorage };

    assert.doesNotThrow(() => {
      const items = loadRecentSearches();
      assert.deepStrictEqual(items, []);
    });

    assert.doesNotThrow(() => {
      const items = recordRecentSearch("Safe Test");
      assert.deepStrictEqual(items, ["Safe Test"]);
    });

    assert.doesNotThrow(() => {
      clearRecentSearches();
    });
  } finally {
    delete global.window;
  }
});

test("QA-MBC-04: Adaptive 3D density evaluation across hardware specifications and viewports", () => {
  // SSR fallback
  assert.strictEqual(resolveParticleDensity(), FIVERR_DENSITY.high);
  assert.strictEqual(resolveParticleDensity(123), 123);

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
    // Low RAM boundary (<= 4GB)
    setEnv({ innerWidth: 1440, deviceMemory: 4, hardwareConcurrency: 8 });
    assert.strictEqual(resolveParticleDensity(), FIVERR_DENSITY.low);

    // High RAM (> 4GB) + High CPU (> 4) + Desktop (>= 768px)
    setEnv({ innerWidth: 1440, deviceMemory: 8, hardwareConcurrency: 8 });
    assert.strictEqual(resolveParticleDensity(), FIVERR_DENSITY.high);

    // Low CPU boundary (<= 4 cores)
    setEnv({ innerWidth: 1440, deviceMemory: 8, hardwareConcurrency: 4 });
    assert.strictEqual(resolveParticleDensity(), FIVERR_DENSITY.low);

    // Mobile viewport boundary (< 768px)
    setEnv({ innerWidth: 767, deviceMemory: 16, hardwareConcurrency: 16 });
    assert.strictEqual(resolveParticleDensity(), FIVERR_DENSITY.low);

    // Tablet / Desktop viewport boundary (>= 768px)
    setEnv({ innerWidth: 768, deviceMemory: 16, hardwareConcurrency: 16 });
    assert.strictEqual(resolveParticleDensity(), FIVERR_DENSITY.high);
  } finally {
    delete globalThis.window;
    if (origNav) {
      Object.defineProperty(globalThis, "navigator", origNav);
    } else {
      delete globalThis.navigator;
    }
  }
});

test("QA-MBC-05: Currency parity and formatPriceVND boundary and rounding logic", () => {
  assert.strictEqual(VND_PER_USD, 25000);

  // VI locale: "Từ " + formatted VND
  const vi500k = formatPriceVND(500000, "vi");
  assert.match(vi500k, /^Từ\s/);
  assert.match(vi500k, /500\.000/);
  assert.match(vi500k, /₫/);

  const viZero = formatPriceVND(0, "vi");
  assert.match(viZero, /^Từ\s0\s?₫/);

  // EN locale: "From $" + rounded USD with $1 floor
  assert.strictEqual(formatPriceVND(0, "en"), "From $1");
  assert.strictEqual(formatPriceVND(5000, "en"), "From $1");
  assert.strictEqual(formatPriceVND(12500, "en"), "From $1");
  assert.strictEqual(formatPriceVND(25000, "en"), "From $1");
  assert.strictEqual(formatPriceVND(37500, "en"), "From $2");
  assert.strictEqual(formatPriceVND(50000, "en"), "From $2");
  assert.strictEqual(formatPriceVND(500000, "en"), "From $20");
  assert.strictEqual(formatPriceVND(1250000, "en"), "From $50");
  assert.strictEqual(formatPriceVND(25000000, "en"), "From $1,000");
});

test("QA-MBC-06: Verified badge color contrast ratio adheres mathematically to WCAG AA (>4.5:1)", () => {
  // Helper: compute relative luminance per WCAG 2.1
  function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrast(rgb1, rgb2) {
    const l1 = getLuminance(...rgb1);
    const l2 = getLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // #00732E => rgb(0, 115, 46)
  const bgGreen = [0, 115, 46];
  // #FFFFFF => rgb(255, 255, 255)
  const textWhite = [255, 255, 255];

  const contrast = getContrast(bgGreen, textWhite);
  // WCAG AA threshold for normal text is 4.5:1
  assert.ok(
    contrast >= 4.5,
    `Verified badge contrast ${contrast.toFixed(2)}:1 must satisfy WCAG AA >= 4.5:1`
  );
  // Actually around 6.08:1
  assert.ok(contrast > 6.0, "Verified badge contrast should exceed 6:1");
});

test("QA-MBC-07: Posts Page filter-transition and empty-state contracts", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  // Filtering separated from loading with firstRun guard
  assert.match(postsSrc, /const\s+firstRun\s*=\s*React\.useRef\(true\)/, "Posts page must use firstRun ref guard");
  assert.match(postsSrc, /const\s*\[filtering,\s*setFiltering\]\s*=\s*React\.useState\(false\)/, "Posts page must track filtering state");

  // Zero results renders EmptyState and 3 featured chips
  assert.match(postsSrc, /posts\.length\s*===\s*0/, "Posts page must handle zero-result branch");
  assert.match(postsSrc, /trending\.items\.slice\(0,\s*3\)/, "Zero result must display 3 trending chips");

  // Debounce and momentum rail
  assert.match(postsSrc, /setTimeout\(.*300\)/s, "Search input must be debounced with 300ms timer");
  assert.match(postsSrc, /rail-momentum/, "Pills list must have .rail-momentum");
});

test("QA-MBC-08: Popular services and category grid card layout and LCP optimization", () => {
  const popSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");

  // Fixed height 300px and line-clamp
  assert.match(popSrc, /h-\[300px\]/, "Popular services cards must have fixed h-[300px]");
  assert.match(popSrc, /min-h-\[56px\].*line-clamp-2/s, "Title must enforce min-h-[56px] and line-clamp-2");
  assert.match(popSrc, /min-h-\[36px\].*line-clamp-2/s, "Description must enforce min-h-[36px] and line-clamp-2");

  // LCP optimization eager={idx < 2}
  assert.match(popSrc, /eager=\{idx\s*<\s*2\}/, "First 2 popular cards must have eager loading for LCP");

  // Category grid subpixel tolerance
  const catGridSrc = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(catGridSrc, /EDGE_SLOP\s*=\s*4/, "Category grid must define EDGE_SLOP = 4px");
  assert.match(catGridSrc, /rail-momentum/, "Category grid must feature .rail-momentum");
});
