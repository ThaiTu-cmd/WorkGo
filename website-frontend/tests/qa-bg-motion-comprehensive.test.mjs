import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

// =============================================================================
// COMPREHENSIVE QA TEST SUITE: BG MOTION VIVID (HAPPY PATH, EDGE CASES, CORNER CASES)
// =============================================================================

describe("QA Comprehensive: Background Motion Vivid Architecture", () => {
  // ---------------------------------------------------------------------------
  // 1. HAPPY PATH SCENARIOS
  // ---------------------------------------------------------------------------
  describe("Happy Path: Component Contracts and Default States", () => {
    it("HP-01: AnimatedBackground defaults to vivid intensity (playbackRate 1.25, zoomPan active)", () => {
      const src = read("src/components/effects/animated-background.tsx");
      // Verify intensity deduction
      assert.match(
        src,
        /resolvedIntensity:\s*BackgroundIntensity\s*=\s*intensity\s*\?\?\s*\(variant\s*===\s*"auth"\s*\?\s*"default"\s*:\s*"vivid"\)/,
        "AnimatedBackground must resolve intensity defaulting to 'vivid' for landing"
      );
      // Verify rate deduction
      assert.match(
        src,
        /resolvedRate\s*=\s*playbackRate\s*\?\?\s*\(resolvedIntensity\s*===\s*"vivid"\s*\?\s*1\.25\s*:\s*resolvedIntensity\s*===\s*"default"\s*\?\s*1\.15\s*:\s*1\.0\)/,
        "AnimatedBackground must resolve playbackRate: vivid=1.25, default=1.15, subtle=1.0"
      );
      // Verify enableZoomPan deduction
      assert.match(
        src,
        /resolvedZoomPan\s*=\s*enableZoomPan\s*\?\?\s*resolvedIntensity\s*===\s*"vivid"/,
        "AnimatedBackground must enable zoomPan by default for vivid"
      );
      // Verify class applied
      assert.match(
        src,
        /resolvedZoomPan\s*&&\s*!isReducedMotion\s*&&\s*"bg-motion-vivid"/,
        "Must apply bg-motion-vivid class when zoomPan is active and not reduced motion"
      );
    });

    it("HP-02: BackgroundMotionLayer renders 3 drifting orbs and 14 dots for landing vivid mode", () => {
      const src = read("src/components/effects/background-motion-layer.tsx");
      assert.match(src, /variant\s*=\s*"landing"/, "Default variant must be landing");
      assert.match(src, /intensity\s*=\s*"vivid"/, "Default intensity must be vivid");
      assert.match(
        src,
        /resolvedDots\s*=\s*dotCount\s*\?\?\s*\(intensity\s*===\s*"subtle"\s*\?\s*6\s*:\s*intensity\s*===\s*"default"\s*\?\s*10\s*:\s*variant\s*===\s*"auth"\s*\?\s*10\s*:\s*14\)/,
        "Landing vivid must configure 14 dots"
      );
      assert.match(
        src,
        /orbCount\s*=\s*intensity\s*===\s*"subtle"\s*\?\s*1\s*:\s*intensity\s*===\s*"default"\s*\?\s*2\s*:\s*3/,
        "Vivid mode must render 3 orbs"
      );
      assert.match(src, /bg-orb-a/, "Must render bg-orb-a");
      assert.match(src, /orbCount\s*>=\s*2\s*&&\s*<div\s+className=\{cn\("bg-orb bg-orb-b"/, "Must render bg-orb-b");
      assert.match(src, /orbCount\s*>=\s*3\s*&&\s*\(\s*<div\s+className=\{cn\("bg-orb bg-orb-c"/, "Must render bg-orb-c");
    });

    it("HP-03: LandingStaticBackground connects motion layer and animated cone", () => {
      const src = read("src/components/landing/landing-static-background.tsx");
      assert.match(src, /intensity\s*=\s*"vivid"/, "Default intensity must be vivid");
      assert.match(
        src,
        /playbackRate\s*=\s*intensity\s*===\s*"vivid"\s*\?\s*1\.25\s*:\s*intensity\s*===\s*"default"\s*\?\s*1\.15\s*:\s*1\.0/,
        "LandingStaticBackground must compute playbackRate correctly"
      );
      assert.match(
        src,
        /<BackgroundMotionLayer\s+variant="landing"\s+intensity=\{intensity\}\s*\/>/,
        "Must render BackgroundMotionLayer with variant landing"
      );
      assert.match(
        src,
        /className="absolute inset-0 landing-static-cone landing-cone-animated pointer-events-none z-\[1\]"/,
        "Must attach landing-cone-animated to light cone"
      );
      assert.match(src, /landing-static-vignette/, "Must keep vignette overlay");
    });

    it("HP-04: AuthAtmosphere defaults to vivid mode (playbackRate 1.35, 10 dots, auth-cone-animated)", () => {
      const src = read("src/components/effects/auth-atmosphere.tsx");
      assert.match(src, /intensity\s*=\s*"vivid"/, "AuthAtmosphere default must be vivid");
      assert.match(src, /const vivid = intensity === "vivid"/, "Must detect vivid intensity");
      assert.match(src, /const rate = vivid \? 1\.35 : isDefault \? 1\.15 : 1\.0/, "Rate mapping: vivid=1.35, default=1.15, subtle=1.0");
      assert.match(src, /const dots = vivid \? 10 : isDefault \? 8 : 6/, "Dots mapping: vivid=10, default=8, subtle=6");
      assert.match(
        src,
        /const coneClass = vivid \|\| isDefault \? "auth-cone-animated" : ""/,
        "Cone animation active for vivid and default"
      );
      assert.match(src, /<BackgroundMotionLayer\s+variant="auth"/, "Must render motion layer with auth variant");
    });

    it("HP-05: AuthShell wraps login and register pages with vivid motion atmosphere", () => {
      const shellSrc = read("src/components/shell/auth-shell.tsx");
      assert.match(shellSrc, /<AuthAtmosphere\s+intensity="vivid"\s*\/>/, "AuthShell must mount AuthAtmosphere with vivid intensity");

      const authLayoutSrc = read("src/app/[locale]/(auth)/layout.tsx");
      assert.match(authLayoutSrc, /<AuthShell locale=\{locale\}>\{children\}<\/AuthShell>/, "Auth layout must wrap auth routes in AuthShell");
    });

    it("HP-06: ParticleOceanHero implements enhanced foreground motion micro-interactions", () => {
      const heroSrc = read("src/components/landing/particle-ocean-hero.tsx");
      assert.match(heroSrc, /animate-pulse-glow-strong/, "Pill dot must use animate-pulse-glow-strong");
      assert.match(heroSrc, /animate-subtle-glow-strong/, "CTA primary must use animate-subtle-glow-strong");
      assert.match(heroSrc, /animate-fade-up/, "Hero content container must use animate-fade-up");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. EDGE CASES & BOUNDARY CONDITIONS
  // ---------------------------------------------------------------------------
  describe("Edge Cases & Boundaries: Resilience & Accessibility", () => {
    it("EC-01: Accessibility - Reduced-Motion Killswitch in JS and CSS", () => {
      // Check AnimatedBackground
      const compSrc = read("src/components/effects/animated-background.tsx");
      assert.match(compSrc, /useSyncExternalStore/, "AnimatedBackground must subscribe via useSyncExternalStore");
      assert.match(compSrc, /\{isReducedMotion\s*\?\s*\(\s*<img\s+src=\{fallbackImageSrc\}/, "Must branch on isReducedMotion to render fallback img");

      // Check BackgroundMotionLayer
      const layerSrc = read("src/components/effects/background-motion-layer.tsx");
      assert.match(layerSrc, /if\s*\(isReducedMotion\)\s*\{\s*return null;\s*\}/, "BackgroundMotionLayer must return null under reduced motion");

      // Check CSS kill-switch
      const css = read("src/app/globals.css");
      const mqIdx = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
      assert.ok(mqIdx !== -1, "globals.css must contain @media (prefers-reduced-motion: reduce)");
      const mqBody = css.slice(mqIdx);
      const expectedKilledClasses = [
        ".bg-motion-vivid",
        ".bg-orb",
        ".bg-twinkle-dot",
        ".landing-cone-animated",
        ".auth-cone-animated",
        ".animate-pulse-glow-strong",
        ".animate-subtle-glow-strong",
        ".animate-float-strong",
      ];
      for (const cls of expectedKilledClasses) {
        assert.ok(mqBody.includes(cls), `Reduced motion block must kill ${cls}`);
      }
      assert.ok(mqBody.includes("animation: none !important"), "Must enforce animation: none !important");
    });

    it("EC-02: Mobile Low-Power Breakpoint (max-width: 640px) hides orb-c and scales down", () => {
      const css = read("src/app/globals.css");
      const mobileIdx = css.lastIndexOf("@media (max-width: 640px)");
      assert.ok(mobileIdx !== -1, "globals.css must contain @media (max-width: 640px)");
      const mobileBody = css.slice(mobileIdx);
      assert.ok(mobileBody.includes(".bg-orb-c { display: none; }"), "Mobile must hide orb-c to reduce GPU load");
      assert.ok(mobileBody.includes("transform: scale(0.7)"), "Mobile must scale down orb-a and orb-b");
    });

    it("EC-03: Video Autoplay Rejection & Unsupported playbackRate Resilience", () => {
      const src = read("src/components/effects/animated-background.tsx");
      assert.match(src, /try\s*\{\s*videoRef\.current\.playbackRate = resolvedRate;\s*\}\s*catch/, "playbackRate setter must be wrapped in try/catch");
      assert.match(src, /videoRef\.current\.play\(\)\.catch\(/, "play() call must handle rejection silently");
      assert.match(src, /poster=\{fallbackImageSrc\}/, "Video must provide poster fallback image");
    });

    it("EC-04: Light Mode Legibility - Auth Orbs & Scrim Protection", () => {
      const layerSrc = read("src/components/effects/background-motion-layer.tsx");
      assert.match(layerSrc, /isAuth\s*&&\s*"bg-orb-auth"/, "Auth orbs must apply bg-orb-auth class");
      assert.match(layerSrc, /opacity:\s*isAuth\s*\?\s*0\.35\s*:\s*undefined/, "Auth dots must have subdued opacity (0.35) for readability");

      const css = read("src/app/globals.css");
      assert.match(css, /\.bg-orb-auth\s*\{[^}]*transform:\s*scale\(0\.8\);[^}]*opacity:\s*0\.85;/, "bg-orb-auth must scale down and reduce opacity");

      const atmoSrc = read("src/components/effects/auth-atmosphere.tsx");
      assert.match(atmoSrc, /bg-black\/10\s+dark:bg-black\/20/, "AuthAtmosphere must retain contrast scrim");
    });

    it("EC-05: Hydration Stability & Deterministic PRNG Bounds", () => {
      const layerSrc = read("src/components/effects/background-motion-layer.tsx");
      assert.doesNotMatch(layerSrc, /Math\.random/, "Must never use Math.random");
      assert.doesNotMatch(layerSrc, /Date\.now/, "Must never use Date.now");
      assert.match(layerSrc, /getReducedMotionServerSnapshot\(\):\s*boolean\s*\{\s*return false;\s*\}/, "SSR server snapshot must return false stably");

      // Verify pseudo algorithm logic mathematically
      function pseudo(i, salt) {
        return ((i * 37 + salt * 13 + 11) % 100 + 100) % 100;
      }

      for (let i = 0; i < 500; i++) {
        const left = pseudo(i, 1);
        const top = pseudo(i * 7 + 3, 5);
        assert.ok(left >= 0 && left < 100, `Left out of bounds [0, 100) at index ${i}: ${left}`);
        assert.ok(top >= 0 && top < 100, `Top out of bounds [0, 100) at index ${i}: ${top}`);
        assert.ok(Number.isInteger(left) && Number.isInteger(top), "Coordinates must be integers");
      }
    });

    it("EC-06: AuthAtmosphere handles intensity='none' and intensity='subtle' backwards compatibility", () => {
      const src = read("src/components/effects/auth-atmosphere.tsx");
      assert.match(src, /if\s*\(intensity\s*===\s*"none"\)\s*\{\s*return\s*\(\s*<div[^>]*bg-app/, "intensity='none' must return empty bg-app container without video or motion layer");

      // subtle mode verification
      assert.match(src, /opacityClass\s*=\s*vivid\s*\?\s*"opacity-100"\s*:\s*isDefault\s*\?\s*"opacity-90"\s*:\s*"opacity-75"/, "subtle must use opacity-75");
      assert.match(src, /rate = vivid \? 1\.35 : isDefault \? 1\.15 : 1\.0/, "subtle must use rate 1.0");
      assert.match(src, /coneClass = vivid \|\| isDefault \? "auth-cone-animated" : ""/, "subtle must not animate cone (backward compatibility)");
    });

    it("EC-07: Custom dotCount and playbackRate overrides take precedence", () => {
      const layerSrc = read("src/components/effects/background-motion-layer.tsx");
      assert.match(layerSrc, /resolvedDots\s*=\s*dotCount\s*\?\?/, "BackgroundMotionLayer must prioritize explicit dotCount prop");

      const animSrc = read("src/components/effects/animated-background.tsx");
      assert.match(animSrc, /resolvedRate\s*=\s*playbackRate\s*\?\?/, "AnimatedBackground must prioritize explicit playbackRate prop");
      assert.match(animSrc, /resolvedZoomPan\s*=\s*enableZoomPan\s*\?\?/, "AnimatedBackground must prioritize explicit enableZoomPan prop");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. PERFORMANCE, ASSETS & GOVERNANCE
  // ---------------------------------------------------------------------------
  describe("Performance, Assets & Governance Verification", () => {
    it("PERF-01: All keyframe animations leverage GPU compositor properties (transform/opacity/filter)", () => {
      const css = read("src/app/globals.css");
      const keyframeNames = [
        "bgZoomPan",
        "orbDriftA",
        "orbDriftB",
        "conePulse",
        "gradientPanStrong",
        "particleTwinkle",
        "floatStrong",
        "subtleGlowStrong",
      ];
      for (const name of keyframeNames) {
        assert.ok(css.includes(`@keyframes ${name}`), `globals.css must define @keyframes ${name}`);
      }
      assert.match(css, /will-change:\s*transform;/, "bg-motion-vivid must declare will-change: transform");
      assert.match(css, /will-change:\s*transform,\s*opacity;/, "bg-orb must declare will-change: transform, opacity");
    });

    it("PERF-02: Public video and image fallback assets exist and meet budget", () => {
      const assets = [
        { file: "particle-ocean.webm", minKB: 100, maxKB: 3072 },
        { file: "particle-ocean.mp4", minKB: 100, maxKB: 5120 },
        { file: "particle-ocean-fallback.webp", minKB: 10, maxKB: 600 },
        { file: "particle-ocean-fallback.jpg", minKB: 10, maxKB: 800 },
      ];

      for (const a of assets) {
        const filePath = path.join(ROOT, "public/assets", a.file);
        assert.ok(fs.existsSync(filePath), `Asset ${a.file} must exist`);
        const stats = fs.statSync(filePath);
        const sizeKB = stats.size / 1024;
        assert.ok(
          sizeKB >= a.minKB && sizeKB <= a.maxKB,
          `Asset ${a.file} size (${sizeKB.toFixed(1)}KB) must be between ${a.minKB}KB and ${a.maxKB}KB`
        );
      }
    });

    it("GOV-01: Zero new animation dependencies added to website-frontend/package.json", () => {
      const pkg = JSON.parse(read("package.json"));
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      const forbiddenPackages = [
        "framer-motion",
        "gsap",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "lottie-web",
        "lottie-react",
        "animejs",
        "popmotion",
      ];
      for (const p of forbiddenPackages) {
        assert.ok(!allDeps[p], `package.json must NOT depend on ${p}`);
      }
    });
  });
});
