import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("QA background motion vivid (PLAN-BG-MOTION-VIVID)", () => {
  it("1. animated-background has playbackRate + BackgroundIntensity + bg-motion-vivid", () => {
    const src = read("src/components/effects/animated-background.tsx");
    assert.match(src, /playbackRate/, "missing playbackRate prop");
    assert.match(src, /BackgroundIntensity/, "missing BackgroundIntensity type");
    assert.match(src, /bg-motion-vivid/, "missing bg-motion-vivid class");
  });

  it("2. animated-background keeps reduced-motion guard + img fallback", () => {
    const src = read("src/components/effects/animated-background.tsx");
    assert.match(src, /prefers-reduced-motion/, "missing reduced-motion guard");
    assert.match(src, /<img/, "missing <img fallback");
  });

  it("3. background-motion-layer exists, refs orb/twinkle, no Math.random", () => {
    const p = join(ROOT, "src/components/effects/background-motion-layer.tsx");
    assert.ok(existsSync(p), "background-motion-layer.tsx missing");
    const src = read("src/components/effects/background-motion-layer.tsx");
    assert.match(src, /bg-orb/, "missing bg-orb ref");
    assert.match(src, /bg-twinkle-dot|particleTwinkle|twinkle/i, "missing twinkle ref");
    assert.doesNotMatch(src, /Math\.random\s*\(/, "must not call Math.random (hydration)");
  });

  it("4. globals.css has vivid keyframes + classes", () => {
    const css = read("src/app/globals.css");
    for (const k of ["@keyframes bgZoomPan", "@keyframes orbDriftA", "@keyframes particleTwinkle", "@keyframes gradientPanStrong"]) {
      assert.ok(css.includes(k), `missing ${k}`);
    }
    for (const c of [".bg-motion-vivid", ".bg-orb-a", ".landing-cone-animated", ".auth-cone-animated"]) {
      assert.ok(css.includes(c), `missing ${c}`);
    }
  });

  it("5. globals.css reduce-motion kills new motion classes", () => {
    const css = read("src/app/globals.css");
    const idx = css.indexOf("prefers-reduced-motion");
    assert.ok(idx >= 0, "missing reduce block");
    const tail = css.slice(idx);
    assert.ok(tail.includes(".bg-motion-vivid"), "reduce block must list .bg-motion-vivid");
  });

  it("6. landing-static-background defaults vivid + renders motion layer", () => {
    const src = read("src/components/landing/landing-static-background.tsx");
    assert.match(src, /intensity\s*=\s*"vivid"/, "default intensity must be vivid");
    assert.match(src, /BackgroundMotionLayer/, "must render BackgroundMotionLayer");
  });

  it("7. auth-atmosphere union has vivid + defaults vivid", () => {
    const src = read("src/components/effects/auth-atmosphere.tsx");
    assert.ok(src.includes('"vivid"'), "union must contain vivid");
    assert.match(src, /intensity\s*=\s*"vivid"/, "default must be vivid");
  });

  it("8. auth-shell uses vivid, no subtle", () => {
    const src = read("src/components/shell/auth-shell.tsx");
    assert.ok(src.includes('intensity="vivid"'), "must use intensity=vivid");
    assert.ok(!src.includes('intensity="subtle"'), "must not keep intensity=subtle");
  });

  it("9. hero uses strong glow classes", () => {
    const src = read("src/components/landing/particle-ocean-hero.tsx");
    assert.ok(
      src.includes("animate-pulse-glow-strong") || src.includes("animate-subtle-glow-strong"),
      "missing strong glow class"
    );
  });

  it("10. no heavy motion deps added", () => {
    const pkg = JSON.parse(read("package.json"));
    const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const d of ["framer-motion", "gsap", "three"]) {
      assert.ok(!(d in all), `must not add ${d}`);
    }
  });
});
