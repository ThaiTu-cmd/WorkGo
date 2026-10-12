import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FIVERR_DENSITY } from "../src/lib/landing/fiverr-tokens.ts";
import { resolveParticleDensity } from "../src/lib/landing/adaptive-3d.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

test("C3-PERF-01: FIVERR_DENSITY tokens structure", () => {
  assert.equal(FIVERR_DENSITY.high, 300, "High density must be 300");
  assert.equal(FIVERR_DENSITY.low, 150, "Low density must be 150");
  assert.equal(FIVERR_DENSITY.memThresholdGb, 4, "Memory threshold must be 4GB");
  assert.equal(FIVERR_DENSITY.cpuThreshold, 4, "CPU threshold must be 4 cores");
});

test("C3-PERF-02: resolveParticleDensity adapts to hardware and screen width", () => {
  const origNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  const mockEnv = ({ innerWidth, deviceMemory, hardwareConcurrency }) => {
    if (innerWidth !== undefined) {
      globalThis.window = { innerWidth };
    } else {
      delete globalThis.window;
    }
    Object.defineProperty(globalThis, "navigator", {
      value: { deviceMemory, hardwareConcurrency },
      configurable: true,
      writable: true,
    });
  };

  try {
    // Low RAM (2GB) -> 150
    mockEnv({ innerWidth: 1440, deviceMemory: 2, hardwareConcurrency: 8 });
    assert.equal(resolveParticleDensity(), 150, "Device with RAM <= 4GB must resolve to low density 150");

    // Low CPU (2 cores) -> 150
    mockEnv({ innerWidth: 1440, deviceMemory: 8, hardwareConcurrency: 2 });
    assert.equal(resolveParticleDensity(), 150, "Device with CPU <= 4 cores must resolve to low density 150");

    // Narrow mobile viewport (390px) -> 150
    mockEnv({ innerWidth: 390, deviceMemory: 16, hardwareConcurrency: 16 });
    assert.equal(resolveParticleDensity(), 150, "Mobile screen < 768px must resolve to low density 150");

    // High-spec desktop (8GB RAM, 8 cores, 1440px) -> 300
    mockEnv({ innerWidth: 1440, deviceMemory: 8, hardwareConcurrency: 8 });
    assert.equal(resolveParticleDensity(), 300, "High spec desktop must resolve to high density 300");

    // Undefined window (SSR / Node fallback) -> fallback
    delete globalThis.window;
    assert.equal(resolveParticleDensity(), 300, "SSR / missing window must safely return fallback");
  } finally {
    delete globalThis.window;
    if (origNav) {
      Object.defineProperty(globalThis, "navigator", origNav);
    }
  }
});

test("C3-PERF-03: Fiverr3dAccent wires resolveParticleDensity", () => {
  const accentSrc = read("src/components/landing/fiverr/fiverr-3d-accent.tsx");
  assert.match(accentSrc, /resolveParticleDensity/, "Fiverr3dAccent must import and use resolveParticleDensity");
  assert.match(accentSrc, /density \?\? resolveParticleDensity\(\)/, "Fiverr3dAccent must compute effective density");
  assert.match(accentSrc, /density=\{effDensity\}/, "Fiverr3dAccent must pass effective density to ThreeCanvas");
});

test("C3-PERF-04: LCP eager loading on first two popular cards", () => {
  const popularSrc = read("src/components/landing/fiverr/fiverr-popular-services.tsx");
  assert.match(popularSrc, /eager=\{idx < 2\}/, "First two popular service cards must have eager loading");
});

test("C3-PERF-05: CSS momentum rail and snap utilities", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /\.rail-momentum\s*\{[^}]*-webkit-overflow-scrolling:\s*touch/, "rail-momentum must enable touch momentum");
  assert.match(css, /\.rail-momentum\s*\{[^}]*scroll-snap-type:\s*x proximity/, "rail-momentum must enable proximity snap");

  const catGridSrc = read("src/components/landing/fiverr/fiverr-category-grid.tsx");
  assert.match(catGridSrc, /rail-momentum/, "Category grid rail must apply rail-momentum");

  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");
  assert.match(postsSrc, /rail-momentum/, "Posts pills rail must apply rail-momentum");
});

test("C3-PERF-06: CSS Dedup Audit — all keyframes defined exactly once", () => {
  const css = read("src/app/globals.css");

  const countKeyframes = (name) => {
    const regex = new RegExp(`@keyframes\\s+${name}\\b`, "g");
    const matches = css.match(regex);
    return matches ? matches.length : 0;
  };

  assert.equal(countKeyframes("fiverrShimmer"), 1, "fiverrShimmer must be defined exactly once");
  assert.equal(countKeyframes("searchShake"), 1, "searchShake must be defined exactly once");
  assert.equal(countKeyframes("fiverrMarquee"), 1, "fiverrMarquee must be defined exactly once");
  assert.equal(countKeyframes("fiverrCardShine"), 1, "fiverrCardShine must be defined exactly once");
});

test("C3-PERF-07: Reduced-motion killswitch in last media query block covers all new classes", () => {
  const css = read("src/app/globals.css");
  const lastIndex = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
  assert.ok(lastIndex !== -1, "Reduced motion media query must exist");
  const lastBlock = css.slice(lastIndex);

  assert.match(lastBlock, /\.img-shimmer/, "img-shimmer must be suppressed in last reduced motion block");
  assert.match(lastBlock, /\.focus-elevate:focus-within/, "focus-elevate must be suppressed in last reduced motion block");
  assert.match(lastBlock, /\.rail-momentum/, "rail-momentum snap must be suppressed in last reduced motion block");
  assert.match(lastBlock, /\.search-shake/, "search-shake must be suppressed in last reduced motion block");
});
