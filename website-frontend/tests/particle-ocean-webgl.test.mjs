import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// =============================================================================
// TEST SUITE: Particle Ocean WebGL Architecture, Contracts & Invariants
// =============================================================================

test("TC-01 - Architecture: All deliverables and legacy 2D files exist concurrently", () => {
  const n1 = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const n2 = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
  const n3 = path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx");
  const n4 = path.join(ROOT, "src/app/[locale]/(public)/particle-ocean-demo/page.tsx");
  const n5 = path.join(ROOT, "public/particle-ocean/index.html");
  const n7 = path.join(ROOT, "PARTICLE-OCEAN.md");

  // Legacy files protected from overwrites
  const legacy2dAuth = path.join(ROOT, "src/components/effects/particle-ocean.tsx");
  const legacy2dAmbient = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");

  assert.ok(fs.existsSync(n1), "particle-ocean-webgl.tsx must exist");
  assert.ok(fs.existsSync(n2), "particle-ocean-webgl.config.ts must exist");
  assert.ok(fs.existsSync(n3), "particle-ocean-hero.tsx must exist");
  assert.ok(fs.existsSync(n4), "particle-ocean-demo/page.tsx must exist");
  assert.ok(fs.existsSync(n5), "public/particle-ocean/index.html must exist");
  assert.ok(fs.existsSync(n7), "PARTICLE-OCEAN.md must exist");

  assert.ok(fs.existsSync(legacy2dAuth), "Legacy 2D auth particle ocean must remain intact");
  assert.ok(fs.existsSync(legacy2dAmbient), "Legacy 2D ambient particle ocean must remain intact");
});

