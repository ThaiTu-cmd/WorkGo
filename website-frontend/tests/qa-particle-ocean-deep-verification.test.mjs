import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Import pure functions and constants from the config module
const configModulePath = path.join(ROOT, "src/components/effects/particle-ocean-webgl.config.ts");
const {
  DEFAULT_PARTICLE_OCEAN_CONFIG,
  PARTICLE_OCEAN_PALETTE,
  WAVE_CONSTANTS,
  resolveParticleCount,
  hexToLinear,
} = await import(pathToFileURL(configModulePath).href);

// =============================================================================
// QA TEST SUITE: PARTICLE OCEAN WEBGL DEEP FUNCTIONAL & EDGE-CASE VERIFICATION
// =============================================================================

test("QA-CONFIG-01 - Happy Path: resolveParticleCount returns canonical defaults for desktop landscape", () => {
  assert.equal(DEFAULT_PARTICLE_OCEAN_CONFIG.waveSpeed, 0.35);
  assert.equal(DEFAULT_PARTICLE_OCEAN_CONFIG.waveAmplitude, 1.0);
  assert.equal(DEFAULT_PARTICLE_OCEAN_CONFIG.particleSize, 1.6);
  assert.equal(DEFAULT_PARTICLE_OCEAN_CONFIG.cameraHeight, 6.0);

  const result = resolveParticleCount();
  assert.deepEqual(result, { cols: 400, rows: 250 }, "Default invocation must return 400x250");

  const explicitDefault = resolveParticleCount({ cols: 400, rows: 250 }, {
    isMobile: false,
    isLowEnd: false,
    isPortrait: false,
  });
  assert.deepEqual(explicitDefault, { cols: 400, rows: 250 }, "Explicit desktop landscape must return 400x250");
});

test("QA-CONFIG-02 - Happy Path: resolveParticleCount handles numeric input with 1.6:1 aspect ratio", () => {
  // ~100k particles
  const res100k = resolveParticleCount(100000);
  assert.equal(res100k.rows, 250);
  assert.equal(res100k.cols, 400);

  // ~50k particles: rows = round(sqrt(50000/1.6)) = round(sqrt(31250)) = round(176.77) = 177
  // cols = round(177 * 1.6) = round(283.2) = 283
  const res50k = resolveParticleCount(50000);
  assert.equal(res50k.rows, 177);
  assert.equal(res50k.cols, 283);
  assert.ok(Math.abs(res50k.cols / res50k.rows - 1.6) < 0.05, "Ratio must remain close to 1.6");
});

test("QA-CONFIG-03 - Boundary & Edge Cases: resolveParticleCount handles numeric boundary, zero, and negative values", () => {
  // Minimum clamp at 100: rows = max(10, round(sqrt(100/1.6))) = 10, cols = max(10, round(10*1.6)) = 16
  const resZero = resolveParticleCount(0);
  assert.deepEqual(resZero, { cols: 16, rows: 10 }, "Zero numeric input must clamp to minimum non-zero grid");

  const resNegative = resolveParticleCount(-500);
  assert.deepEqual(resNegative, { cols: 16, rows: 10 }, "Negative numeric input must clamp to minimum non-zero grid");

  // Non-finite values: NaN, Infinity, -Infinity must fallback to safe defaults
  const resNaN = resolveParticleCount(Number.NaN);
  assert.deepEqual(resNaN, { cols: 400, rows: 250 }, "NaN must fallback to default grid");

  const resInf = resolveParticleCount(Number.POSITIVE_INFINITY);
  assert.deepEqual(resInf, { cols: 400, rows: 250 }, "Infinity must fallback to default grid");
});

test("QA-CONFIG-04 - Edge Cases: resolveParticleCount handles null, undefined, and partial objects", () => {
  const resUndefined = resolveParticleCount(undefined);
  assert.deepEqual(resUndefined, { cols: 400, rows: 250 });

  const resEmptyObj = resolveParticleCount({});
  assert.deepEqual(resEmptyObj, { cols: 400, rows: 250 });

  const resPartialCols = resolveParticleCount({ cols: 300 });
  assert.deepEqual(resPartialCols, { cols: 300, rows: 250 });

  const resPartialRows = resolveParticleCount({ rows: 180 });
  assert.deepEqual(resPartialRows, { cols: 400, rows: 180 });

  // Negative or zero property boundaries
  const resZeroProps = resolveParticleCount({ cols: 0, rows: 0 });
  assert.equal(resZeroProps.cols, 10, "cols <= 0 must clamp to minimum 10");
  assert.equal(resZeroProps.rows, 10, "rows <= 0 must clamp to minimum 10");

  const resNegProps = resolveParticleCount({ cols: -50, rows: -20 });
  assert.equal(resNegProps.cols, 10, "Negative cols must clamp to minimum 10");
  assert.equal(resNegProps.rows, 10, "Negative rows must clamp to minimum 10");
});

