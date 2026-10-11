import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// =============================================================================
// QA TEST SUITE: FIVERR UI REPLICATION — EDGE CASES, RESILIENCE & BOUNDARIES
// =============================================================================

test("QA-FIV-EC01: getFiverrContent robust fallback on edge-case locales", async () => {
  const { getFiverrContent, FIVERR_CONTENT } = await import("../src/lib/landing/fiverr-content.ts");

  // Valid locales
  const vi = getFiverrContent("vi");
  const en = getFiverrContent("en");
  assert.ok(vi, "Vietnamese content must be defined");
  assert.ok(en, "English content must be defined");
  assert.notEqual(vi.hero.headline, en.hero.headline, "Headlines must be localized");

  // Edge cases: empty, null, undefined, unsupported languages, numbers, uppercase
  const edgeCases = ["", null, undefined, "fr", "es", "de", "zh", "ja", "123", "VI", "EN", "vi-VN"];
  for (const locale of edgeCases) {
    const res = getFiverrContent(locale);
    assert.ok(res, `Content must be defined for locale: ${String(locale)}`);
    if (locale === "en") {
      assert.deepEqual(res, en, "Locale 'en' must resolve to English content");
    } else {
      assert.deepEqual(res, vi, `Locale '${String(locale)}' must safely fallback to Vietnamese`);
    }
  }

  // Verify all sections exist in both locales
  for (const [lang, content] of Object.entries(FIVERR_CONTENT)) {
    assert.ok(content.nav.pro, `${lang}: nav.pro must exist`);
    assert.ok(content.nav.explore, `${lang}: nav.explore must exist`);
    assert.ok(content.nav.becomeSeller, `${lang}: nav.becomeSeller must exist`);
    assert.ok(content.nav.signIn, `${lang}: nav.signIn must exist`);
    assert.ok(content.nav.join, `${lang}: nav.join must exist`);
    assert.ok(content.nav.searchPlaceholder, `${lang}: nav.searchPlaceholder must exist`);
    assert.ok(content.nav.mobileSearchPlaceholder, `${lang}: nav.mobileSearchPlaceholder must exist`);

    assert.ok(content.trending.label, `${lang}: trending.label must exist`);
    assert.ok(Array.isArray(content.trending.items) && content.trending.items.length >= 6, `${lang}: trending.items >= 6`);

    assert.ok(content.hero.headline, `${lang}: hero.headline must exist`);
    assert.ok(content.hero.searchPlaceholder, `${lang}: hero.searchPlaceholder must exist`);
    assert.ok(Array.isArray(content.hero.chips) && content.hero.chips.length >= 5, `${lang}: hero.chips >= 5`);
    assert.ok(content.hero.trustedBy, `${lang}: hero.trustedBy must exist`);
    assert.ok(Array.isArray(content.hero.trustedLogos) && content.hero.trustedLogos.length >= 4, `${lang}: hero.trustedLogos >= 4`);

    assert.ok(content.categories.title, `${lang}: categories.title must exist`);
    assert.ok(typeof content.categories.viewMore === "function", `${lang}: categories.viewMore must be a function`);
    assert.ok(content.categories.viewLess, `${lang}: categories.viewLess must exist`);
    assert.equal(content.categories.items.length, 9, `${lang}: categories must have exactly 9 items`);

    assert.ok(content.popular.title, `${lang}: popular.title must exist`);
    assert.equal(content.popular.services.length, 6, `${lang}: popular services must have 6 items`);

    assert.ok(content.valueProps.title, `${lang}: valueProps.title must exist`);
    assert.ok(content.valueProps.cta, `${lang}: valueProps.cta must exist`);
    assert.equal(content.valueProps.items.length, 4, `${lang}: valueProps must have 4 items`);

    assert.equal(content.panels.length, 2, `${lang}: panels must have 2 items`);
    for (const panel of content.panels) {
      assert.ok(panel.id, `${lang}: panel id must exist`);
      assert.ok(panel.title, `${lang}: panel title must exist`);
      assert.ok(Array.isArray(panel.bullets) && panel.bullets.length >= 3, `${lang}: panel bullets >= 3`);
      assert.ok(panel.ctaLabel, `${lang}: panel ctaLabel must exist`);
      assert.ok(panel.ctaHref, `${lang}: panel ctaHref must exist`);
      assert.equal(panel.gradient.length, 2, `${lang}: panel gradient must have 2 colors`);
    }

    assert.ok(content.guides.title, `${lang}: guides.title must exist`);
    assert.ok(content.guides.seeMore, `${lang}: guides.seeMore must exist`);
    assert.equal(content.guides.items.length, 3, `${lang}: guides must have 3 items`);

    assert.ok(content.cta.titleLead, `${lang}: cta.titleLead must exist`);
    assert.ok(content.cta.titleAccent, `${lang}: cta.titleAccent must exist`);
    assert.ok(content.cta.button, `${lang}: cta.button must exist`);

    assert.equal(content.footer.columns.length, 5, `${lang}: footer must have 5 columns`);
    assert.ok(content.footer.copyright, `${lang}: footer.copyright must exist`);
    // Boundary check: ensure copyright does not include literal '©' twice
    assert.ok(!content.footer.copyright.startsWith("©"), `${lang}: footer.copyright must not duplicate the © symbol`);
  }
});