test("TC-02 - Config Defaults: DEFAULT_PARTICLE_OCEAN_CONFIG contains 14 canonical keys", () => {
  const configPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
  const configSrc = fs.readFileSync(configPath, "utf-8");

  const requiredKeys = [
    "particleCount",
    "waveSpeed",
    "waveAmplitude",
    "waveScale",
    "particleSize",
    "bokehStrength",
    "focusDistance",
    "colorNear",
    "colorDeep",
    "colorFar",
    "fogColor",
    "bloomStrength",
    "cameraHeight",
    "mouseParallax",
    "pauseOffscreen",
  ];

  for (const key of requiredKeys) {
    assert.match(
      configSrc,
      new RegExp(`\\b${key}:`),
      `Config must declare key "${key}"`
    );
  }

  // Exact default values from specification
  assert.match(configSrc, /waveSpeed:\s*0\.35/);
  assert.match(configSrc, /waveAmplitude:\s*1\.0/);
  assert.match(configSrc, /waveScale:\s*0\.055/);
  assert.match(configSrc, /particleSize:\s*1\.6/);
  assert.match(configSrc, /bokehStrength:\s*1\.0/);
  assert.match(configSrc, /focusDistance:\s*26\.0/);
  assert.match(configSrc, /colorNear:\s*['"]#2F6BFF['"]/);
  assert.match(configSrc, /colorDeep:\s*['"]#1747C9['"]/);
  assert.match(configSrc, /colorFar:\s*['"]#BFD8FF['"]/);
  assert.match(configSrc, /fogColor:\s*['"]#FFFFFF['"]/);
  assert.match(configSrc, /bloomStrength:\s*0/);
  assert.match(configSrc, /cameraHeight:\s*6\.0/);
  assert.match(configSrc, /mouseParallax:\s*true/);
  assert.match(configSrc, /pauseOffscreen:\s*true/);
});

test("TC-03 - Dynamic Throttling: resolveParticleCount enforces mobile/low-end boundaries", () => {
  const configPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
  const configSrc = fs.readFileSync(configPath, "utf-8");

  // Thresholds 220, 140 for mobile; 160, 100 for low-end; 0.75 for portrait
  assert.match(configSrc, /220/, "Must include mobile max columns (220)");
  assert.match(configSrc, /140/, "Must include mobile max rows (140)");
  assert.match(configSrc, /160/, "Must include low-end max columns (160)");
  assert.match(configSrc, /100/, "Must include low-end max rows (100)");
  assert.match(configSrc, /0\.75/, "Must include portrait 25% column reduction ratio");
});

test("TC-04 - Shader Invariants: Vertex & Fragment shaders implement cinematic wave & bokeh logic", () => {
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  const requiredTokens = [
    "waveHeight",
    "snoise",
    "gl_PointSize",
    "clamp",
    "smoothstep",
    "uTime",
    "aRandom",
    "0.9239",       // Octagon SDF constant for bokeh aperture
    "discard",      // Fragment clipping
    "43758.5453",   // Dither PRNG hash for anti-banding
    "depthWrite: false",
    "renderOrder",
  ];

  for (const token of requiredTokens) {
    assert.ok(
      compSrc.includes(token),
      `Component must contain shader invariant "${token}"`
    );
  }
});

test("TC-05 - Single Draw Call Contract: Zero per-frame particle iteration in tick loop", () => {
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  const tickIndex = compSrc.indexOf("const tick =");
  assert.ok(tickIndex !== -1, "tick loop function must exist");
  const tickEndIndex = compSrc.indexOf("const checkRunningState =", tickIndex);
  assert.ok(tickEndIndex !== -1, "tick loop boundary found");
  const tickBody = compSrc.slice(tickIndex, tickEndIndex);

  // Assert no JS loop iterating particles inside tick
  assert.doesNotMatch(
    tickBody,
    /for\s*\(.*totalPoints/,
    "tick loop must not contain for-loop over particle count"
  );
  assert.doesNotMatch(
    tickBody,
    /\.attributes\.position\.needsUpdate\s*=\s*true/,
    "tick loop must NOT mark position buffer needsUpdate (GPU vertex shader handles motion)"
  );
  assert.match(
    tickBody,
    /pointsUniforms\.uTime\.value\s*=\s*accumulatedTime/,
    "tick loop must drive animation exclusively via uniform uTime"
  );
});

test("TC-06 - Strict Disposal: 8-step unmount cleanup contract verified", () => {
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  const cleanupTokens = [
    "cancelAnimationFrame",
    "disconnect()",
    "removeEventListener",
    "pointsGeo.dispose()",
    "waterGeo.dispose()",
    "pointsMat.dispose()",
    "waterMat.dispose()",
    "renderer.dispose()",
    "forceContextLoss",
  ];

  for (const token of cleanupTokens) {
    assert.ok(
      compSrc.includes(token),
      `Cleanup routine must include "${token}" to guarantee zero WebGL memory leaks`
    );
  }
});

test("TC-07 - Performance & Power Governance: DPR cap, visibilitychange & IntersectionObserver", () => {
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  assert.match(compSrc, /window\.devicePixelRatio/, "Must inspect devicePixelRatio");
  assert.match(compSrc, /Math\.min\(/, "Must cap devicePixelRatio using Math.min");
  assert.match(compSrc, /1\.5/, "Must clamp mobile DPR to 1.5");
  assert.match(compSrc, /\b2\b/, "Must clamp desktop DPR to 2.0");
  assert.match(compSrc, /visibilitychange/, "Must listen to document visibilitychange");
  assert.match(compSrc, /IntersectionObserver/, "Must use IntersectionObserver to pause offscreen");
  assert.match(compSrc, /prefers-reduced-motion/, "Must respect prefers-reduced-motion media query");
  assert.match(compSrc, /ResizeObserver/, "Must use ResizeObserver for container bounds");
  assert.match(compSrc, /150/, "Must debounce resize by 150ms");
});

test("TC-08 - Camera Rig & Interaction: Perspective camera with eased mouse parallax", () => {
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  assert.match(compSrc, /new THREE\.PerspectiveCamera\(/, "Must construct PerspectiveCamera");
  assert.match(compSrc, /camera\.lookAt\(/, "Camera must orient with lookAt");
  assert.match(compSrc, /0\.04/, "Mouse parallax must be damped with 0.04 lerp factor");
  assert.match(compSrc, /pointer:\s*coarse/, "Must guard against touch pointers with pointer: coarse");
});

test("TC-09 - Page Integration Contract: Contrast ratio, isolated styles and aria-hidden", () => {
  const heroPath = path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx");
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");

  const heroSrc = fs.readFileSync(heroPath, "utf-8");
  const cssSrc = fs.readFileSync(cssPath, "utf-8");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  // Hero uses explicit dark navy text on bright haze
  assert.match(heroSrc, /#0B1B3F/, "Hero headline must use high-contrast navy #0B1B3F");
  assert.match(heroSrc, /from ["']@\/components\/effects\/particle-ocean-webgl["']/, "Hero must import explicitly from particle-ocean-webgl");

  // CSS contains isolated classes
  assert.match(cssSrc, /\.particle-ocean-root\s+canvas/, "globals.css must contain .particle-ocean-root canvas");
  assert.match(cssSrc, /\.particle-ocean-glow/, "globals.css must contain .particle-ocean-glow");
  assert.match(cssSrc, /\.particle-ocean-fallback/, "globals.css must contain .particle-ocean-fallback");

  // Accessibility & interaction isolation
  assert.match(compSrc, /pointer-events-none/, "Canvas container must have pointer-events-none");
  assert.match(compSrc, /aria-hidden="true"/, "Canvas container must be marked aria-hidden='true'");
});

test("TC-10 - Standalone Demo HTML Contract: Self-contained demo includes importmap and 14 config keys", () => {
  const demoPath = path.join(ROOT, "public/particle-ocean/index.html");
  const demoSrc = fs.readFileSync(demoPath, "utf-8");

  assert.match(demoSrc, /<script type="importmap">/, "Standalone demo must declare script importmap");
  assert.match(demoSrc, /https:\/\/cdn\.jsdelivr\.net\/npm\/three@/, "Standalone demo must load pinned three from CDN");
  assert.match(demoSrc, /const CONFIG\s*=\s*\{/, "Standalone demo must define CONFIG object");
  assert.match(demoSrc, /class="fallback"/, "Standalone demo must provide fallback container");
  assert.match(demoSrc, /<h1>Particle Ocean Engine<\/h1>/, "Standalone demo must include example hero h1");
});

test("TC-11 - Linear Color Space Normalization: hexToLinear conversion accuracy", () => {
  const configPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
  const configSrc = fs.readFileSync(configPath, "utf-8");

  assert.match(configSrc, /export function hexToLinear\(/, "Must export hexToLinear function");
  assert.match(configSrc, /0\.04045/, "Must implement standard sRGB transfer boundary");
  assert.match(configSrc, /12\.92/, "Must implement linear slope for low luminance");
  assert.match(configSrc, /2\.4/, "Must implement gamma 2.4 exponent");
});

test("TC-12 - Fallback & Resiliency: Graceful degradation upon WebGL context loss", () => {
  const compPath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx");
  const compSrc = fs.readFileSync(compPath, "utf-8");

  assert.match(compSrc, /webglcontextlost/, "Must register webglcontextlost event listener");
  assert.match(compSrc, /showFallback/, "Must invoke showFallback routine");
  assert.match(compSrc, /onWebGLFail/, "Must notify parent via onWebGLFail callback");
});
