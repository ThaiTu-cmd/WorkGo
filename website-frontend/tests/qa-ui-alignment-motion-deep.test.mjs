import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

test("QA-UI-DEEP-01: Motion library primitives, easing constants, and lifecycle hooks", () => {
  const src = read("src/lib/motion.ts");

  // Verify EASES constants
  assert.match(src, /out:\s*"cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)"/);
  assert.match(src, /spring:\s*"cubic-bezier\(0\.34,\s*1\.56,\s*0\.64,\s*1\)"/);
  assert.match(src, /press:\s*"cubic-bezier\(0\.75,\s*0,\s*0\.25,\s*1\)"/);

  // Verify timing durations
  assert.match(src, /fast:\s*150/);
  assert.match(src, /med:\s*300/);
  assert.match(src, /slow:\s*620/);
  assert.match(src, /stagger:\s*80/);

  // Verify helper functions
  assert.match(src, /export function prefersReducedMotion/);
  assert.match(src, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(src, /export function useMounted/);
  assert.match(src, /React\.useSyncExternalStore/);
  assert.match(src, /export function useReveal/);
  assert.match(src, /IntersectionObserver/);
});

test("QA-UI-DEEP-02: Fiverr tokens motion and hit-area geometry specifications", () => {
  const src = read("src/lib/landing/fiverr-tokens.ts");

  assert.match(src, /export const FIVERR_MOTION/);
  assert.match(src, /durFast:\s*150/);
  assert.match(src, /durMed:\s*300/);
  assert.match(src, /durSlow:\s*620/);
  assert.match(src, /stagger:\s*80/);

  assert.match(src, /export const FIVERR_HIT/);
  assert.match(src, /btnH:\s*42/);
  assert.match(src, /chipH:\s*42/);
  assert.match(src, /heroSearchH:\s*\{\s*mobile:\s*52,\s*desktop:\s*60\s*\}/);
  assert.match(src, /headerH:\s*64/);
});

test("QA-UI-DEEP-03: FiverrButton variants, sizes, and Slot composition", () => {
  const src = read("src/components/landing/fiverr/fiverr-button.tsx");

  assert.match(src, /fiverr-press/);
  assert.match(src, /h-\[42px\] px-4/);
  assert.match(src, /h-\[48px\] px-5/);
  assert.match(src, /focus-visible:ring-2/);
  assert.match(src, /bg-\[#222325\] text-white/);
  assert.match(src, /asChild/);
  assert.match(src, /<Slot/);
});

test("QA-UI-DEEP-04: Button core atom supports marketplace variant and pill-lg size", () => {
  const src = read("src/components/ui/button.tsx");

  assert.match(src, /marketplace:\s*"bg-\[#222325\] text-white hover:bg-black rounded-lg shadow-none"/);
  assert.match(src, /"pill-lg":\s*"h-12 px-7 text-base rounded-full min-w-\[48px\]"/);
});

test("QA-UI-DEEP-05: Mobile 320px viewport overflow boundaries (header, category, carousel)", () => {
  const headerSrc = read("src/components/landing/fiverr/fiverr-header.tsx");
  assert.match(headerSrc, /min-h-\[64px\]/);
  assert.match(headerSrc, /min-w-0 flex-1/);
  assert.match(headerSrc, /max-w-\[200px\]/);

  const catSrc = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(catSrc, /w-full aspect-square min-h-\[88px\]/);
  assert.ok(!catSrc.includes("w-[88px] h-[88px]"), "Mobile category tile must not have fixed 88px width/height");

  const carouselSrc = read("src/components/landing/fiverr/fiverr-carousel.tsx");
  assert.match(carouselSrc, /left-2/);
  assert.match(carouselSrc, /right-2/);
  assert.ok(!carouselSrc.includes("-left-3"), "Carousel left arrow must not clip with negative margin");
  assert.ok(!carouselSrc.includes("-right-3"), "Carousel right arrow must not clip with negative margin");
  assert.match(carouselSrc, /md:hidden/); // mobile dots pagination
});

test("QA-UI-DEEP-06: Carousel single gutter and card micro-interactions", () => {
  const src = read("src/components/landing/fiverr/fiverr-popular-services.tsx");

  assert.ok(!src.includes('className="px-6 md:px-0"'), "Double gutter removed from popular services carousel");
  assert.match(src, /transition-transform duration-200 hover:-translate-y-1/);
});

test("QA-UI-DEEP-07: Footer single border and responsive grid layout", () => {
  const src = read("src/components/landing/fiverr/fiverr-footer.tsx");

  assert.ok(!src.includes("border-t border-t-[0.8px]"), "Duplicate border-t classes eliminated in footer");
  assert.match(src, /borderTopWidth:\s*"0\.8px"/);
  assert.match(src, /sm:grid-cols-3/);
  assert.match(src, /lg:grid-cols-5/);
});

test("QA-UI-DEEP-08: Artwork and icon contrast improvements for WCAG compliance", () => {
  const panelsSrc = read("src/components/landing/fiverr/fiverr-feature-panels.tsx");
  assert.match(panelsSrc, /text-white\/60 drop-shadow/);
  assert.match(panelsSrc, /border border-white\/15/);
  assert.ok(!panelsSrc.includes("text-white/25"), "Low contrast 25% white artwork must be eliminated");

  const guidesSrc = read("src/components/landing/fiverr/fiverr-guides.tsx");
  assert.match(guidesSrc, /text-white\/60 drop-shadow/);
  assert.ok(!guidesSrc.includes("text-white/35"), "Low contrast 35% white artwork must be eliminated");
});

test("QA-UI-DEEP-09: 3D Accent WebGL fallback, saveData, and resource cleanup", () => {
  const accentSrc = read("src/components/landing/fiverr/fiverr-3d-accent.tsx");
  assert.match(accentSrc, /ssr:\s*false/);
  assert.match(accentSrc, /saveData/);
  assert.match(accentSrc, /prefers-reduced-motion/);
  assert.match(accentSrc, /getContext\("webgl2"\)/);

  const canvasSrc = read("src/components/landing/fiverr/fiverr-3d-canvas.tsx");
  assert.match(canvasSrc, /document\.hidden/);
  assert.match(canvasSrc, /cancelAnimationFrame\(raf\)/);
  assert.match(canvasSrc, /gl\.deleteBuffer\(buffer\)/);
  assert.match(canvasSrc, /gl\.deleteShader\(vs\)/);
  assert.match(canvasSrc, /gl\.deleteShader\(fs\)/);
  assert.match(canvasSrc, /gl\.deleteProgram\(program\)/);
  assert.match(canvasSrc, /ro\.disconnect\(\)/);
});

test("QA-UI-DEEP-10: CSS Motion System and Reduced Motion killswitch in globals.css", () => {
  const css = read("src/app/globals.css");

  assert.match(css, /@keyframes fiverrRevealUp/);
  assert.match(css, /@keyframes fiverrScaleIn/);
  assert.match(css, /@keyframes fiverrShimmer/);
  assert.match(css, /@keyframes fiverrFloatY/);
  assert.match(css, /\.reveal/);
  assert.match(css, /\.reveal-visible/);
  assert.match(css, /\.btn-marketplace/);
  assert.match(css, /\.text-balance-hero/);

  // Reduced motion killswitch verification
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.reveal\s*\{[\s\S]*?opacity:\s*1\s*!important/);
  assert.match(css, /\.reveal\s*\{[\s\S]*?transform:\s*none\s*!important/);
  assert.match(css, /\.reveal\s*\{[\s\S]*?transition:\s*none\s*!important/);
});

test("QA-UI-DEEP-11: Android Frontend motion primitives, theme tokens, and WorkGo localization", () => {
  const ROOT_PARENT = path.resolve(ROOT, "..");

  // pressable-scale.tsx
  const scalePath = path.join(ROOT_PARENT, "android-frontend/src/components/pressable-scale.tsx");
  assert.ok(fs.existsSync(scalePath));
  const scaleSrc = fs.readFileSync(scalePath, "utf-8");
  assert.match(scaleSrc, /withSpring\(0\.97/);
  assert.match(scaleSrc, /ReduceMotion\.System/);

  // entrance-view.tsx
  const entrancePath = path.join(ROOT_PARENT, "android-frontend/src/components/entrance-view.tsx");
  assert.ok(fs.existsSync(entrancePath));
  const entranceSrc = fs.readFileSync(entrancePath, "utf-8");
  assert.match(entranceSrc, /FadeInDown/);
  assert.match(entranceSrc, /springify\(\)/);
  assert.match(entranceSrc, /ReduceMotion\.System/);

  // home-categories.tsx
  const catPath = path.join(ROOT_PARENT, "android-frontend/src/components/home-categories.tsx");
  assert.ok(fs.existsSync(catPath));
  const catSrc = fs.readFileSync(catPath, "utf-8");
  assert.match(catSrc, /\(MaxContentWidth - 56\) \/ 2/);
  assert.match(catSrc, /useTheme\(\)/);

  // home-explore-card.tsx
  const exploreCardPath = path.join(ROOT_PARENT, "android-frontend/src/components/home-explore-card.tsx");
  assert.ok(fs.existsSync(exploreCardPath));
  const exploreCardSrc = fs.readFileSync(exploreCardPath, "utf-8");
  assert.match(exploreCardSrc, /isDark \? theme\.surface : "#EFF6FF"/);
  assert.match(exploreCardSrc, /height:\s*48/);

  // explore.tsx
  const explorePath = path.join(ROOT_PARENT, "android-frontend/src/app/explore.tsx");
  assert.ok(fs.existsSync(explorePath));
  const exploreSrc = fs.readFileSync(explorePath, "utf-8");
  assert.match(exploreSrc, /Khám phá WorkGo/);
  assert.match(exploreSrc, /Tìm việc & Thuê chuyên gia/);
  assert.match(exploreSrc, /Bảo chứng thanh toán Escrow/);
  assert.match(exploreSrc, /Bắt đầu trong 3 bước/);
  assert.ok(!exploreSrc.includes("tutorial-web.png"), "No Expo tutorial image");
  assert.ok(!exploreSrc.includes("react-logo.png"), "No Expo react logo");
  assert.ok(!exploreSrc.includes("expo.dev"), "No Expo template external links");

  // theme.ts
  const themePath = path.join(ROOT_PARENT, "android-frontend/src/constants/theme.ts");
  const themeSrc = fs.readFileSync(themePath, "utf-8");
  assert.match(themeSrc, /seven:\s*48/);
  assert.match(themeSrc, /Radius\s*=\s*\{/);
  assert.match(themeSrc, /HitSlop\s*=\s*\{/);

  // themed-text.tsx
  const textPath = path.join(ROOT_PARENT, "android-frontend/src/components/themed-text.tsx");
  const textSrc = fs.readFileSync(textPath, "utf-8");
  assert.match(textSrc, /hero:\s*\{\s*fontSize:\s*26,\s*lineHeight:\s*32,\s*fontWeight:\s*['"]700['"],?\s*\}/);
});

test("QA-UI-DEEP-12: Zero backend leakage and repository governance lockdown", () => {
  const ROOT_PARENT = path.resolve(ROOT, "..");
  const FORBIDDEN_DIRS = [
    "api-gateway",
    "catalog-service",
    "identity-service",
    "job-service",
    "order-service",
    "payment-service",
    "docs",
  ];

  for (const dir of FORBIDDEN_DIRS) {
    const dirPath = path.join(ROOT_PARENT, dir);
    if (fs.existsSync(dirPath)) {
      assert.ok(fs.statSync(dirPath).isDirectory(), `${dir} is intact`);
    }
  }

  // Verify landing page does not import three or canvas directly
  const landingPageSrc = read("src/components/landing/workgo-landing-page.tsx");
  assert.ok(!landingPageSrc.includes("from 'three'"));
  assert.ok(!landingPageSrc.includes('from "three"'));
  assert.ok(!landingPageSrc.includes("<canvas"));
});
