import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("C2-MARKET-01: Quick-filter pills row renders on /posts synchronized with Landing categories", () => {
  const postsPageSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsPageSrc, /pill-scroll/, "Must contain pill-scroll class");
  assert.match(postsPageSrc, /quickFilterLabel/, "Must have aria-label with quickFilterLabel");
  assert.match(postsPageSrc, /quickFilterAll/, "Must render quickFilterAll button");
  assert.match(postsPageSrc, /aria-pressed=\{!qParam\}/, "All button must toggle aria-pressed based on !qParam");
  assert.match(postsPageSrc, /aria-pressed=\{qParam === label\}/, "Pill buttons must toggle aria-pressed when selected");
  assert.match(postsPageSrc, /getFiverrContent\(locale\)\.categories\.items/, "Must derive pills from Landing categories");
});

test("C2-MARKET-02: Popular services define priceFrom and format price badge accurately", () => {
  const contentSrc = read("src/lib/landing/fiverr-content.ts");
  const popSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");

  assert.match(contentSrc, /priceFrom:\s*499000/, "tiktok-shop must have priceFrom 499000");
  assert.match(contentSrc, /priceFrom:\s*1200000/, "ai-programming must have priceFrom 1200000");
  assert.match(contentSrc, /priceFrom:\s*1500000/, "web-development must have priceFrom 1500000");
  assert.match(contentSrc, /priceFrom:\s*399000/, "video-editing must have priceFrom 399000");
  assert.match(contentSrc, /priceFrom:\s*2500000/, "software-development must have priceFrom 2500000");
  assert.match(contentSrc, /priceFrom:\s*899000/, "book-publishing must have priceFrom 899000");

  assert.match(popSrc, /formatPrice/, "Must have formatPrice helper");
  assert.match(popSrc, /Intl\.NumberFormat/, "Must format using Intl.NumberFormat");
  assert.match(popSrc, /service\.priceFrom/, "Must render price badge for service.priceFrom");
});

test("C2-MARKET-03: FiverrTestimonials component exists with 3 community quotes and star ratings", () => {
  const compPath = "src/components/landing/fiverr/fiverr-testimonials.tsx";
  assert.ok(exists(compPath), "fiverr-testimonials.tsx must exist");
  const compSrc = read(compPath);

  assert.match(compSrc, /testimonials\.title/, "Must render testimonials title");
  assert.match(compSrc, /testimonials\.items\.map/, "Must iterate over testimonial items");
  assert.match(compSrc, /<Star/, "Must render Star ratings");
  assert.match(compSrc, /t\.initials/, "Must render avatar initials");

  const landingSrc = read("src/components/landing/fiverr/fiverr-landing.tsx");
  assert.match(landingSrc, /<FiverrTestimonials/, "FiverrLanding must render FiverrTestimonials");
  assert.ok(
    landingSrc.indexOf("<FiverrGuides") < landingSrc.indexOf("<FiverrTestimonials") &&
    landingSrc.indexOf("<FiverrTestimonials") < landingSrc.indexOf("<FiverrCtaBanner"),
    "FiverrTestimonials must be ordered between FiverrGuides and FiverrCtaBanner"
  );
});

test("C2-MARKET-04: Content fallback handles unexpected locales gracefully", async () => {
  const { getFiverrContent } = await import(
    `file://${path.join(ROOT, "src/lib/landing/fiverr-content.ts").replace(/\\/g, "/")}`
  );

  const frContent = getFiverrContent("fr");
  assert.ok(frContent, "Must return fallback content for unexpected locale 'fr'");
  assert.equal(frContent.testimonials.items.length, 3, "Fallback must include 3 testimonial items");
  assert.equal(frContent.popular.services.length, 6, "Fallback must include 6 popular services");
});
