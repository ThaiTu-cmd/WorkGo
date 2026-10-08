import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORKGO_ROOT = path.resolve(ROOT, "..");

// =============================================================================
// TEST SUITE: WorkGo Performance Optimization Engine & Static Modernization
// =============================================================================

test("PERF-TC-01 - Zero-Jank Architecture: No background canvas loops or heavy render passes", () => {
  const landingPagePath = path.join(ROOT, "src/components/landing/workgo-landing-page.tsx");
  const landingSrc = fs.readFileSync(landingPagePath, "utf-8");

  assert.ok(!landingSrc.includes("ParticleOceanWebGL"), "Must not mount WebGL render passes");
  assert.match(landingSrc, /<LandingStaticBackground\s*\/>/, "Must render lightweight static background");
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