test("QA-FIV-EC02: viewMore function boundary cases (0, negative, large numbers)", async () => {
  const { getFiverrContent } = await import("../src/lib/landing/fiverr-content.ts");

  const vi = getFiverrContent("vi");
  const en = getFiverrContent("en");

  assert.equal(vi.categories.viewMore(3), "Xem thêm 3 danh mục");
  assert.equal(en.categories.viewMore(3), "View 3 more categories");

  assert.equal(vi.categories.viewMore(0), "Xem thêm 0 danh mục");
  assert.equal(en.categories.viewMore(0), "View 0 more categories");

  assert.equal(vi.categories.viewMore(100), "Xem thêm 100 danh mục");
  assert.equal(en.categories.viewMore(100), "View 100 more categories");
});

test("QA-FIV-EC03: Design tokens integrity and match measured fiverr specifications", async () => {
  const { FIVERR_COLOR, FIVERR_RADIUS, FIVERR_SHADOW, FIVERR_TYPE_SCALE, FIVERR_SPACE } = await import(
    "../src/lib/landing/fiverr-tokens.ts"
  );

  // Color tokens
  assert.equal(FIVERR_COLOR.ink900, "#222325");
  assert.equal(FIVERR_COLOR.ink700, "#404145");
  assert.equal(FIVERR_COLOR.ink500, "#62646A");
  assert.equal(FIVERR_COLOR.hairline, "#DADBDD");
  assert.equal(FIVERR_COLOR.fieldBorder, "#C5C6C9");
  assert.equal(FIVERR_COLOR.btnDark, "#222325");
  assert.equal(FIVERR_COLOR.btnSearch, "#404145");
  assert.equal(FIVERR_COLOR.cardGreen, "#003912");
  assert.equal(FIVERR_COLOR.cardGreenBright, "#00732E");
  assert.equal(FIVERR_COLOR.panelBrown, "#421300");
  assert.equal(FIVERR_COLOR.panelPlum, "#4D1727");
  assert.equal(FIVERR_COLOR.accent, "#FF7640");
  assert.equal(FIVERR_COLOR.brand, "#1DBF73");

  // Radii
  assert.equal(FIVERR_RADIUS.chip, 8);
  assert.equal(FIVERR_RADIUS.card, 16);
  assert.equal(FIVERR_RADIUS.input, 12);
  assert.equal(FIVERR_RADIUS.media, 4);
  assert.equal(FIVERR_RADIUS.pill, 9999);

  // Shadows
  assert.ok(FIVERR_SHADOW.card.includes("0 0 11px rgba(0,0,0,0.09)"));
  assert.ok(FIVERR_SHADOW.pop.includes("0 3px 10px rgba(0,0,0,0.13)"));

  // Typography scale
  assert.equal(FIVERR_TYPE_SCALE.h1.desktop, "72px");
  assert.equal(FIVERR_TYPE_SCALE.h1.mobile, "32px");
  assert.equal(FIVERR_TYPE_SCALE.h2Large.desktop, "48px");
  assert.equal(FIVERR_TYPE_SCALE.h2Cta.desktop, "64px");

  // Space
  assert.equal(FIVERR_SPACE.heroHeight.desktop, 680);
  assert.equal(FIVERR_SPACE.heroHeight.mobile, 450);
});

test("QA-FIV-EC04: WORKGO_PALETTE integration in design-tokens.ts includes all Fiverr colors", async () => {
  const { WORKGO_PALETTE } = await import("../src/lib/design-tokens.ts");

  assert.equal(WORKGO_PALETTE.ink900, "#222325");
  assert.equal(WORKGO_PALETTE.ink700, "#404145");
  assert.equal(WORKGO_PALETTE.ink500, "#62646A");
  assert.equal(WORKGO_PALETTE.hairline, "#DADBDD");
  assert.equal(WORKGO_PALETTE.accent, "#FF7640");
  assert.equal(WORKGO_PALETTE.panelGreen, "#003912");
  assert.equal(WORKGO_PALETTE.panelGreenBright, "#00732E");
  assert.equal(WORKGO_PALETTE.panelBrown, "#421300");
  assert.equal(WORKGO_PALETTE.panelPlum, "#4D1727");
});

