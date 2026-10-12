import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// =============================================================================
// PLAN-FIVERR-UI — static gate for the Fiverr-inspired marketplace landing.
// Mirrors the assertion style of the existing suite (literal source matching)
// so regressions in the measured geometry are caught without a browser.
// =============================================================================

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

const BASE = "src/components/landing/fiverr/";
const FILES = {
  landing: BASE + "fiverr-landing.tsx",
  header: BASE + "fiverr-header.tsx",
  trending: BASE + "fiverr-trending-bar.tsx",
  hero: BASE + "fiverr-hero.tsx",
  categories: BASE + "fiverr-category-grid.tsx",
  popular: BASE + "fiverr-popular-services.tsx",
  valueProps: BASE + "fiverr-value-props.tsx",
  panels: BASE + "fiverr-feature-panels.tsx",
  guides: BASE + "fiverr-guides.tsx",
  testimonials: BASE + "fiverr-testimonials.tsx",
  cta: BASE + "fiverr-cta-banner.tsx",
  footer: BASE + "fiverr-footer.tsx",
  carousel: BASE + "fiverr-carousel.tsx",
};

test("FIV-01 - Every Fiverr section component exists", () => {
  for (const [name, rel] of Object.entries(FILES)) {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `${name} must exist at ${rel}`);
  }
});

