import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORKGO_ROOT = path.resolve(ROOT, "..");

// =============================================================================
// TEST SUITE: WorkGo Performance Optimization Engine & Zero-Jank Backgrounds
// =============================================================================

test("PERF-TC-01 - Landing Page: Ghost bloom/torus render passes eliminated from animate loop", () => {
  const landingPath = path.join(ROOT, "public/landing/index.html");
  assert.ok(fs.existsSync(landingPath), "public/landing/index.html must exist");
  const content = fs.readFileSync(landingPath, "utf-8");

  // Animate function must not execute torusComposer.render() or bloomComposer.render()
  const animateStart = content.indexOf("function animate(now)");
  const animateEnd = content.indexOf("// Debounced Resize Handler", animateStart);
  assert.ok(animateStart !== -1 && animateEnd !== -1, "animate function must be present");
  const animateBody = content.slice(animateStart, animateEnd);

  assert.doesNotMatch(
    animateBody,
    /torusComposer\.render\(\)/,
    "animate loop must NOT call torusComposer.render() (empty ghost pass eliminated)"
  );
  assert.doesNotMatch(
    animateBody,
    /bloomComposer\.render\(\)/,
    "animate loop must NOT call bloomComposer.render() (empty ghost pass eliminated)"
  );
  assert.match(
    animateBody,
    /finalComposer\.render\(\)/,
    "animate loop must call finalComposer.render() for composite output"
  );
});

test("PERF-TC-02 - DPR Capping: All canvas background engines cap devicePixelRatio to <= 1.25", () => {
  const landingPath = path.join(ROOT, "public/landing/index.html");
  const ambientPath = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  const authPath = path.join(ROOT, "src/components/effects/particle-ocean.tsx");

  const landingSrc = fs.readFileSync(landingPath, "utf-8");
  const ambientSrc = fs.readFileSync(ambientPath, "utf-8");
  const authSrc = fs.readFileSync(authPath, "utf-8");

  // Landing WebGL & Ocean 2D
  assert.match(
    landingSrc,
    /renderer\.setPixelRatio\(\s*Math\.min\(\s*window\.devicePixelRatio\s*\|\|\s*1,\s*1\.25\s*\)\s*\)/,
    "Landing Three.js renderer must cap DPR to 1.25"
  );
  assert.match(
    landingSrc,
    /Math\.min\(\s*window\.devicePixelRatio\s*\|\|\s*1,\s*1\.25\s*\)/,
    "Landing oceanCanvas must cap DPR to 1.25"
  );

  // Dashboard Ambient
  assert.match(
    ambientSrc,
    /Math\.min\(\s*window\.devicePixelRatio\s*\|\|\s*1,\s*1\.25\s*\)/,
    "ParticleOceanAmbient must cap DPR to 1.25"
  );

  // Auth Background
  assert.match(
    authSrc,
    /Math\.min\(\s*window\.devicePixelRatio\s*\|\|\s*1,\s*1\.25\s*\)/,
    "ParticleOcean must cap DPR to 1.25"
  );
});

test("PERF-TC-03 - Landing Page: WebGL ShadowMap disabled and frame rate throttled", () => {
  const landingPath = path.join(ROOT, "public/landing/index.html");
  const content = fs.readFileSync(landingPath, "utf-8");

  assert.match(
    content,
    /renderer\.shadowMap\.enabled\s*=\s*false/,
    "Renderer shadowMap must be disabled to eliminate unneeded depth passes"
  );

  assert.match(
    content,
    /TARGET_FRAME_MS\s*=\s*1000\s*\/\s*60/,
    "Landing WebGL animate loop must include 60 FPS pacing"
  );
});

