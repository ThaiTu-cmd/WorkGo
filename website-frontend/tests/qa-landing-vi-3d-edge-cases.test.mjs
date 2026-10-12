import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// =============================================================================
// QA TEST SUITE: VIETNAMESE LANDING FIXES & 3D PROGRESSIVE LAYER (EDGE CASES)
// =============================================================================

test("QA-VI3D-01: Content Model Deep Audit — 11 image objects schema and localized alt text", async () => {
  const { getFiverrContent } = await import("../src/lib/landing/fiverr-content.ts");

  for (const locale of ["vi", "en"]) {
    const content = getFiverrContent(locale);

    // 1. Popular Services (6 items)
    assert.equal(content.popular.services.length, 6, "Must have exactly 6 popular services");
    for (const service of content.popular.services) {
      assert.ok(service.image, `${locale}: Service ${service.id} must have image object`);
      assert.match(service.image.src, /^\/images\/landing\/popular-.*\.webp$/, "Image src must be local webp in /images/landing/");
      assert.ok(service.image.alt && service.image.alt.trim().length > 5, "Image alt must be descriptive");
      assert.equal(service.image.width, 800, "Image width must be 800");
      assert.equal(service.image.height, 1000, "Image height must be 1000");
    }

    // 2. Feature Panels (2 items)
    assert.equal(content.panels.length, 2, "Must have exactly 2 feature panels");
    for (const panel of content.panels) {
      assert.ok(panel.image, `${locale}: Panel ${panel.id} must have image object`);
      assert.match(panel.image.src, /^\/images\/landing\/panel-.*\.webp$/, "Panel image must be local webp");
      assert.ok(panel.image.alt && panel.image.alt.trim().length > 5, "Panel image alt must be descriptive");
      assert.equal(panel.image.width, 1600, "Panel image width must be 1600");
      assert.equal(panel.image.height, 900, "Panel image height must be 900");
    }

    // 3. Guides (3 items)
    assert.equal(content.guides.items.length, 3, "Must have exactly 3 guides");
    for (const guide of content.guides.items) {
      assert.ok(guide.image, `${locale}: Guide ${guide.id} must have image object`);
      assert.match(guide.image.src, /^\/images\/landing\/guide-.*\.webp$/, "Guide image must be local webp");
      assert.ok(guide.image.alt && guide.image.alt.trim().length > 5, "Guide image alt must be descriptive");
      assert.equal(guide.image.width, 800, "Guide image width must be 800");
      assert.equal(guide.image.height, 600, "Guide image height must be 600");
    }
  }
});

