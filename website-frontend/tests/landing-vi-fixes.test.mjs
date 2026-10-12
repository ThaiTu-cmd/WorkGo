import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("VI-FIX-01: Header linkBtn has whitespace-nowrap and responsive sizing to prevent Vietnamese text wrap", () => {
  const headerSrc = read("src/components/landing/fiverr/fiverr-header.tsx");
  assert.match(headerSrc, /whitespace-nowrap/, "linkBtn must include whitespace-nowrap");
  assert.match(headerSrc, /shrink-0/, "linkBtn must include shrink-0");
  assert.match(headerSrc, /px-3.*?xl:px-4/, "linkBtn must have responsive padding");
  assert.match(headerSrc, /text-\[15px\].*?xl:text-base/, "linkBtn must scale font size across lg and xl");
  assert.match(headerSrc, /hidden min-w-0 items-center.*?xl:flex/, "becomeSeller must hide below xl to prevent navigation wrap");
});

test("VI-FIX-02: Search form validates empty query and renders aria-live hint and shake animation", () => {
  assert.ok(exists("src/components/landing/fiverr/fiverr-search-form.tsx"), "Shared FiverrSearchForm component must exist");
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");
  assert.match(formSrc, /role=\{role\}/, "Search form must have role='search'");
  assert.match(formSrc, /aria-live="polite"/, "Error message must have aria-live='polite'");
  assert.match(formSrc, /role="alert"/, "Error message must have role='alert'");
  assert.match(formSrc, /search-shake/, "Form must trigger search-shake class on empty submission");
  assert.match(formSrc, /router\.push/, "Form must navigate when query is non-empty");
  assert.match(formSrc, /autoComplete="off"/, "Input must have autoComplete='off'");
  assert.match(formSrc, /inputMode="search"/, "Input must have inputMode='search'");

  // Verification in header and hero
  const headerSrc = read("src/components/landing/fiverr/fiverr-header.tsx");
  assert.match(headerSrc, /<FiverrSearchForm/, "Header must use FiverrSearchForm");

  const heroSrc = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(heroSrc, /<FiverrSearchForm/, "Hero must use FiverrSearchForm");
});

test("VI-FIX-03: Popular services cards have equal height and clamped typography with Image component", () => {
  const popSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  assert.match(popSrc, /h-\[300px\]/, "Popular card height must be fixed to 300px for equal height");
  assert.match(popSrc, /min-h-\[56px\].*?line-clamp-2/, "Service title must have min-h and line-clamp-2");
  assert.match(popSrc, /min-h-\[36px\].*?line-clamp-2/, "Service blurb must have min-h and line-clamp-2");
  assert.match(popSrc, /import (Image from "next\/image"|.*?FiverrImage)/, "Must import Image or FiverrImage");
  assert.match(popSrc, /<Image|<FiverrImage/, "Must render Image or FiverrImage component");
  assert.match(popSrc, /fill|sizes/, "Image must configure layout/sizes");
  assert.match(popSrc, /h-\[148px\]/, "Media container must have 148px height");
});

test("VI-FIX-04: Feature panels and guides have local WebP images and attribution records", () => {
  const expectedImages = [
    "public/images/landing/popular-tiktok-shop.webp",
    "public/images/landing/popular-ai-programming.webp",
    "public/images/landing/popular-web-dev.webp",
    "public/images/landing/popular-video-edit.webp",
    "public/images/landing/popular-software-dev.webp",
    "public/images/landing/popular-book-publish.webp",
    "public/images/landing/panel-find-experts.webp",
    "public/images/landing/panel-ai-automation.webp",
    "public/images/landing/guide-brief.webp",
    "public/images/landing/guide-portfolio.webp",
    "public/images/landing/guide-budget.webp",
  ];

  for (const img of expectedImages) {
    assert.ok(exists(img), `Missing local image: ${img}`);
    const stat = fs.statSync(path.join(ROOT, img));
    assert.ok(stat.size < 150 * 1024, `Image ${img} exceeds 150KB limit (${stat.size} bytes)`);
  }

  assert.ok(exists("public/images/landing/ATTRIBUTION.md"), "ATTRIBUTION.md must exist in images folder");
  const attr = read("public/images/landing/ATTRIBUTION.md");
  assert.match(attr, /popular-tiktok-shop\.webp/);
  assert.match(attr, /panel-find-experts\.webp/);
  assert.match(attr, /guide-brief\.webp/);
  assert.match(attr, /CC0/);

  const panelsSrc = read("src/components/landing/fiverr/fiverr-feature-panels.tsx");
  assert.match(panelsSrc, /<Image|<FiverrImage/, "Panels must render Image or FiverrImage component");

  const guidesSrc = read("src/components/landing/fiverr/fiverr-guides.tsx");
  assert.match(guidesSrc, /<Image|<FiverrImage/, "Guides must render Image or FiverrImage component");
  assert.match(guidesSrc, /min-h-\[56px\].*?line-clamp-2/, "Guide title must have line-clamp-2 and min-h");
});

test("VI-FIX-05: CTA banner accent branches by locale to prevent font diacritic degradation", () => {
  const ctaSrc = read("src/components/landing/fiverr/fiverr-cta-banner.tsx");
  assert.match(ctaSrc, /locale === "vi"/, "CTA must check locale for Vietnamese styling");
  assert.match(ctaSrc, /cta-vi-accent/, "Vietnamese accent must use cta-vi-accent class");
  assert.match(ctaSrc, /fiverr-display/, "English accent must use fiverr-display class");
  assert.match(ctaSrc, /text-balance/, "Heading must use text-balance");

  const css = read("src/app/globals.css");
  assert.match(css, /\.cta-vi-accent/, "globals.css must define .cta-vi-accent");
  assert.match(css, /--font-be-vietnam-pro/, ".cta-vi-accent must map to Be Vietnam Pro font variable");
});
