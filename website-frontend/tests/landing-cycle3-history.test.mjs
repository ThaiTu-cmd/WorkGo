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

test("C3-HIST-01: Recent searches storage constants and key contract", () => {
  assert.equal(RECENT_SEARCHES_KEY, "workgo_recent_searches", "Key must be workgo_recent_searches");
  assert.equal(RECENT_SEARCHES_MAX, 5, "Max history entries must be 5");
});

test("C3-HIST-02: Recording pushes to front, dedupes case-insensitively, and caps at 5", () => {
  setupMockStorage();

  recordRecentSearch("Design");
  recordRecentSearch("WordPress");
  recordRecentSearch("Logo");
  recordRecentSearch("SEO");
  recordRecentSearch("Video");

  let list = loadRecentSearches();
  assert.deepEqual(list, ["Video", "SEO", "Logo", "WordPress", "Design"]);

  // Record 6th item -> caps at 5, dropping oldest ("Design")
  recordRecentSearch("Translation");
  list = loadRecentSearches();
  assert.equal(list.length, 5);
  assert.equal(list[0], "Translation");
  assert.ok(!list.includes("Design"), "Oldest entry beyond cap of 5 must be dropped");

  // Re-record existing item with different casing -> moves to top
  recordRecentSearch("logo");
  list = loadRecentSearches();
  assert.equal(list.length, 5);
  assert.equal(list[0], "logo", "Existing item re-searched must move to front");
  assert.equal(list.filter((x) => x.toLowerCase() === "logo").length, 1, "Must not duplicate");
});

test("C3-HIST-03: Empty strings and whitespace normalization", () => {
  setupMockStorage({ [RECENT_SEARCHES_KEY]: JSON.stringify(["SEO"]) });

  const res1 = recordRecentSearch("");
  assert.deepEqual(res1, ["SEO"], "Empty query must not add to history");

  const res2 = recordRecentSearch("   ");
  assert.deepEqual(res2, ["SEO"], "Whitespace query must not add to history");

  const res3 = recordRecentSearch("  Web   Design  ");
  assert.deepEqual(res3, ["Web Design", "SEO"], "Multiple spaces must be collapsed");
});

test("C3-HIST-04: Graceful handling of corrupt storage, objects, and null storage", () => {
  // Corrupt JSON string
  setupMockStorage({ [RECENT_SEARCHES_KEY]: "invalid-json{[(" });
  assert.deepEqual(loadRecentSearches(), [], "Corrupt JSON must return empty array without throwing");

  // Object instead of array
  setupMockStorage({ [RECENT_SEARCHES_KEY]: JSON.stringify({ item: "Logo" }) });
  assert.deepEqual(loadRecentSearches(), [], "Non-array JSON must return empty array");

  // Array with mixed types and nulls
  setupMockStorage({ [RECENT_SEARCHES_KEY]: JSON.stringify([null, 123, "Valid Query", "  ", true]) });
  assert.deepEqual(loadRecentSearches(), ["Valid Query"], "Must filter only non-empty strings");

  // Storage access throwing error (private browsing mode)
  globalThis.window = {
    get localStorage() {
      throw new Error("SecurityError: Storage is disabled");
    },
  };
  assert.doesNotThrow(() => {
    const safe = loadRecentSearches();
    assert.deepEqual(safe, []);
    recordRecentSearch("Test");
    clearRecentSearches();
  }, "Private mode / storage disabled must never crash the app");
});

test("C3-HIST-05: QuotaExceededError when setting item does not crash", () => {
  globalThis.window = {
    localStorage: {
      getItem: () => JSON.stringify(["Existing"]),
      setItem: () => {
        throw new Error("QuotaExceededError: storage full");
      },
      removeItem: () => {},
    },
  };

  assert.doesNotThrow(() => {
    const res = recordRecentSearch("New Item");
    assert.deepEqual(res, ["New Item", "Existing"]);
  }, "Storage quota exceeded must be swallowed silently");
});

test("C3-HIST-06: clearRecentSearches removes key completely", () => {
  const store = setupMockStorage({ [RECENT_SEARCHES_KEY]: JSON.stringify(["Logo", "SEO"]) });
  clearRecentSearches();
  assert.equal(store.getItem(RECENT_SEARCHES_KEY), null, "Key must be deleted");
  assert.deepEqual(loadRecentSearches(), []);
});

test("C3-HIST-07: Search Form & Suggestions component wiring", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  const suggestionsSrc = read("src/components/landing/fiverr/fiverr-search-suggestions.tsx");

  assert.match(formSrc, /loadRecentSearches/, "Search form must load recent searches");
  assert.match(formSrc, /recordRecentSearch/, "Search form must record recent search upon query");
  assert.match(formSrc, /clearRecentSearches/, "Search form must clear recent searches on demand");
  assert.match(formSrc, /aria-live="polite"/, "Live announcer region must exist");
  assert.match(formSrc, /role="status"/, "Live announcer region must have role=status");

  assert.match(suggestionsSrc, /role="group"/, "Suggestions must group items by category");
  assert.match(suggestionsSrc, /onClearHistory/, "Suggestions must provide clear history handler");
  assert.match(suggestionsSrc, /History className/, "Suggestions must display history icons for recent items");
});

test("C3-HIST-08: Dictionary parity for recent search keys", () => {
  const vi = JSON.parse(read("src/dictionaries/vi.json"));
  const en = JSON.parse(read("src/dictionaries/en.json"));

  assert.ok(vi.landing.fiverr.search.recentLabel, "vi search.recentLabel must exist");
  assert.ok(en.landing.fiverr.search.recentLabel, "en search.recentLabel must exist");
  assert.ok(vi.landing.fiverr.search.clearHistory, "vi search.clearHistory must exist");
  assert.ok(en.landing.fiverr.search.clearHistory, "en search.clearHistory must exist");
  assert.ok(vi.landing.fiverr.search.resultsCount, "vi search.resultsCount must exist");
  assert.ok(en.landing.fiverr.search.resultsCount, "en search.resultsCount must exist");
});
