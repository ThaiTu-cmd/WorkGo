import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("W-N4 / REG-01: Landing orchestrator mounts all 11 sections in strict canonical order", () => {
  const landingPath = "src/components/landing/fiverr/fiverr-landing.tsx";
  assert.ok(exists(landingPath), "fiverr-landing.tsx must exist");
  const src = read(landingPath);

  const sections = [
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

  let lastIndex = -1;
  for (const section of sections) {
    const idx = src.indexOf(`<${section}`);
    assert.ok(idx > -1, `Section <${section}> must be rendered in fiverr-landing.tsx`);
    assert.ok(
      idx > lastIndex,
      `Section <${section}> is out of canonical order! Found at position ${idx}, previous was at ${lastIndex}`
    );
    lastIndex = idx;
  }
});

test("W-N4 / REG-02: All 11 local WebP images and attribution metadata exist and are valid files", () => {
  const expectedImages = [
    "popular-tiktok-shop.webp",
    "popular-ai-programming.webp",
    "popular-web-dev.webp",
    "popular-video-edit.webp",
    "popular-software-dev.webp",
    "popular-book-publish.webp",
    "panel-find-experts.webp",
    "panel-ai-automation.webp",
    "guide-brief.webp",
    "guide-portfolio.webp",
    "guide-budget.webp",
  ];

  for (const img of expectedImages) {
    const imgPath = path.join(ROOT, "public/images/landing", img);
    assert.ok(fs.existsSync(imgPath), `Local WebP image ${img} must exist in public/images/landing/`);
    const stat = fs.statSync(imgPath);
    assert.ok(stat.size > 100, `Image ${img} must not be empty (size: ${stat.size} bytes)`);
    assert.ok(stat.size < 150000, `Image ${img} must be optimized under 150KB (actual: ${stat.size} bytes)`);
  }

  const attrPath = path.join(ROOT, "public/images/landing/ATTRIBUTION.md");
  assert.ok(fs.existsSync(attrPath), "public/images/landing/ATTRIBUTION.md must exist");
  const attrContent = fs.readFileSync(attrPath, "utf-8");
  assert.match(attrContent, /CC0|Public Domain/, "ATTRIBUTION.md must state image licensing");
});

test("W-N4 / REG-03: Particle ocean video and fallback poster assets exist in public/assets/", () => {
  const assets = [
    "particle-ocean.mp4",
    "particle-ocean.webm",
    "particle-ocean-fallback.webp",
  ];

  for (const asset of assets) {
    const assetPath = path.join(ROOT, "public/assets", asset);
    assert.ok(fs.existsSync(assetPath), `Asset ${asset} must exist in public/assets/`);
    const stat = fs.statSync(assetPath);
    assert.ok(stat.size > 100, `Asset ${asset} must not be empty`);
  }
});

test("W-N4 / REG-04: Legacy WorkGo landing tree is preserved behind hidden wrapper for regression safety", () => {
  const wrapperPath = "src/components/landing/workgo-landing-page.tsx";
  assert.ok(exists(wrapperPath), "workgo-landing-page.tsx must exist");
  const src = read(wrapperPath);

  assert.match(src, /<FiverrLanding\s+locale=\{locale\}\s*\/>/, "FiverrLanding must be the primary render target");
  assert.match(src, /className="hidden"/, "Legacy components must be enclosed in hidden wrapper");
  assert.match(src, /LandingStaticBackground/, "LandingStaticBackground must be preserved in hidden tree");
  assert.match(src, /WorkgoNavbar/, "WorkgoNavbar must be preserved in hidden tree");
  assert.match(src, /ParticleOceanHero/, "ParticleOceanHero must be preserved in hidden tree");
  assert.match(src, /WorkgoLandingSections/, "WorkgoLandingSections must be preserved in hidden tree");
});

test("W-N4 / REG-05: Zero broken '#' href anchors on interactive buttons across landing components", () => {
  const landingComponents = [
    "src/components/landing/fiverr/fiverr-header.tsx",
    "src/components/landing/fiverr/fiverr-hero.tsx",
    "src/components/landing/fiverr/fiverr-value-props.tsx",
    "src/components/landing/fiverr/fiverr-feature-panels.tsx",
    "src/components/landing/fiverr/fiverr-cta-banner.tsx",
    "src/components/landing/fiverr/fiverr-button.tsx",
  ];

  for (const comp of landingComponents) {
    if (exists(comp)) {
      const src = read(comp);
      // Ensure no standalone href="#" without an anchor identifier
      const deadHrefMatches = src.match(/href=["']#["']/g);
      assert.strictEqual(
        deadHrefMatches,
        null,
        `Component ${comp} contains dead href="#" anchor(s)`
      );
    }
  }
});

test("W-N4 / REG-06: Reduced-motion guards are wired across landing animation layers", () => {
  const heroSrc = read("src/components/landing/fiverr/fiverr-hero.tsx");
  assert.match(heroSrc, /prefers-reduced-motion/, "Hero must check prefers-reduced-motion");

  const cssSrc = read("src/app/globals.css");
  assert.match(
    cssSrc,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    "globals.css must have prefers-reduced-motion media query"
  );
  assert.match(
    cssSrc,
    /\.rail-momentum/,
    "globals.css must contain .rail-momentum utility"
  );
});
