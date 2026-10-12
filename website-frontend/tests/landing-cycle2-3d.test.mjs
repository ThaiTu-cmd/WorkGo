import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("C2-3D-01: FIVERR_FRAME token is exported with 60 FPS cap configuration", () => {
  const tokensSrc = read("src/lib/landing/fiverr-tokens.ts");
  assert.match(tokensSrc, /export const FIVERR_FRAME/, "fiverr-tokens.ts must export FIVERR_FRAME");
  assert.match(tokensSrc, /fps:\s*60/, "FIVERR_FRAME must configure fps: 60");
  assert.match(tokensSrc, /frameMinMs:\s*1000\s*\/\s*60/, "FIVERR_FRAME must configure frameMinMs ~16.67ms");
});

test("C2-3D-02: WebGL context-loss and context-restored listeners are attached and cleaned up", () => {
  assert.ok(exists("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx"), "fiverr-3d-hero-scene.tsx must exist");
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");

  assert.match(sceneSrc, /webglcontextlost/, "Must attach webglcontextlost event listener");
  assert.match(sceneSrc, /webglcontextrestored/, "Must attach webglcontextrestored event listener");
  assert.match(sceneSrc, /e\.preventDefault\(\)/, "webglcontextlost handler must preventDefault to allow restoration");
  assert.match(sceneSrc, /data-fallback="webgl-context-lost"/, "Must mount fallback element with data-fallback on context loss");
  assert.match(sceneSrc, /removeEventListener\(["']webglcontextlost["']/, "Must clean up webglcontextlost listener on unmount");
  assert.match(sceneSrc, /removeEventListener\(["']webglcontextrestored["']/, "Must clean up webglcontextrestored listener on unmount");
});

test("C2-3D-03: FPS throttle limits rendering to 60fps cap to prevent battery drain on 120Hz/240Hz displays", () => {
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");

  assert.match(sceneSrc, /FRAME_MIN|FIVERR_FRAME\.frameMinMs/, "Must reference FRAME_MIN or FIVERR_FRAME.frameMinMs");
  assert.match(sceneSrc, /now\s*-\s*lastFrame\s*<\s*FRAME_MIN/, "Must throttle frames when delta < FRAME_MIN");
});

test("C2-3D-04: DPR max clamp and accessibility/saveData guards are strictly preserved", () => {
  const sceneSrc = read("src/components/landing/fiverr/fiverr-3d-hero-scene.tsx");

  assert.match(sceneSrc, /Math\.min\(window\.devicePixelRatio.*?FIVERR_3D\.dprMax|1\.75\)/, "Must clamp devicePixelRatio to max 1.75");
  assert.match(sceneSrc, /prefers-reduced-motion: reduce/, "Must guard against reduced motion");
  assert.match(sceneSrc, /saveData/, "Must respect navigator saveData");
  assert.match(sceneSrc, /IntersectionObserver/, "Must pause rendering when offscreen");
  assert.match(sceneSrc, /visibilitychange/, "Must pause rendering when document is hidden");
});