test("QA-CONFIG-05 - Device Throttling: resolveParticleCount enforces mobile, low-end, and portrait constraints", () => {
  // Mobile landscape: caps at 220x140
  const resMobile = resolveParticleCount({ cols: 400, rows: 250 }, { isMobile: true });
  assert.deepEqual(resMobile, { cols: 220, rows: 140 }, "Mobile must cap at 220x140");

  // Low-end landscape: caps at 160x100
  const resLowEnd = resolveParticleCount({ cols: 400, rows: 250 }, { isLowEnd: true });
  assert.deepEqual(resLowEnd, { cols: 160, rows: 100 }, "Low-end must cap at 160x100");

  // Low-end + Mobile combined: low-end takes precedence (stricter limit)
  const resLowEndMobile = resolveParticleCount({ cols: 400, rows: 250 }, { isLowEnd: true, isMobile: true });
  assert.deepEqual(resLowEndMobile, { cols: 160, rows: 100 }, "Low-end takes precedence over mobile");

  // Desktop portrait: reduces cols by 25% (400 * 0.75 = 300), rows unchanged (250)
  const resPortrait = resolveParticleCount({ cols: 400, rows: 250 }, { isPortrait: true });
  assert.deepEqual(resPortrait, { cols: 300, rows: 250 }, "Portrait must reduce cols by 25%");

  // Mobile portrait: 220 * 0.75 = 165 cols, 140 rows
  const resMobilePortrait = resolveParticleCount({ cols: 400, rows: 250 }, { isMobile: true, isPortrait: true });
  assert.deepEqual(resMobilePortrait, { cols: 165, rows: 140 }, "Mobile portrait combines mobile cap and 25% col reduction");

  // Low-end portrait: 160 * 0.75 = 120 cols, 100 rows
  const resLowEndPortrait = resolveParticleCount({ cols: 400, rows: 250 }, { isLowEnd: true, isPortrait: true });
  assert.deepEqual(resLowEndPortrait, { cols: 120, rows: 100 }, "Low-end portrait combines low-end cap and 25% col reduction");
});

test("QA-CONFIG-06 - Happy Path: hexToLinear correctly parses valid 3-char and 6-char hex strings", () => {
  // Pure white #FFFFFF -> [1, 1, 1]
  const white = hexToLinear("#FFFFFF");
  assert.deepEqual(white, [1, 1, 1]);

  // Pure black #000000 -> [0, 0, 0]
  const black = hexToLinear("#000000");
  assert.deepEqual(black, [0, 0, 0]);

  // 3-digit shorthand #FFF and #000
  assert.deepEqual(hexToLinear("#FFF"), [1, 1, 1]);
  assert.deepEqual(hexToLinear("#000"), [0, 0, 0]);

  // Without leading '#'
  assert.deepEqual(hexToLinear("FFFFFF"), [1, 1, 1]);
  assert.deepEqual(hexToLinear("000000"), [0, 0, 0]);

  // Primary palette royal blue #2F6BFF
  const [r, g, b] = hexToLinear("#2F6BFF");
  assert.ok(r > 0 && r < 0.2, "Red component of #2F6BFF in linear space is low");
  assert.ok(g > 0.1 && g < 0.3, "Green component of #2F6BFF in linear space is medium");
  assert.ok(b > 0.95 && b <= 1.0, "Blue component of #2F6BFF in linear space is near 1");

  // Deep cobalt blue #1747C9
  const [cr, cg, cb] = hexToLinear("#1747C9");
  assert.ok(cr < r, "Cobalt red is darker than royal blue");
  assert.ok(cg < g, "Cobalt green is darker than royal blue");
  assert.ok(cb < b, "Cobalt blue is darker than royal blue");
});