test("FIV-02 - Landing orchestrator wires all sections in Fiverr order and paints a light shell", () => {
  const src = read(FILES.landing);
  assert.match(src, /export function FiverrLanding/);
  assert.match(src, /locale:\s*string/);
  const order = [
    "FiverrHeader",
    "FiverrTrendingBar",
    "FiverrHero",
    "FiverrCategoryGrid",
    "FiverrPopularServices",
    "FiverrValueProps",
    "FiverrFeaturePanels",
    "FiverrGuides",
    "FiverrTestimonials",
    "FiverrCtaBanner",
    "FiverrFooter",
  ];
  let cursor = -1;
  for (const name of order) {
    const idx = src.indexOf("<" + name);
    assert.ok(idx > cursor, `${name} must appear after the previous section`);
    cursor = idx;
  }
  assert.match(src, /bg-white/);
  assert.match(src, /overflow-x-hidden/);
  assert.match(src, /useTranslations\(["']landing\.fiverr["']\)/);
});

test("FIV-03 - Header replicates measured Fiverr geometry", () => {
  const src = read(FILES.header);
  assert.match(src, /bg-white/);
  assert.match(src, /border-b/);
  assert.match(src, /#DADBDD/);
  assert.match(src, /h-\[53px\]|py-4/);
  assert.match(src, /rounded-lg/);
  assert.match(src, /bg-\[#222325\]/);
  assert.match(src, /h-\[42px\]/);
  assert.match(src, /<ThemeToggle/);
  assert.match(src, /<LanguageSwitcher/);
  assert.match(src, /href=\{`\/\$\{locale\}\/login`\}/);
  assert.match(src, /href=\{`\/\$\{locale\}\/register`\}/);
  assert.match(src, /useState/);
  assert.match(src, /aria-expanded/);
  assert.match(src, /aria-controls/);
  assert.doesNotMatch(src, /<iframe/i);
});

test("FIV-04 - Hero reproduces measured typography, search bar and pause control", () => {
  const src = read(FILES.hero);
  assert.match(src, /text-\[32px\]/);
  assert.match(src, /md:text-\[72px\]/);
  assert.match(src, /tracking-\[-0\.06em\]/);
  assert.match(src, /max-w-\[613px\]/);
  assert.match(src, /max-w-\[1078px\]/);
  assert.match(src, /rounded-xl/);
  assert.match(src, /h-\[52px\]/);
  assert.match(src, /md:h-\[60px\]/);
  assert.match(src, /particle-ocean\.webm/);
  assert.match(src, /particle-ocean-fallback/);
  assert.match(src, /aria-label/);
  assert.match(src, /useSyncExternalStore/);
});

test("FIV-05 - Measured panel colors and radii are present", () => {
  const panels = read(FILES.panels);
  assert.match(panels, /#003912/);
  assert.match(panels, /#00732E/);
  assert.match(panels, /#421300/);
  assert.match(panels, /rounded-2xl/);
  const cta = read(FILES.cta);
  assert.match(cta, /#4D1727/);
  assert.match(cta, /#FF7640/);
  assert.match(cta, /fiverr-display/);
  const popular = read(FILES.popular);
  assert.match(popular, /#003912/);
  assert.match(popular, /w-\[200px\]/);
  const cats = read(FILES.categories);
  assert.match(cats, /w-\[104px\]|w-\[129px\]/);
  assert.match(cats, /h-\[129px\]/);
});

test("FIV-06 - Footer ships five columns, dynamic year and legal links", () => {
  const src = read(FILES.footer);
  assert.match(src, /new Date\(\)\.getFullYear\(\)/);
  assert.match(src, /lg:grid-cols-5/);
  assert.match(src, /border-t/);
  assert.match(src, /WorkGo/);
  assert.match(src, /<footer/);
});

test("FIV-07 - Carousel is keyboard accessible and boundary aware", () => {
  const src = read(FILES.carousel);
  assert.match(src, /export function FiverrCarousel/);
  assert.match(src, /scrollBy/);
  assert.match(src, /aria-label/);
  assert.match(src, /disabled/);
  assert.match(src, /ResizeObserver/);
  assert.match(src, /typeof ResizeObserver/);
});

test("FIV-08 - Reduced-motion and hydration guards are wired", () => {
  const hero = read(FILES.hero);
  assert.match(hero, /prefers-reduced-motion/);
  const css = read("src/app/globals.css");
  assert.match(css, /\.fiverr-display/);
  assert.match(css, /\.fiverr-no-scrollbar/);
  assert.match(css, /@keyframes fiverrFadeUp/);
  assert.match(css, /@keyframes fiverrPan/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  // Append-only guarantee
  assert.match(css, /\.pressable/);
  assert.match(css, /\.landing-static-cone/);
  assert.match(css, /scroll-behavior: smooth/);
  assert.match(css, /\[data-theme="light"\] \.landing-cta-panel/);
});

test("FIV-09 - Integration: legacy WorkGo landing tree is preserved behind a hidden wrapper", () => {
  const src = read("src/components/landing/workgo-landing-page.tsx");
  assert.match(src, /<FiverrLanding\s+locale=\{locale\}\s*\/>/);
  assert.match(src, /<LandingStaticBackground\s*\/>/);
  assert.match(src, /<WorkgoNavbar/);
  assert.match(src, /<ParticleOceanHero/);
  assert.match(src, /<WorkgoLandingSections/);
  assert.match(src, /className="hidden"/);
  assert.ok(!src.includes("ParticleOceanWebGL"));
  assert.doesNotMatch(src, /<iframe/i);
});

test("FIV-10 - No prohibited Tailwind pastel utilities leaked into src/", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(tsx|ts|css)$/.test(e.name)) offenders.push(full);
    }
  };
  walk(path.join(ROOT, "src"));
  const bad = offenders.filter((f) =>
    /bg-(green|red|blue|purple|amber|slate|gray)-50(?!\d)|border-(green|red|blue|purple|amber|slate|gray)-200(?!\d)/.test(
      fs.readFileSync(f, "utf-8")
    )
  );
  assert.deepEqual(
    bad.map((f) => path.relative(path.join(ROOT, "src"), f)),
    []
  );
});

test("FIV-11 - Dictionaries define landing.fiverr with full parity", () => {
  const vi = JSON.parse(read("src/dictionaries/vi.json"));
  const en = JSON.parse(read("src/dictionaries/en.json"));
  const viKeys = Object.keys(vi.landing.fiverr).sort();
  const enKeys = Object.keys(en.landing.fiverr).sort();
  assert.deepEqual(viKeys, enKeys);
  for (const k of [
    "header",
    "trending",
    "hero",
    "categories",
    "popular",
    "valueProps",
    "panels",
    "guides",
    "cta",
    "footer",
  ]) {
    assert.ok(viKeys.includes(k), `landing.fiverr.${k} must exist in both locales`);
  }
});

test("FIV-12 - Content module falls back to Vietnamese for unknown locales", async () => {
  const mod = await import("../src/lib/landing/fiverr-content.ts");
  assert.equal(mod.getFiverrContent("en").hero.searchPlaceholder.length > 0, true);
  assert.deepEqual(mod.getFiverrContent("fr"), mod.getFiverrContent("vi"));
  assert.deepEqual(mod.getFiverrContent(""), mod.getFiverrContent("vi"));
  assert.deepEqual(mod.getFiverrContent(undefined), mod.getFiverrContent("vi"));
});