test("QA-FIV-EC05: Accessibility & WCAG compliance across Fiverr components", () => {
  const header = read("src/components/landing/fiverr/fiverr-header.tsx");
  assert.match(header, /href="#fiverr-main"/, "Must have skip link to #fiverr-main");
  assert.match(header, /sr-only focus:not-sr-only/, "Skip link must use standard sr-only focus reveal pattern");
  assert.match(header, /aria-label=\{t\("header\.brandLabel"\)\}/, "Brand link must have descriptive aria-label");
  assert.match(header, /role="search"/, "Desktop search form must have role='search'");
  assert.match(header, /aria-expanded=\{open\}/, "Mobile hamburger must reflect open state via aria-expanded");
  assert.match(header, /aria-controls=\{drawerId\}/, "Mobile hamburger must associate with drawer id");
  assert.match(header, /e\.key === "Escape"/, "Mobile drawer must dismiss on Escape key press");

  const hero = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(hero, /role="search"/, "Hero search form must have role='search'");
  assert.match(hero, /aria-label=\{t\("hero\.searchSubmitLabel"\)\}/, "Hero search submit button must have aria-label");
  assert.match(hero, /aria-label=\{t\("hero\.chipsLabel"\)\}/, "Hero chip list must have aria-label");
  assert.match(hero, /aria-pressed=\{paused\}/, "Hero video pause toggle must have aria-pressed");

  const carousel = read("src/components/landing/fiverr/fiverr-carousel.tsx");
  assert.match(carousel, /role="region"/, "Carousel container must have role='region'");
  assert.match(carousel, /tabIndex=\{0\}/, "Carousel container must be keyboard focusable");
  assert.match(carousel, /event\.key === "ArrowLeft"/, "Carousel must support ArrowLeft navigation");
  assert.match(carousel, /event\.key === "ArrowRight"/, "Carousel must support ArrowRight navigation");

  const categories = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(categories, /aria-expanded=\{expanded\}/, "Mobile category expand button must have aria-expanded");

  const footer = read("src/components/landing/fiverr/fiverr-footer.tsx");
  assert.match(footer, /aria-label=\{regionLabel\}/, "Footer nav must have accessible label");
});

test("QA-FIV-EC06: Reduced motion resilience across components and CSS", () => {
  const hero = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(hero, /prefers-reduced-motion: reduce/, "Hero must query prefers-reduced-motion");
  assert.match(hero, /reducedMotion\s*\?\s*\(/, "Hero must branch on reducedMotion");
  assert.match(hero, /particle-ocean-fallback\.webp/, "Hero must render static image under reduced motion");
  assert.match(hero, /!reducedMotion/, "Pause button must only mount when motion is allowed");

  const css = read("src/app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, "globals.css must have prefers-reduced-motion query");
  assert.match(css, /\.animate-fiverr-fade-up,\s*\.animate-fiverr-pan,\s*\.fiverr-pause-ring\s*\{\s*animation:\s*none\s*!important;\s*\}/, "CSS animations must disable completely under reduced motion");
  assert.match(css, /\.fiverr-press:hover,\s*\.fiverr-press:active\s*\{\s*transform:\s*none;\s*\}/, "Hover transform physics must disable under reduced motion");
});

test("QA-FIV-EC07: Carousel boundary edge logic (E4, E5, E6)", () => {
  const carousel = read("src/components/landing/fiverr/fiverr-carousel.tsx");
  assert.match(carousel, /const EDGE_SLOP = 4;/, "Carousel must use 4px slop margin for subpixel precision");
  assert.match(carousel, /el\.scrollWidth - el\.clientWidth > EDGE_SLOP/, "Carousel must calculate overflow with slop");
  assert.match(carousel, /disabled=\{!state\.canPrev\}/, "Prev button must disable at start boundary");
  assert.match(carousel, /disabled=\{!state\.canNext\}/, "Next button must disable at end boundary");
  assert.match(carousel, /state\.overflows &&/, "Both buttons must unmount when content does not overflow (E5)");
  assert.match(carousel, /typeof ResizeObserver !== "undefined"/, "ResizeObserver must be guarded against SSR/JSDOM missing object (E6)");
  assert.match(carousel, /window\.addEventListener\("resize", sync\)/, "Must fallback to window resize event listener");
});

test("QA-FIV-EC08: Vietnamese vs English layout typography compensation (E9)", () => {
  const hero = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(hero, /locale === "en"\s*\?\s*"md:text-\[72px\]"\s*:\s*"md:text-\[64px\]"/, "Vietnamese must scale down hero heading from 72px to 64px to prevent 3-line wrap in 613px container");
});

test("QA-FIV-EC09: Clean copyright rendering without duplicate symbol", () => {
  const footer = read("src/components/landing/fiverr/fiverr-footer.tsx");
  assert.match(footer, /© \$\{new Date\(\)\.getFullYear\(\)\} \$\{content\.footer\.copyright\}/, "Must format copyright with dynamic year and copyright name");
  assert.doesNotMatch(footer, /© \$\{new Date\(\)\.getFullYear\(\)\} ©/, "Must never format double ©");
});

test("QA-FIV-EC10: Mobile viewports protection against horizontal overflow", () => {
  const landing = read("src/components/landing/fiverr/fiverr-landing.tsx");
  assert.match(landing, /overflow-x-hidden/, "Root landing shell must prevent horizontal scrollbar");

  const trending = read("src/components/landing/fiverr/fiverr-trending-bar.tsx");
  assert.match(trending, /hidden bg-white md:block/, "Trending bar must be hidden on mobile screens");

  const categories = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(categories, /grid-cols-3 gap-3 md:hidden/, "Categories on mobile must be a 3-column grid");
  assert.match(categories, /items\.slice\(0, MOBILE_VISIBLE\)/, "Categories on mobile must cap visible items");
});
