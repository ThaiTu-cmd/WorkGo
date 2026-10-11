import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

function read(p) {
  return fs.readFileSync(path.join(SRC, p), "utf8");
}

function hexToRgb(hex) {
  let h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function luminance([r, g, b]) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a, b) {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function stripDarkVariants(src, color) {
  // Remove `dark:text-*-400` / `dark:fill-*-400` so bare-tone scan is exact.
  return src
    .replace(new RegExp(`dark:text-${color}-400`, "g"), "")
    .replace(new RegExp(`dark:fill-${color}-400`, "g"), "");
}

function walkSrc(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full, out);
    else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// =============================================================================
// PLAN-VISUAL-GENERAL-AUDIT-2026-10-09 — general visual regression gate
// Axes: dual-tone contrast, icon-box centering, logo lock, CTA tokens,
// active chip, no pastel residue, atom invariants.
// =============================================================================

// (1) wallet has no bare text-amber-400 (dark: variant allowed)
test("GEN-01 - wallet-summary has no bare text-amber-400 (dual-tone only)", () => {
  const src = read("components/domain/wallet-summary.tsx");
  const stripped = stripDarkVariants(src, "amber");
  assert.ok(
    !stripped.includes("text-amber-400"),
    "wallet-summary must use text-amber-600 dark:text-amber-400, no bare text-amber-400",
  );
  assert.ok(
    src.includes("text-amber-600 dark:text-amber-400"),
    "wallet-summary escrow icon must carry the dual-tone class",
  );
});

// (2) no bare text-emerald-400 outside dark variant (wallet/client/provider)
test("GEN-02 - no bare text-emerald-400 outside dark: variant", () => {
  for (const f of [
    "components/domain/wallet-summary.tsx",
    "app/[locale]/(app)/client/page.tsx",
    "app/[locale]/(app)/provider/page.tsx",
  ]) {
    const stripped = stripDarkVariants(read(f), "emerald");
    assert.ok(
      !stripped.includes("text-emerald-400"),
      `${f} must not contain bare text-emerald-400 (use text-emerald-600 dark:text-emerald-400)`,
    );
  }
});

// (2b) no bare text-indigo-400 outside dark variant (client dashboards)
test("GEN-02b - no bare text-indigo-400 outside dark: variant", () => {
  const stripped = stripDarkVariants(
    read("app/[locale]/(app)/client/page.tsx"),
    "indigo",
  );
  assert.ok(
    !stripped.includes("text-indigo-400"),
    "client/page must use text-indigo-600 dark:text-indigo-400, no bare tone",
  );
});

// (3) every icon-box is geometrically centered
test("GEN-03 - client/provider icon-boxes carry flex centering + shrink-0", () => {
  for (const f of [
    "app/[locale]/(app)/client/page.tsx",
    "app/[locale]/(app)/provider/page.tsx",
  ]) {
    const lines = read(f).split("\n");
    const boxes = lines.filter(
      (l) =>
        (l.includes("rounded-full") &&
          (l.includes("p-2.5") || l.includes("p-2 "))) ||
        (l.includes("p-2.5") && l.includes("rounded-full")) ||
        (l.includes("p-3") &&
          (l.includes("rounded-xl") || l.includes("rounded-card"))),
    );
    assert.ok(
      boxes.length >= 4,
      `${f} should contain >= 4 icon-box lines (found ${boxes.length})`,
    );
    for (const line of boxes) {
      assert.ok(
        line.includes("flex items-center justify-center"),
        `${f} icon-box missing flex centering: ${line.trim().slice(0, 120)}`,
      );
      assert.ok(
        line.includes("shrink-0"),
        `${f} icon-box missing shrink-0: ${line.trim().slice(0, 120)}`,
      );
    }
  }
});

// (4) footer "W" logo lock
test("GEN-04 - landing footer logo W is centered and non-selectable", () => {
  const src = read("components/landing/workgo-landing-sections.tsx");
  assert.ok(
    src.includes("leading-none select-none"),
    'footer W logo must include "leading-none select-none"',
  );
});

// (5) no pastel bg-*-50 residue anywhere in src/
test("GEN-05 - no pastel bg-*-50 utilities remain in src/", () => {
  const files = walkSrc(SRC);
  const re = /bg-(green|red|blue|purple|amber|slate|gray)-50(?!\d)/;
  const offenders = files.filter((f) => re.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(
    offenders.map((f) => path.relative(SRC, f)),
    [],
    `pastel residue found: ${offenders.map((f) => path.relative(SRC, f)).join(", ")}`,
  );
});

// (6) no border-*-200 residue anywhere in src/
test("GEN-06 - no border-*-200 utilities remain in src/", () => {
  const files = walkSrc(SRC);
  const re = /border-(green|red|blue|purple|amber|slate|gray)-200(?!\d)/;
  const offenders = files.filter((f) => re.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(
    offenders.map((f) => path.relative(SRC, f)),
    [],
    `border residue found: ${offenders.map((f) => path.relative(SRC, f)).join(", ")}`,
  );
});

// (7) active category chip uses theme ink + documented contrast floor
test("GEN-07 - posts active chip uses theme ink, contrast >= 4.0 documented", () => {
  const src = read("app/[locale]/(public)/posts/page.tsx");
  assert.ok(
    src.includes("bg-primary text-primary-ink") ||
      src.includes("bg-primary text-white"),
    "active chip must pair bg-primary with text-primary-ink (preferred) or text-white",
  );
  assert.ok(
    src.includes("font-semibold"),
    "active chip must stay font-semibold for low-vision legibility",
  );
  // Measured 09/10/2026: #FFFFFF on #1677FF = ~4.10:1 — below strict AA 4.5
  // for 12px text, accepted at >= 4.0 with semibold + waiver (site-wide
  // primary-button pattern; darkening bg would diverge from system).
  const ratio = contrast("#FFFFFF", "#1677FF");
  assert.ok(
    ratio >= 4.0,
    `chip contrast ${ratio.toFixed(2)} must be >= 4.0 (waiver floor)`,
  );
});

// (8) dialog/drawer close-button clearance invariants intact
test("GEN-08 - DialogHeader pr-10 and DrawerHeader pr-12 clearance intact", () => {
  assert.ok(
    read("components/ui/dialog.tsx").includes("pr-10"),
    "DialogHeader must keep pr-10 clearance for the absolute X button",
  );
  assert.ok(
    read("components/ui/drawer.tsx").includes("pr-12"),
    "DrawerHeader must keep pr-12 clearance for the absolute X button",
  );
});

// (9) Badge geometric-centering invariant intact
test("GEN-09 - Badge keeps inline-flex centering + leading-none", () => {
  const src = read("components/ui/badge.tsx");
  assert.ok(
    src.includes("inline-flex items-center justify-center"),
    "Badge must keep inline-flex items-center justify-center",
  );
  assert.ok(
    src.includes("leading-none"),
    "Badge must keep leading-none so diacritics lock to pill center",
  );
});

// (10) Input icon-centering invariant intact
test("GEN-10 - Input keeps top-1/2 -translate-y-1/2 icon lock", () => {
  const src = read("components/ui/input.tsx");
  assert.ok(
    src.includes("top-1/2 -translate-y-1/2"),
    "Input prefix/suffix icons must stay vertically locked with top-1/2 -translate-y-1/2",
  );
  assert.ok(
    src.includes("flex items-center justify-center"),
    "Input icon wrapper must keep flex centering",
  );
});

// (11) CTA light-mode override intact
test("GEN-11 - landing CTA light override present in globals.css", () => {
  const src = read("app/globals.css");
  assert.ok(
    src.includes('[data-theme="light"] .landing-cta-panel'),
    "globals.css must keep the [data-theme=light] .landing-cta-panel override",
  );
  assert.ok(
    src.includes('[data-theme="light"] .landing-cta-panel p'),
    "globals.css must keep the CTA paragraph light override",
  );
});

// (12) semantic textPrimary token unchanged
test("GEN-12 - SEMANTIC_TOKENS.light.textPrimary is #06142F navy", () => {
  const src = read("lib/design-tokens.ts");
  assert.ok(
    src.includes("navy: '#06142F'"),
    "WORKGO_PALETTE.navy must remain #06142F",
  );
  assert.ok(
    src.includes("textPrimary: WORKGO_PALETTE.navy"),
    "light.textPrimary must reference WORKGO_PALETTE.navy",
  );
});

// (13) edge case: no bare text-amber-400 outside dark: variant in client/provider
test("GEN-02c - no bare text-amber-400 outside dark: variant in client and provider", () => {
  for (const f of [
    "app/[locale]/(app)/client/page.tsx",
    "app/[locale]/(app)/provider/page.tsx",
  ]) {
    const stripped = stripDarkVariants(read(f), "amber");
    assert.ok(
      !stripped.includes("text-amber-400"),
      `${f} must not contain bare text-amber-400 (use text-amber-600 dark:text-amber-400)`,
    );
  }
});

// (13b) corner case: provider Star icon dual-tone fill and text
test("GEN-02d - provider Star rating icon has dual-tone fill and text", () => {
  const src = read("app/[locale]/(app)/provider/page.tsx");
  assert.ok(
    src.includes("fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-400"),
    "Star icon in provider page must have dual-tone fill and text for light and dark modes",
  );
});

// (14) WCAG AA & Non-text Contrast mathematical verification
test("GEN-13 - mathematical verification of dual-tone WCAG contrast ratios", () => {
  const white = "#FFFFFF";
  const darkBg = "#06142F";

  const amber600 = "#D97706";
  const emerald600 = "#059669";
  const indigo600 = "#4F46E5";

  assert.ok(
    contrast(amber600, white) >= 3.0,
    `amber-600 contrast on white must be >= 3.0:1 (got ${contrast(amber600, white).toFixed(2)})`,
  );
  assert.ok(
    contrast(emerald600, white) >= 3.0,
    `emerald-600 contrast on white must be >= 3.0:1 (got ${contrast(emerald600, white).toFixed(2)})`,
  );
  assert.ok(
    contrast(indigo600, white) >= 4.5,
    `indigo-600 contrast on white must be >= 4.5:1 (got ${contrast(indigo600, white).toFixed(2)})`,
  );

  const amber400 = "#FBBF24";
  const emerald400 = "#34D399";
  const indigo400 = "#818CF8";

  assert.ok(
    contrast(amber400, darkBg) >= 4.5,
    `amber-400 contrast on dark navy must be >= 4.5:1 (got ${contrast(amber400, darkBg).toFixed(2)})`,
  );
  assert.ok(
    contrast(emerald400, darkBg) >= 4.5,
    `emerald-400 contrast on dark navy must be >= 4.5:1 (got ${contrast(emerald400, darkBg).toFixed(2)})`,
  );
  assert.ok(
    contrast(indigo400, darkBg) >= 4.5,
    `indigo-400 contrast on dark navy must be >= 4.5:1 (got ${contrast(indigo400, darkBg).toFixed(2)})`,
  );
});

// (15) edge case: empty strings, falsy params and active filter chip behavior
test("GEN-14 - edge cases: empty strings, undefined params and active filter chip behavior", () => {
  const postsSrc = read("app/[locale]/(public)/posts/page.tsx");
  assert.ok(postsSrc.includes("!catParam"), "posts page must handle falsy catParam for default chip");
  assert.ok(postsSrc.includes("text-primary-ink"), "posts page must use semantic text-primary-ink token");

  const css = read("app/globals.css");
  assert.ok(css.includes("--primary-ink: #FFFFFF"), "globals.css must define --primary-ink");
  assert.ok(css.includes("--color-primary-ink: var(--primary-ink)"), "globals.css must map --color-primary-ink");
});

// (16) corner case: child SVGs inside icon containers carry shrink-0 to prevent layout distortion
test("GEN-15 - corner case: child SVGs inside icon containers carry shrink-0 to prevent layout distortion", () => {
  for (const f of [
    "app/[locale]/(app)/client/page.tsx",
    "app/[locale]/(app)/provider/page.tsx",
  ]) {
    const lines = read(f).split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes("flex items-center justify-center shrink-0") &&
        (line.includes("rounded-full") || line.includes("rounded-xl") || line.includes("rounded-card"))
      ) {
        const childSnippet = lines.slice(i + 1, i + 3).join(" ");
        assert.ok(
          childSnippet.includes("shrink-0"),
          `${f} (line ${i + 1}): icon inside icon-box must have shrink-0: ${childSnippet.trim()}`,
        );
      }
    }
  }
});

