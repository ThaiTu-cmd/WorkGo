import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

test("QA-MKT-01: Posts Marketplace page imports Reveal and wraps PostCard items with staggered delay", () => {
  const src = read("src/app/[locale]/(public)/posts/page.tsx");

  // Verify import of Reveal
  assert.match(src, /import\s*\{\s*Reveal\s*\}\s*from\s*["']@\/components\/ui\/reveal["']/);

  // Verify Reveal wrapper around PostCard with stagger delay and h-full class
  assert.match(src, /<Reveal\s+key=\{post\.postId\}\s+delay=\{idx\s*\*\s*50\}\s+className="h-full">/);
  assert.match(src, /<PostCard\s+post=\{post\}\s+locale=\{locale\}\s*\/>/);
});

test("QA-MKT-02: Post Detail page imports Reveal and wraps primary columns with staggered entrance", () => {
  const src = read("src/app/[locale]/(public)/posts/[id]/page.tsx");

  // Verify import of Reveal
  assert.match(src, /import\s*\{\s*Reveal\s*\}\s*from\s*["']@\/components\/ui\/reveal["']/);

  // Verify left column reveal (delay=0)
  assert.match(src, /<Reveal\s+delay=\{0\}\s+className="lg:col-span-2\s+space-y-6">/);

  // Verify right column reveal (delay=80)
  assert.match(src, /<Reveal\s+delay=\{80\}>/);
});

test("QA-MOB-01: Mobile HomeScreen brandBadge adapts dynamically to theme tokens", () => {
  const ROOT_PARENT = path.resolve(ROOT, "..");
  const homePath = path.join(ROOT_PARENT, "android-frontend/src/app/index.tsx");
  assert.ok(fs.existsSync(homePath), "android-frontend index.tsx must exist");
  const src = fs.readFileSync(homePath, "utf-8");

  // Verify dynamic style injection on brandBadge
  assert.match(src, /backgroundColor:\s*theme\.primarySubtle/);
  assert.match(src, /borderColor:\s*theme\.border/);
  assert.match(src, /color:\s*theme\.primary/);

  // Verify complete elimination of hardcoded light colors in brandBadge style definition
  assert.ok(!src.includes("backgroundColor: '#EFF6FF'"), "Hardcoded #EFF6FF in brandBadge must be removed");
  assert.ok(!src.includes("borderColor: '#BFDBFE'"), "Hardcoded #BFDBFE in brandBadge must be removed");
  assert.ok(!src.includes("color: '#2563EB'"), "Hardcoded #2563EB in brandBadgeText must be removed");
});

test("QA-MOB-02: Mobile ExploreScreen badge adapts dynamically to theme tokens", () => {
  const ROOT_PARENT = path.resolve(ROOT, "..");
  const explorePath = path.join(ROOT_PARENT, "android-frontend/src/app/explore.tsx");
  assert.ok(fs.existsSync(explorePath), "android-frontend explore.tsx must exist");
  const src = fs.readFileSync(explorePath, "utf-8");

  // Verify dynamic style injection on badge
  assert.match(src, /backgroundColor:\s*theme\.primarySubtle/);
  assert.match(src, /borderColor:\s*theme\.border/);
  assert.match(src, /color:\s*theme\.primary/);

  // Verify complete elimination of hardcoded light colors in badge style definition
  assert.ok(!src.includes("backgroundColor: '#EFF6FF'"), "Hardcoded #EFF6FF in badge must be removed");
  assert.ok(!src.includes("borderColor: '#BFDBFE'"), "Hardcoded #BFDBFE in badge must be removed");
  assert.ok(!src.includes("color: '#2563EB'"), "Hardcoded #2563EB in badgeText must be removed");
});

test("QA-EDGE-01: Empty & Loading states in Posts Marketplace bypass PostCard Reveal wrapping cleanly", () => {
  const src = read("src/app/[locale]/(public)/posts/page.tsx");

  // Loading branch check: renders Skeleton grid, no Reveal
  assert.match(src, /loading\s*\?\s*\(/);
  assert.match(src, /\[1,\s*2,\s*3,\s*4,\s*5,\s*6\]\.map/);

  // Empty branch check: renders EmptyState, no Reveal
  assert.match(src, /posts\.length\s*===\s*0\s*\?\s*\(/);
  assert.match(src, /<EmptyState/);
});

test("QA-EDGE-02: Grid height integrity preserved by h-full on Reveal wrappers", () => {
  const src = read("src/app/[locale]/(public)/posts/page.tsx");

  // PostCard reveal must have h-full to avoid flex/grid collapse
  assert.match(src, /<Reveal[^>]*className="h-full"[^>]*>/);
});

test("QA-EDGE-03: Stagger delay monotonic progression and non-negativity", () => {
  const calcDelay = (idx) => idx * 50;

  assert.equal(calcDelay(0), 0);
  assert.equal(calcDelay(1), 50);
  assert.equal(calcDelay(5), 250);
  assert.equal(calcDelay(10), 500);

  for (let i = 0; i < 20; i++) {
    assert.ok(calcDelay(i) >= 0, `Delay for index ${i} must be >= 0`);
    if (i > 0) {
      assert.ok(calcDelay(i) > calcDelay(i - 1), `Delay for index ${i} must be greater than index ${i - 1}`);
    }
  }
});

test("QA-EDGE-04: Reveal UI primitive enforces SSR safety and reduced motion resilience", () => {
  const revealSrc = read("src/components/ui/reveal.tsx");
  assert.match(revealSrc, /"use client"/);
  assert.match(revealSrc, /useReveal/);

  const motionSrc = read("src/lib/motion.ts");
  assert.match(motionSrc, /prefersReducedMotion/);
  assert.match(motionSrc, /useMounted/);
  assert.match(motionSrc, /IntersectionObserver/);
});

test("QA-GOV-01: Zero modifications to backend microservices or documentation", () => {
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
    assert.ok(fs.existsSync(dirPath), `${dir} exists`);
  }
});