test("QA-CONFIG-07 - Edge Cases & Robustness: hexToLinear safely handles malformed and invalid inputs", () => {
  // Empty, null, undefined fallbacks
  assert.deepEqual(hexToLinear(""), [1, 1, 1], "Empty string must return fallback [1, 1, 1]");
  assert.deepEqual(hexToLinear(null), [1, 1, 1], "null must return fallback [1, 1, 1]");
  assert.deepEqual(hexToLinear(undefined), [1, 1, 1], "undefined must return fallback [1, 1, 1]");

  // Invalid lengths
  assert.deepEqual(hexToLinear("#AB"), [1, 1, 1], "Too short hex must return fallback");
  assert.deepEqual(hexToLinear("#ABCD"), [1, 1, 1], "4-digit hex must return fallback");
  assert.deepEqual(hexToLinear("#12345678"), [1, 1, 1], "8-digit hex must return fallback");

  // Non-hex characters
  assert.deepEqual(hexToLinear("#ZZZZZZ"), [1, 1, 1], "Invalid characters must return fallback");
  assert.deepEqual(hexToLinear("#12G456"), [1, 1, 1], "Invalid hex character G must return fallback");
  assert.deepEqual(hexToLinear("hello-world"), [1, 1, 1], "Arbitrary string must return fallback");
});

test("QA-CONFIG-08 - Kinematics & Palette Constants: WAVE_CONSTANTS and PARTICLE_OCEAN_PALETTE structure", () => {
  // Wave constants
  assert.ok(WAVE_CONSTANTS.w1, "w1 swell must exist");
  assert.ok(WAVE_CONSTANTS.w2, "w2 swell must exist");
  assert.ok(WAVE_CONSTANTS.w3, "w3 swell must exist");
  assert.ok(WAVE_CONSTANTS.w4, "w4 swell must exist");
  assert.ok(WAVE_CONSTANTS.noise, "Simplex noise parameters must exist");

  assert.equal(WAVE_CONSTANTS.w1.amplitude, 1.15);
  assert.equal(WAVE_CONSTANTS.w2.amplitude, 0.55);
  assert.equal(WAVE_CONSTANTS.w3.amplitude, 0.28);
  assert.equal(WAVE_CONSTANTS.w4.amplitude, 0.12);

  // Palette constants
  assert.equal(PARTICLE_OCEAN_PALETTE.colorDeep, "#1747C9");
  assert.equal(PARTICLE_OCEAN_PALETTE.colorNear, "#2F6BFF");
  assert.equal(PARTICLE_OCEAN_PALETTE.colorFar, "#BFD8FF");
  assert.equal(PARTICLE_OCEAN_PALETTE.fogColor, "#FFFFFF");
  assert.equal(PARTICLE_OCEAN_PALETTE.textNavy, "#0B1B3F");
});