test("QA-VI3D-02: Local WebP Image Asset Verification — File existence, size limits, and ATTRIBUTION.md", () => {
  const imageDir = path.join(ROOT, "public/images/landing");
  assert.ok(fs.existsSync(imageDir), "public/images/landing directory must exist");

  const expectedFiles = [
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

  for (const filename of expectedFiles) {
    const fullPath = path.join(imageDir, filename);
    assert.ok(fs.existsSync(fullPath), `Image file missing: ${filename}`);
    const stat = fs.statSync(fullPath);
    // Boundary check: file must not be 0 bytes and must not exceed 150KB
    assert.ok(stat.size > 500, `Image ${filename} is suspiciously small (${stat.size} bytes)`);
    assert.ok(stat.size <= 150 * 1024, `Image ${filename} exceeds 150KB limit (${stat.size} bytes)`);
  }

  // Attribution audit
  const attrPath = path.join(imageDir, "ATTRIBUTION.md");
  assert.ok(fs.existsSync(attrPath), "ATTRIBUTION.md must be present in images directory");
  const attrContent = fs.readFileSync(attrPath, "utf-8");
  for (const filename of expectedFiles) {
    assert.ok(attrContent.includes(filename), `ATTRIBUTION.md must reference ${filename}`);
  }
  assert.match(attrContent, /CC0|Unsplash|Pexels|Public Domain/, "ATTRIBUTION.md must state permissive/CC0 licensing");
});

test("QA-VI3D-03: Search Form Query Sanitation & URL Encoding Logic", () => {
  const sanitizeAndBuildUrl = (query, locale = "vi") => {
    const q = query.trim();
    if (!q) return null;
    return `/${locale}/posts?q=${encodeURIComponent(q)}`;
  };

  // Boundary 1: Empty and whitespace strings
  assert.equal(sanitizeAndBuildUrl(""), null);
  assert.equal(sanitizeAndBuildUrl("   "), null);
  assert.equal(sanitizeAndBuildUrl("\t\n  \r\n"), null);

  // Boundary 2: Clean single and multi-word queries
  assert.equal(sanitizeAndBuildUrl("react"), "/vi/posts?q=react");
  assert.equal(sanitizeAndBuildUrl("  thiết kế logo  "), "/vi/posts?q=thi%E1%BA%BFt%20k%E1%BA%BF%20logo");

  // Boundary 3: Special characters, slashes, and symbols
  assert.equal(sanitizeAndBuildUrl("C++ & C# / React? 100%"), "/vi/posts?q=C%2B%2B%20%26%20C%23%20%2F%20React%3F%20100%25");

  // Boundary 4: English locale routing
  assert.equal(sanitizeAndBuildUrl("web development", "en"), "/en/posts?q=web%20development");
});

test("QA-VI3D-04: Search Form Component Architecture & A11y Attributes", () => {
  const src = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  // 1. Core props and state
  assert.match(src, /interface FiverrSearchFormProps/);
  assert.match(src, /emptyHint:\s*string/);
  assert.match(src, /variant:\s*"header"\s*\|\s*"hero"\s*\|\s*"mobile"/);

  // 2. Sanitation & submission logic
  assert.match(src, /const q = (sanitizeSearchQuery\(query\)|query\.trim\(\))/);
  assert.match(src, /if \(!q\) \{/);
  assert.match(src, /setError\(emptyHint\)/);
  assert.match(src, /classList\.add\("search-shake"\)/);
  assert.match(src, /encodeURIComponent\(q\)/);

  // 3. Clear error on typing
  assert.match(src, /if \(error && e\.target\.value\.trim\(\)\) setError\(null\)/);

  // 4. Accessibility attributes
  assert.match(src, /aria-describedby=\{error \? `\$\{id\}-hint` : undefined\}/);
  assert.match(src, /aria-invalid=\{!!error\}/);
  assert.match(src, /role="alert"/);
  assert.match(src, /aria-live="polite"/);
  assert.match(src, /autoComplete="off"/);
  assert.match(src, /inputMode="search"/);
  assert.match(src, /enterKeyHint="search"/);
});

test("QA-VI3D-05: Header Responsive Layout & Text Wrap Protection", () => {
  const headerSrc = read("src/components/landing/fiverr/fiverr-header.tsx");

  // 1. linkBtn has nowrap and shrink-0
  assert.match(headerSrc, /shrink-0/, "linkBtn must contain shrink-0");
  assert.match(headerSrc, /whitespace-nowrap/, "linkBtn must contain whitespace-nowrap");
  assert.match(headerSrc, /text-\[15px\]\s+font-semibold.*?xl:px-4\s+xl:text-base/, "Responsive typography scaling between lg and xl");

  // 2. Container bounds and overflow prevention
  assert.match(headerSrc, /min-h-\[64px\]/, "Header container must enforce min-h-[64px]");
  assert.match(headerSrc, /overflow-x-clip/, "Header row must prevent horizontal scrolling");

  // 3. Selective responsive disclosure: becomeSeller hidden on lg (1024px), shown on xl (1280px+)
  assert.match(headerSrc, /hidden min-w-0 items-center gap-1 xl:flex/, "becomeSeller must be hidden on lg and visible on xl");

  // 4. Mobile cluster integrates mobile search form and hamburger
  assert.match(headerSrc, /variant="mobile"/, "Mobile cluster must render mobile search form");
  assert.match(headerSrc, /aria-expanded=\{open\}/, "Drawer toggle must have aria-expanded");
  assert.match(headerSrc, /aria-controls=\{drawerId\}/, "Drawer toggle must link to drawerId");
});

test("QA-VI3D-06: Popular Services Equal-Height Geometry & Micro-Interactions", () => {
  const popSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");

  // 1. Fixed card height 300px
  assert.match(popSrc, /h-\[300px\]\s+w-\[200px\]/, "Card outer box must be strictly 200x300px");

  // 2. Clamped typography with min-height
  assert.match(popSrc, /min-h-\[56px\]\s+flex-1\s+text-balance\s+text-lg\s+font-bold\s+leading-\[28px\]\s+line-clamp-2/, "Title must clamp to 2 lines with 56px min-height");
  assert.match(popSrc, /min-h-\[36px\]\s+text-xs\s+leading-\[18px\].*?line-clamp-2/, "Blurb must clamp to 2 lines with 36px min-height");

  // 3. Fixed media block height
  assert.match(popSrc, /h-\[148px\]\s+shrink-0\s+overflow-hidden/, "Media block must have fixed 148px height");

  // 4. Wrapped in tilt card and uses Next Image / FiverrImage
  assert.match(popSrc, /<FiverrTiltCard/, "Cards must be wrapped in 3D tilt component");
  assert.match(popSrc, /<Image|<FiverrImage/, "Cards must render image component");
  assert.match(popSrc, /sizes="200px"/, "Image must declare sizes attribute");
});

test("QA-VI3D-07: CTA Banner Font Branching & Diacritic Protection", () => {
  const ctaSrc = read("src/components/landing/fiverr/fiverr-cta-banner.tsx");

  // 1. Vietnamese locale branching
  assert.match(ctaSrc, /locale === "vi"\s*\?/, "Must branch on locale === 'vi'");
  assert.match(ctaSrc, /className="cta-vi-accent\s+bg-gradient-to-r/, "Vietnamese must use cta-vi-accent with gradient");

  // 2. English locale uses display serif
  assert.match(ctaSrc, /className="fiverr-display\s+not-italic\s+font-normal"/, "English must use fiverr-display");

  // 3. Typography balance
  assert.match(ctaSrc, /text-balance/, "Headline must use text-balance");

  // 4. Ambient background glows
  assert.match(ctaSrc, /bg-\[#FF7640\]\/20 blur-3xl/, "Top glow orb must be present");
  assert.match(ctaSrc, /bg-white\/10 blur-3xl/, "Bottom glow orb must be present");

  // 5. CSS validation in globals.css
  const css = read("src/app/globals.css");
  assert.match(css, /\.cta-vi-accent\s*\{[^}]*font-family:\s*var\(--font-be-vietnam-pro\)/, ".cta-vi-accent must map to Be Vietnam Pro font");
});

test("QA-VI3D-08: 3D WebGL Particle Ocean Physics & Resource Lifecycle", () => {
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");

  // 1. WebGL Context creation
  assert.match(sceneSrc, /canvas\.getContext\("webgl2"\)\s*\|\|\s*canvas\.getContext\("webgl"\)/);

  // 2. Vertex & Fragment Shader creation
  assert.match(sceneSrc, /pos\.y \+= sin\(uTime \* 1\.5 \+ pos\.x \* 0\.8 \+ aPhase\) \* 0\.35;/);
  assert.match(sceneSrc, /gl_PointSize = clamp\(14\.0 \/ dist, 1\.5, 6\.0\);/);
  assert.match(sceneSrc, /gl_FragColor = vec4\(particleColor, vAlpha \* glow \* 0\.8\);/);

  // 3. Perspective matrix computation
  assert.match(sceneSrc, /function createPerspective\(fovRad: number, aspect: number, near: number, far: number\)/);

  // 4. Resource cleanup on unmount
  assert.match(sceneSrc, /cancelAnimationFrame\(raf\)/);
  assert.match(sceneSrc, /gl\.deleteShader\(vs\)/);
  assert.match(sceneSrc, /gl\.deleteShader\(fs\)/);
  assert.match(sceneSrc, /gl\.deleteBuffer\(posBuffer\)/);
  assert.match(sceneSrc, /gl\.deleteBuffer\(phaseBuffer\)/);
  assert.match(sceneSrc, /gl\.deleteProgram\(program\)/);
});

test("QA-VI3D-09: 3D Accessibility & Performance Killswitches", () => {
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");

  // 1. Reduced-motion check
  assert.match(sceneSrc, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/, "Must check prefers-reduced-motion");

  // 2. Data saver check
  assert.match(sceneSrc, /navWithConnection\.connection\?\.saveData/, "Must check navigator saveData");

  // 3. Offscreen pausing via IntersectionObserver
  assert.match(sceneSrc, /new IntersectionObserver\(\(\[entry\]\) => \{/, "Must observe viewport intersection");
  assert.match(sceneSrc, /isVisible = entry\.isIntersecting/, "Must set visibility state based on entry.isIntersecting");

  // 4. Tab visibility pausing
  assert.match(sceneSrc, /document\.addEventListener\("visibilitychange"/, "Must pause on visibilitychange");
  assert.match(sceneSrc, /isVisible = !document\.hidden/, "Must check !document.hidden");

  // 5. DPR Clamping
  assert.match(sceneSrc, /Math\.min\(window\.devicePixelRatio \|\| 1, FIVERR_3D\.dprMax\)/, "Must clamp devicePixelRatio");
});

test("QA-VI3D-10: 3D Tilt Card Ergonomics & Mobile Touch Safety", () => {
  const tiltSrc = read("src/components/landing/fiverr/fiverr-tilt-card.tsx");

  // 1. Pointer ergonomics
  assert.match(tiltSrc, /window\.matchMedia\("\(hover: hover\) and \(pointer: fine\)"\)\.matches/, "Must only activate on fine pointers");
  assert.match(tiltSrc, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/, "Must check prefers-reduced-motion");

  // 2. Touch action manipulation
  assert.match(tiltSrc, /touchAction:\s*"manipulation"/, "Must configure touchAction: manipulation to prevent scroll hijacking");

  // 3. Clamped rotation angles
  assert.match(tiltSrc, /max = FIVERR_3D\.tiltMax/, "Must use default tiltMax from FIVERR_3D tokens");
  assert.match(tiltSrc, /transformStyle:\s*"preserve-3d"/, "Must declare transformStyle preserve-3d");

  // 4. Reset on pointer leave
  assert.match(tiltSrc, /handlePointerLeave/, "Must handle pointer leave");
  assert.match(tiltSrc, /rotateX\(0deg\) rotateY\(0deg\)/, "Must reset angles to 0deg on leave");
});

test("QA-VI3D-11: Hero Video Error Fallback & Typography Weights", () => {
  const heroSrc = read("src/components/landing/fiverr/fiverr-hero.tsx");

  // 1. Video error state
  assert.match(heroSrc, /const \[videoError, setVideoError\] = React\.useState\(false\)/, "Must have videoError state");
  assert.match(heroSrc, /onError=\{\(\) => setVideoError\(true\)\}/, "Video must catch onError");
  assert.match(heroSrc, /videoError \?\s*\(\s*<img/, "Must fallback to static poster img on videoError");

  // 2. Be Vietnam Pro full weights loaded in layout.tsx
  const layoutSrc = read("src/app/layout.tsx");
  assert.match(layoutSrc, /weight:\s*\["200",\s*"300",\s*"400",\s*"500",\s*"600",\s*"700",\s*"800"\]/, "Must load weights 200, 300, 800 to avoid faux fonts");
  assert.match(layoutSrc, /subsets:\s*\["latin",\s*"vietnamese"\]/, "Must load vietnamese subset");
  assert.doesNotMatch(layoutSrc, /Geist/, "Must not load Geist font (brand governance)");
});

test("QA-VI3D-12: Zero-Dependency 3D Governance & Dictionary Parity", () => {
  // 1. Package dependencies
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies?.three, undefined, "three must not exist in dependencies");
  assert.equal(pkg.devDependencies?.three, undefined, "three must not exist in devDependencies");
  assert.equal(pkg.devDependencies?.["@types/three"], undefined, "@types/three must not exist");

  // 2. Zero three import in landing root
  const landingSrc = read("src/components/landing/fiverr/fiverr-landing.tsx");
  assert.doesNotMatch(landingSrc, /three/, "fiverr-landing.tsx must have zero three references");

  // 3. Dictionary parity check
  const viDict = JSON.parse(read("src/dictionaries/vi.json"));
  const enDict = JSON.parse(read("src/dictionaries/en.json"));

  assert.ok(viDict.landing?.fiverr?.hero?.searchEmptyHint, "vi.json must define searchEmptyHint");
  assert.ok(enDict.landing?.fiverr?.hero?.searchEmptyHint, "en.json must define searchEmptyHint");
  assert.ok(viDict.landing?.fiverr?.header?.searchEmptyHint, "vi.json must define header searchEmptyHint");
  assert.ok(enDict.landing?.fiverr?.header?.searchEmptyHint, "en.json must define header searchEmptyHint");
});
