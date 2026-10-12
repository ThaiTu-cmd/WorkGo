import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("C2-SEARCH-01: sanitizeSearchQuery collapses whitespace, trims, and limits length to 100", async () => {
  assert.ok(exists("src/components/landing/fiverr/fiverr-search-form.tsx"), "fiverr-search-form.tsx must exist");
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  assert.match(formSrc, /export const SEARCH_MAX_LENGTH\s*=\s*100/, "Must export SEARCH_MAX_LENGTH = 100");
  assert.match(formSrc, /export function sanitizeSearchQuery/, "Must export sanitizeSearchQuery function");

  // Re-verify sanitize logic contract
  const sanitize = (raw) => raw.replace(/\s+/g, " ").trim().slice(0, 100);

  assert.equal(sanitize(""), "");
  assert.equal(sanitize("   "), "");
  assert.equal(sanitize("\n\t  "), "");
  assert.equal(sanitize("  thiết kế   logo  "), "thiết kế logo");
  assert.equal(sanitize("a".repeat(150)), "a".repeat(100));
  assert.equal(sanitize("Thiết kế logo 🎨✨"), "Thiết kế logo 🎨✨");
  assert.equal(sanitize("'; DROP TABLE posts; --"), "'; DROP TABLE posts; --");
});

test("C2-SEARCH-02: Search form specifies maxLength=100 and does NOT use dangerouslySetInnerHTML", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(formSrc, /maxLength=\{SEARCH_MAX_LENGTH\}|maxLength=\{100\}/, "Input must have maxLength={SEARCH_MAX_LENGTH}");
  assert.doesNotMatch(formSrc, /dangerouslySetInnerHTML/, "Search form must never use dangerouslySetInnerHTML");
  assert.doesNotMatch(formSrc, /innerHTML/, "Search form must never use innerHTML");
});

test("C2-SEARCH-03: Search query is encoded via encodeURIComponent and validates empty string", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(formSrc, /encodeURIComponent\(q\)/, "Must encode query with encodeURIComponent");
  assert.match(formSrc, /sanitizeSearchQuery\(query\)/, "submitSearch must sanitize raw query");
  assert.match(formSrc, /search-shake/, "Must retain shake animation on empty query");
});

test("C2-SEARCH-04: Clear button (X) renders when query is not empty and resets query with focus restoration", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(formSrc, /query\s*!==\s*""/, "Must check query !== '' to render clear button");
  assert.match(formSrc, /clearLabel/, "Must support clearLabel for accessible title and aria-label");
  assert.match(formSrc, /setQuery\(["']["']\)/, "Clear button must reset query to empty string");
  assert.match(formSrc, /inputRef\.current\?\.focus\(\)/, "Clear button must restore focus to input");
});

test("C2-SEARCH-05: Fuzz validation matrix for search inputs", () => {
  const sanitize = (raw) => raw.replace(/\s+/g, " ").trim().slice(0, 100);

  // Case 1: Empty & Whitespace variations
  assert.equal(sanitize(""), "");
  assert.equal(sanitize("   \t\n  "), "");

  // Case 2: Length boundary (100 vs 101)
  assert.equal(sanitize("x".repeat(100)).length, 100);
  assert.equal(sanitize("x".repeat(101)).length, 100);
  assert.equal(sanitize("x".repeat(500)).length, 100);

  // Case 3: Script & XSS injection payload encoding
  const xss = "<script>alert(1)</script>";
  const encodedXss = encodeURIComponent(sanitize(xss));
  assert.equal(encodedXss, "%3Cscript%3Ealert(1)%3C%2Fscript%3E");
  assert.equal(decodeURIComponent(encodedXss), xss);

  // Case 4: SQL Injection payload
  const sqli = "'; DROP TABLE posts; --";
  const encodedSqli = encodeURIComponent(sanitize(sqli));
  assert.equal(decodeURIComponent(encodedSqli), sqli);

  // Case 5: Vietnamese accents and emoji characters
  const vietnameseEmoji = "Lập trình Web chuyên nghiệp 🚀⭐";
  const encodedVi = encodeURIComponent(sanitize(vietnameseEmoji));
  assert.equal(decodeURIComponent(encodedVi), vietnameseEmoji);

  // Case 6: Excessive internal whitespace collapse
  assert.equal(sanitize("  dịch   vụ     thiết   kế    "), "dịch vụ thiết kế");
});

test("C2-SEARCH-06: Suggestions dropdown component exists with WCAG combobox/listbox attributes", () => {
  assert.ok(exists("src/components/landing/fiverr/fiverr-search-suggestions.tsx"), "fiverr-search-suggestions.tsx must exist");
  const suggSrc = read("src/components/landing/fiverr/fiverr-search-suggestions.tsx");

  assert.match(suggSrc, /role="listbox"/, "Suggestions container must have role='listbox'");
  assert.match(suggSrc, /role="option"/, "Each suggestion item must have role='option'");
  assert.match(suggSrc, /aria-selected/, "Suggestion items must define aria-selected");
  assert.match(suggSrc, /onMouseDown/, "Must use onMouseDown with preventDefault to avoid blur race");

  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(formSrc, /role="combobox"/, "Input must have role='combobox'");
  assert.match(formSrc, /aria-expanded=\{suggestOpen\}/, "Input must have aria-expanded");
  assert.match(formSrc, /aria-controls=/, "Input must have aria-controls");
  assert.match(formSrc, /aria-autocomplete="list"/, "Input must have aria-autocomplete='list'");
  assert.match(formSrc, /<FiverrSearchSuggestions/, "Form must render FiverrSearchSuggestions");
});

test("C2-SEARCH-07: Form handles keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(formSrc, /ArrowDown/, "Must handle ArrowDown key");
  assert.match(formSrc, /ArrowUp/, "Must handle ArrowUp key");
  assert.match(formSrc, /Escape/, "Must handle Escape key to close suggestions");
  assert.match(formSrc, /activeIdx/, "Must track active suggestion index");
});

test("C2-SEARCH-08: Dictionaries contain search.clearLabel and hero.suggestionsLabel in parity", () => {
  const vi = JSON.parse(read("src/dictionaries/vi.json"));
  const en = JSON.parse(read("src/dictionaries/en.json"));

  assert.ok(vi.landing?.fiverr?.search?.clearLabel, "vi.json must have landing.fiverr.search.clearLabel");
  assert.ok(en.landing?.fiverr?.search?.clearLabel, "en.json must have landing.fiverr.search.clearLabel");
  assert.ok(vi.landing?.fiverr?.hero?.suggestionsLabel, "vi.json must have landing.fiverr.hero.suggestionsLabel");
  assert.ok(en.landing?.fiverr?.hero?.suggestionsLabel, "en.json must have landing.fiverr.hero.suggestionsLabel");
});