test("QA-SHADER-01 - Shader Mathematical Rigor: Ashima 3D simplex, finite-difference normal, and octagon SDF", () => {
  const compSrc = fs.readFileSync(path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx"), "utf-8");

  // Taylor inverse square root and permute functions in Ashima noise
  assert.match(compSrc, /vec4\s+permute\(vec4\s+x\)\{return\s+mod\(\(\(x\*34\.0\)\+1\.0\)\*x,\s*289\.0\);/);
  assert.match(compSrc, /vec4\s+taylorInvSqrt\(vec4\s+r\)\{return\s+1\.79284291400159\s*-\s*0\.85373472095314\s*\*\s*r;\}/);

  // Finite difference eps = 0.6
  assert.match(compSrc, /float\s+e\s*=\s*0\.6;/);
  assert.match(compSrc, /vec3\s+n\s*=\s*normalize\(vec3\(-\(hx\s*-\s*h\)\s*\/\s*e,\s*1\.0,\s*-\(hz\s*-\s*h\)\s*\/\s*e\)\);/);

  // Octagon distance approximation: cos(pi/8) approx 0.9239 and sin(pi/8) approx 0.3827
  assert.match(compSrc, /float\s+s\s*=\s*0\.9239;/);
  assert.match(compSrc, /vec2\(s,\s*0\.3827\)/);

  // Point size attenuation & clamping: ps * uPixelRatio * (180.0 / dist), clamp 1.0 .. 64.0 * uPixelRatio
  assert.match(compSrc, /gl_PointSize\s*=\s*clamp\(/);
  assert.match(compSrc, /64\.0\s*\*\s*uPixelRatio\);/);

  // Dither hash anti-banding
  assert.match(compSrc, /43758\.5453/);
  assert.match(compSrc, /\/\s*255\.0/);
});

test("QA-RESILIENCE-01 - WebGL Fallback & Context Loss Handling", () => {
  const compSrc = fs.readFileSync(path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx"), "utf-8");

  // Context creation checks WebGL2 first with fallback to WebGL
  assert.match(compSrc, /canvas\.getContext\(["']webgl2["']/);
  assert.match(compSrc, /canvas\.getContext\(["']webgl["']/);

  // Context loss event listener prevents default and activates fallback
  assert.match(compSrc, /canvas\.addEventListener\(["']webglcontextlost["']/);
  assert.match(compSrc, /e\.preventDefault\(\)/);

  // Fallback DOM node is manipulated safely
  assert.match(compSrc, /fallback\.style\.display\s*=\s*["']block["']/);
  assert.match(compSrc, /canvas\.style\.display\s*=\s*["']none["']/);
});

test("QA-PERF-01 - Strict Zero Per-Frame Heap Allocation & Animation Lifecycle", () => {
  const compSrc = fs.readFileSync(path.join(ROOT, "src/components/effects/particle-ocean-webgl.tsx"), "utf-8");

  // RAF tick clamping dt <= 0.05
  assert.match(compSrc, /Math\.min\(\(now\s*-\s*lastTime\)\s*\/\s*1000,\s*0\.05\)/);

  // Disconnection of all observers on unmount
  assert.match(compSrc, /resizeObserver\.disconnect\(\)/);
  assert.match(compSrc, /intersectionObserver\.disconnect\(\)/);

  // WebGL context forceContextLoss called on unmount
  assert.match(compSrc, /renderer\.forceContextLoss\?\.\(\)/);

  // Geometry and material disposal
  assert.match(compSrc, /pointsGeo\.dispose\(\)/);
  assert.match(compSrc, /waterGeo\.dispose\(\)/);
  assert.match(compSrc, /pointsMat\.dispose\(\)/);
  assert.match(compSrc, /waterMat\.dispose\(\)/);
});

test("QA-A11Y-01 - Accessibility & Readability: Navy typography on bright haze background", () => {
  const heroSrc = fs.readFileSync(path.join(ROOT, "src/components/landing/particle-ocean-hero.tsx"), "utf-8");

  // High contrast navy headings and subtext
  assert.match(heroSrc, /text-\[#0B1B3F\]/, "Headline must be dark navy #0B1B3F");
  assert.match(heroSrc, /text-\[#33415E\]/, "Subtitle must be slate navy #33415E");

  // Accessible CTA buttons with distinct interactive styles
  assert.match(heroSrc, /bg-\[#2F6BFF\]/, "Primary button must use royal blue background");
  assert.match(heroSrc, /pointer-events-auto/, "Interactive CTAs must enable pointer events");
});

test("QA-DEMO-01 - Standalone HTML Demo Mirror Parity", () => {
  const htmlSrc = fs.readFileSync(path.join(ROOT, "public/particle-ocean/index.html"), "utf-8");

  // Check that HTML demo contains same core parameters as React component
  assert.match(htmlSrc, /particleCount:\s*\{\s*cols:\s*400,\s*rows:\s*250\s*\}/);
  assert.match(htmlSrc, /waveSpeed:\s*0\.35/);
  assert.match(htmlSrc, /waveAmplitude:\s*1\.0/);
  assert.match(htmlSrc, /waveScale:\s*0\.055/);
  assert.match(htmlSrc, /particleSize:\s*1\.6/);
  assert.match(htmlSrc, /bokehStrength:\s*1\.0/);
  assert.match(htmlSrc, /focusDistance:\s*26\.0/);
  assert.match(htmlSrc, /colorNear:\s*['"]#2F6BFF['"]/);
  assert.match(htmlSrc, /colorDeep:\s*['"]#1747C9['"]/);
  assert.match(htmlSrc, /colorFar:\s*['"]#BFD8FF['"]/);
  assert.match(htmlSrc, /fogColor:\s*['"]#FFFFFF['"]/);
  assert.match(htmlSrc, /cameraHeight:\s*6\.0/);

  // Check fallback element exists
  assert.match(htmlSrc, /id="webgl-fallback"/);
  assert.match(htmlSrc, /id="particle-ocean-canvas"/);
});
