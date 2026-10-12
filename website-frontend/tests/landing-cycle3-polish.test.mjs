import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { VND_PER_USD, formatPriceVND } from "../src/lib/landing/format-price.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

test("C3-POL-01: Currency parity library contract", () => {
  assert.equal(VND_PER_USD, 25000, "VND_PER_USD rate must be 25,000");

  const viPrice = formatPriceVND(1200000, "vi");
  assert.match(viPrice, /Từ/, "VI price must begin with 'Từ '");
  assert.match(viPrice, /1\.200\.000/, "VI price must format with dot thousands separator");
  assert.match(viPrice, /₫|đ/, "VI price must contain VND currency symbol");

  const enPrice = formatPriceVND(1200000, "en");
  assert.equal(enPrice, "From $48", "1,200,000 VND / 25,000 must round to $48");

  const enSmall = formatPriceVND(500000, "en");
  assert.equal(enSmall, "From $20", "500,000 VND / 25,000 must round to $20");

  const enMin = formatPriceVND(10000, "en");
  assert.equal(enMin, "From $1", "Smallest amount must clamp to minimum $1");
});

test("C3-POL-02: Popular services centralized currency formatting and no local Intl duplicate", () => {
  const popularSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  assert.match(popularSrc, /import\s*\{[^}]*formatPriceVND[^}]*\}\s*from/, "Must import centralized formatPriceVND");
  assert.ok(!popularSrc.includes("new Intl.NumberFormat"), "fiverr-popular-services.tsx must not contain local Intl duplicate");
  assert.match(popularSrc, /formatPriceVND\(service\.priceFrom,\s*locale\)/, "Must format service priceFrom with locale");
});

test("C3-POL-03: Verified badges with ShieldCheck and accessible contrast", () => {
  const popularSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  const testimonialsSrc = read("src/components/landing/fiverr/fiverr-testimonials.tsx");

  assert.match(popularSrc, /ShieldCheck/, "Popular services must include ShieldCheck icon");
  assert.match(popularSrc, /bg-\[#00732E\]/, "Popular services verified badge must use #00732E for WCAG AA contrast");

  assert.match(testimonialsSrc, /ShieldCheck/, "Testimonials must include ShieldCheck icon");
  assert.match(testimonialsSrc, /bg-\[#00732E\]/, "Testimonials verified badge must use #00732E for WCAG AA contrast");
});

test("C3-POL-04: Posts page filtering state & skeleton-transition", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsSrc, /const\s+\[filtering,\s*setFiltering\]\s*=\s*React\.useState\(false\)/, "Must track filtering state");
  assert.match(postsSrc, /const\s+firstRun\s*=\s*React\.useRef\(true\)/, "Must track initial mount with firstRun ref");
  assert.match(postsSrc, /loading\s*\|\|\s*filtering/, "Must show skeleton grid during initial load or filter transition");
});

test("C3-POL-05: Zero-result featured chips & dictionary key parity", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsSrc, /featuredLabels/, "Posts page must prepare featuredLabels for zero-result");
  assert.match(postsSrc, /t\(["']featuredLabel["']\)/, "Must localize featured jobs prompt");
  assert.match(postsSrc, /updateQuery\(\{\s*q:\s*label,\s*page:\s*1\s*\}\)/, "Clicking featured chip must navigate to ?q=");

  const vi = JSON.parse(read("src/dictionaries/vi.json"));
  const en = JSON.parse(read("src/dictionaries/en.json"));

  assert.ok(vi.posts.featuredLabel, "vi.json must have posts.featuredLabel");
  assert.ok(en.posts.featuredLabel, "en.json must have posts.featuredLabel");
  assert.ok(vi.landing.fiverr.popular.verifiedBadge, "vi.json must have popular.verifiedBadge");
  assert.ok(en.landing.fiverr.popular.verifiedBadge, "en.json must have popular.verifiedBadge");
  assert.ok(vi.landing.fiverr.testimonials.verifiedBadge, "vi.json must have testimonials.verifiedBadge");
  assert.ok(en.landing.fiverr.testimonials.verifiedBadge, "en.json must have testimonials.verifiedBadge");
});