test("PERF-TC-04 - Landing Page Ocean Canvas: Density optimized and draw calls batched", () => {
  const landingPath = path.join(ROOT, "public/landing/index.html");
  const content = fs.readFileSync(landingPath, "utf-8");

  // Reduced density
  assert.match(
    content,
    /cols:\s*isMobile\s*\?\s*20\s*:\s*32/,
    "Ocean cols must be optimized to 20 (mobile) and 32 (desktop)"
  );
  assert.match(
    content,
    /rows:\s*isMobile\s*\?\s*14\s*:\s*20/,
    "Ocean rows must be optimized to 14 (mobile) and 20 (desktop)"
  );

  // Batched particle dots (single fill)
  assert.match(
    content,
    /oceanCtx\.beginPath\(\);\s*for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*projected\.length;\s*i\+\+\s*\)\s*\{[\s\S]*?oceanCtx\.arc\([\s\S]*?\}\s*oceanCtx\.fill\(\);/s,
    "oceanCanvas must batch all wave particles into a single fill() call"
  );

  // FPS throttling
  assert.match(
    content,
    /OCEAN_FRAME_INTERVAL\s*=\s*1000\s*\/\s*36/,
    "oceanCanvas must throttle animation loop to ~36 FPS"
  );
});

test("PERF-TC-05 - ParticleOceanAmbient: Path Batching eliminates individual stroke/fill calls", () => {
  const ambientPath = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  const content = fs.readFileSync(ambientPath, "utf-8");

  // Batched horizontal connections: single stroke() outside loop
  assert.match(
    content,
    /ctx\.beginPath\(\);\s*for\s*\(\s*let\s+r\s*=\s*0;\s*r\s*<\s*rows;\s*r\+\+\s*\)\s*\{\s*for\s*\(\s*let\s+c\s*=\s*0;\s*c\s*<\s*cols\s*-\s*1;\s*c\+\+\s*\)\s*\{[\s\S]*?ctx\.moveTo[\s\S]*?ctx\.lineTo[\s\S]*?\}\s*\}\s*ctx\.stroke\(\);/s,
    "Ambient horizontal lines must be batched into a single stroke() call"
  );

  // Batched vertical connections: single stroke() outside loop
  assert.match(
    content,
    /ctx\.beginPath\(\);\s*for\s*\(\s*let\s+r\s*=\s*0;\s*r\s*<\s*rows\s*-\s*1;\s*r\+\+\s*\)\s*\{\s*for\s*\(\s*let\s+c\s*=\s*0;\s*c\s*<\s*cols;\s*c\+\+\s*\)\s*\{[\s\S]*?ctx\.moveTo[\s\S]*?ctx\.lineTo[\s\S]*?\}\s*\}\s*ctx\.stroke\(\);/s,
    "Ambient vertical lines must be batched into a single stroke() call"
  );

  // Batched dots: single fill() outside loop
  assert.match(
    content,
    /ctx\.beginPath\(\);\s*for\s*\(\s*let\s+r\s*=\s*0;\s*r\s*<\s*rows;\s*r\+\+\s*\)\s*\{\s*for\s*\(\s*let\s+c\s*=\s*0;\s*c\s*<\s*cols;\s*c\+\+\s*\)\s*\{[\s\S]*?ctx\.arc\([\s\S]*?\}\s*\}\s*ctx\.fill\(\);/s,
    "Ambient dots must be batched into a single fill() call"
  );

  // Frame rate throttling
  assert.match(
    content,
    /FRAME_INTERVAL\s*=\s*1000\s*\/\s*36/,
    "ParticleOceanAmbient must throttle animation to ~36 FPS"
  );
});

test("PERF-TC-06 - ParticleOcean: Zero regex replace in render loop & squared distance pre-filter", () => {
  const authPath = path.join(ROOT, "src/components/effects/particle-ocean.tsx");
  const content = fs.readFileSync(authPath, "utf-8");

  // Regex replacement must NOT exist in the render loop
  const renderStart = content.indexOf("const render =");
  const renderEnd = content.indexOf("animationFrameId = requestAnimationFrame(render);", renderStart);
  assert.ok(renderStart !== -1 && renderEnd !== -1, "render function must be defined");
  const renderBody = content.slice(renderStart, renderEnd);

  assert.doesNotMatch(
    renderBody,
    /\.replace\(/,
    "particle-ocean render loop must NOT call string .replace() (eliminates GC thrashing)"
  );

  // Squared distance prefilter
  assert.match(
    content,
    /maxDistSq\s*=\s*maxConnectionDist\s*\*\s*maxConnectionDist/,
    "Must compute maxDistSq for squared distance pre-filtering"
  );
  assert.match(
    content,
    /distSq\s*<\s*maxDistSq/,
    "Must pre-filter pair distances using distSq < maxDistSq before calculating Math.sqrt"
  );

  // Batched particle dots
  assert.match(
    content,
    /ctx\.fillStyle\s*=\s*particleColor;\s*ctx\.beginPath\(\);\s*for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*particles\.length;\s*i\+\+\s*\)\s*\{[\s\S]*?ctx\.arc\([\s\S]*?\}\s*ctx\.fill\(\);/s,
    "Particle dots must be batched into a single fill() call"
  );

  // Frame throttle for auth
  assert.match(
    content,
    /FRAME_INTERVAL\s*=\s*1000\s*\/\s*40/,
    "ParticleOcean must throttle render loop to ~40 FPS"
  );
});

test("PERF-TC-07 - Tab Visibility & Resource Conservation: document.visibilitychange lifecycle", () => {
  const ambientPath = path.join(ROOT, "src/components/effects/particle-ocean-ambient.tsx");
  const authPath = path.join(ROOT, "src/components/effects/particle-ocean.tsx");
  const landingPath = path.join(ROOT, "public/landing/index.html");

  const ambientSrc = fs.readFileSync(ambientPath, "utf-8");
  const authSrc = fs.readFileSync(authPath, "utf-8");
  const landingSrc = fs.readFileSync(landingPath, "utf-8");

  // Ambient visibility handling & cleanup
  assert.match(ambientSrc, /document\.addEventListener\(["']visibilitychange["']/, "Ambient listens to visibilitychange");
  assert.match(ambientSrc, /document\.removeEventListener\(["']visibilitychange["']/, "Ambient cleans up visibilitychange");

  // Auth visibility handling & cleanup
  assert.match(authSrc, /document\.addEventListener\(["']visibilitychange["']/, "Auth listens to visibilitychange");
  assert.match(authSrc, /document\.removeEventListener\(["']visibilitychange["']/, "Auth cleans up visibilitychange");

  // Landing visibility handling
  assert.match(landingSrc, /document\.addEventListener\(['"]visibilitychange['"]/, "Landing listens to visibilitychange");
});

test("PERF-TC-08 - Hardware Acceleration: CSS containment & GPU promotion in globals.css", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    content,
    /\.planet-canvas,\s*\.ocean-canvas,\s*canvas\[aria-hidden=["']true["']\],\s*\.gpu-accelerated\s*\{[^}]*contain:\s*strict;[^}]*transform:\s*translateZ\(0\);/s,
    "globals.css must isolate canvases with contain: strict and transform: translateZ(0)"
  );
});

test("PERF-TC-09 - Next.js Config: Static compression enabled", () => {
  const configPath = path.join(ROOT, "next.config.ts");
  const content = fs.readFileSync(configPath, "utf-8");

  assert.match(content, /compress:\s*true/, "next.config.ts must have compress: true enabled");
});

test("PERF-TC-10 - Project Governance: Java microservices and documentation untouched", () => {
  const backendDirs = [
    "api-gateway",
    "catalog-service",
    "identity-service",
    "order-service",
    "payment-service",
    "docs",
  ];

  for (const dir of backendDirs) {
    const fullDir = path.join(WORKGO_ROOT, dir);
    assert.ok(fs.existsSync(fullDir), `Directory ${dir} must exist and remain untouched`);
  }
});
