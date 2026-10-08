import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

function read(rel) {
  return fs.readFileSync(path.join(SRC, rel), "utf8");
}

// =============================================================================
// QA TEST SUITE: VISUAL LAYOUT & CONTRAST AUDIT (PLAN-VISUAL-AUDIT-2026-10)
// Static source-contract gate: no hardcoded colors that blend into the
// background, safe clearance for headers/inputs, WCAG 2.1 AA contrast math.
// =============================================================================

// -----------------------------------------------------------------------------
// WCAG 2.1 relative-luminance + contrast-ratio helpers
// -----------------------------------------------------------------------------
function hexToLinearChannel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (
    0.2126 * hexToLinearChannel(r) +
    0.7152 * hexToLinearChannel(g) +
    0.0722 * hexToLinearChannel(b)
  );
}

function contrastRatio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// -----------------------------------------------------------------------------
// TC-VIS-01: Header logo never invisible on light background
// -----------------------------------------------------------------------------
test("TC-VIS-01 - public-header logo uses semantic text-fg (never hardcoded text-white)", () => {
  const src = read("components/shell/public-header.tsx");
  assert.ok(
    src.includes("text-fg group-hover:text-primary"),
    "Logo must use text-fg so it stays visible on light surface",
  );
  assert.ok(
    !src.includes('<span className="text-white'),
    "Logo must not hardcode text-white (invisible on white light surface)",
  );
  // WCAG AA: #06142F on #FFFFFF must be >= 4.5:1 (actually ~15.9:1, AAA)
  const ratio = contrastRatio("#06142F", "#FFFFFF");
  assert.ok(ratio >= 4.5, `text-fg on light surface contrast ${ratio.toFixed(2)} must be >= 4.5:1`);
});

// -----------------------------------------------------------------------------
// TC-VIS-02: Mobile drawer follows theme (no hardcoded navy bg)
// -----------------------------------------------------------------------------
test("TC-VIS-02 - app-shell mobile drawer uses bg-surface (theme-aware)", () => {
  const src = read("components/shell/app-shell-client.tsx");
  assert.ok(
    src.includes("bg-surface/95"),
    "Mobile drawer must use bg-surface/95 so it adapts to light/dark theme",
  );
  assert.ok(
    !src.includes("bg-[#06142F]/95"),
    "Mobile drawer must not hardcode navy bg-[#06142F]/95 (unreadable in light mode)",
  );
  // Drawer menu text in light mode: #3D4E73 on #FFFFFF >= 4.5:1
  const ratio = contrastRatio("#3D4E73", "#FFFFFF");
  assert.ok(ratio >= 4.5, `menu text on light drawer contrast ${ratio.toFixed(2)} must be >= 4.5:1`);
});

// -----------------------------------------------------------------------------
// TC-VIS-03: Wallet summary cards harmonized across themes
// -----------------------------------------------------------------------------
test("TC-VIS-03 - wallet-summary available-balance card has no dark hardcoded gradient", () => {
  const src = read("components/domain/wallet-summary.tsx");
  assert.ok(
    !src.includes("rgba(12,18,38"),
    "Available-balance card must not contain hardcoded dark rgba(12,18,38,...) gradient",
  );
  assert.ok(
    src.includes("from-primary/15 via-surface to-surface"),
    "Available-balance card must use theme-aware gradient",
  );
});

// -----------------------------------------------------------------------------
// TC-VIS-04: Star rating empty state is transparent (not glowing white)
// -----------------------------------------------------------------------------
test("TC-VIS-04 - star-rating empty stars use fill-transparent (dark-mode safe)", () => {
  const src = read("components/ui/star-rating.tsx");
  assert.ok(
    !src.includes("fill-slate-100"),
    "Empty stars must not use fill-slate-100 (glows white in dark mode)",
  );
  assert.ok(
    src.includes("fill-transparent text-fg-tertiary/40"),
    "Empty stars must use fill-transparent with muted tertiary outline",
  );
});

// -----------------------------------------------------------------------------
// TC-VIS-05: Drawer/Dialog header clearance + footer gap (no overlap, no margin clash)
// -----------------------------------------------------------------------------
test("TC-VIS-05 - drawer header has pr-12 clearance for close button", () => {
  const src = read("components/ui/drawer.tsx");
  assert.ok(
    src.includes("p-6 pr-12"),
    "DrawerHeader must include pr-12 so long titles never slide under the X button",
  );
});

test("TC-VIS-05b - dialog header has pr-10 clearance and footer uses gap without space-x", () => {
  const src = read("components/ui/dialog.tsx");
  assert.ok(
    src.includes("pr-10"),
    "DialogHeader must include pr-10 clearance for the absolute X button",
  );
  assert.ok(
    !src.includes("sm:space-x-2"),
    "DialogFooter must not combine sm:space-x-2 with gap-2 (margin overlap bug)",
  );
  assert.ok(
    src.includes("sm:justify-end gap-2"),
    "DialogFooter must lay out actions with gap-2",
  );
});

// -----------------------------------------------------------------------------
// TC-VIS-06: Search input clearance for clear-X button
// -----------------------------------------------------------------------------
test("TC-VIS-06 - posts search input reserves pr-10 so text never underlaps the X", () => {
  const src = read("app/[locale]/(public)/posts/page.tsx");
  assert.ok(
    src.includes("h-11 pl-10 pr-10"),
    "Search input must carry pr-10 matching the absolute right-3 clear button",
  );
});

// -----------------------------------------------------------------------------
// TC-VIS-07: No glaring pastel alert boxes (semantic tokens only)
// -----------------------------------------------------------------------------
test("TC-VIS-07 - alert/status boxes use semantic tokens, never hardcoded pastel bg-*-50", () => {
  const files = [
    "app/[locale]/(public)/posts/[id]/page.tsx",
    "app/[locale]/(app)/provider/page.tsx",
    "components/domain/accept-confirm-modal.tsx",
    "components/domain/review-modal.tsx",
    "app/[locale]/(app)/disputes/[id]/page.tsx",
    "components/domain/payment-panel.tsx",
    "components/composed/application-table.tsx",
    "components/ui/toast.tsx",
    "components/composed/post-card.tsx",
  ];
  // NOTE: boundary-aware match — bg-amber-500/15 tint chips are legal,
  // only exact pastel bg-*-50 utilities are forbidden.
  const forbidden = [
    /bg-green-50(?!\d)/,
    /bg-amber-50(?!\d)/,
    /bg-purple-50(?!\d)/,
    /bg-red-50(?!\d)/,
    /hover:bg-red-50(?!\d)/,
  ];
  for (const f of files) {
    const src = read(f);
    for (const re of forbidden) {
      assert.ok(
        !re.test(src),
        `${f} must not contain ${re} (glaring white box in dark mode)`,
      );
    }
  }
  // Positive spot-checks that semantic tokens landed
  assert.ok(
    read("app/[locale]/(public)/posts/[id]/page.tsx").includes("bg-success-bg"),
    "post-detail applied box must use bg-success-bg",
  );
  assert.ok(
    read("components/domain/accept-confirm-modal.tsx").includes("bg-warning-bg"),
    "accept-confirm fee notice must use bg-warning-bg",
  );
  assert.ok(
    read("components/domain/review-modal.tsx").includes("bg-warning-bg"),
    "review-modal notice must use bg-warning-bg",
  );
  assert.ok(
    read("app/[locale]/(app)/disputes/[id]/page.tsx").includes("hover:bg-danger-bg"),
    "dispute report button must use hover:bg-danger-bg",
  );
  assert.ok(
    read("components/ui/toast.tsx").includes("border-success/30"),
    "toast borderColors must use semantic border-success/30",
  );
});

test("TC-VIS-07b - semantic status pairs meet WCAG AA (>= 3.0:1 for UI components)", () => {
  // Dark theme pairs
  assert.ok(contrastRatio("#34D399", "#06142F") >= 3.0, "dark success on surface >= 3.0:1");
  assert.ok(contrastRatio("#F59E0B", "#06142F") >= 3.0, "dark warning on surface >= 3.0:1");
  assert.ok(contrastRatio("#EF4444", "#06142F") >= 3.0, "dark danger on surface >= 3.0:1");
  // Light theme pairs
  assert.ok(contrastRatio("#059669", "#FFFFFF") >= 3.0, "light success on surface >= 3.0:1");
  assert.ok(contrastRatio("#D97706", "#FFFFFF") >= 3.0, "light warning on surface >= 3.0:1");
  assert.ok(contrastRatio("#DC2626", "#FFFFFF") >= 3.0, "light danger on surface >= 3.0:1");
});

// -----------------------------------------------------------------------------
// TC-VIS-08: Switch + post-card badges + select options are theme-safe
// -----------------------------------------------------------------------------
test("TC-VIS-08 - switch unchecked state uses muted token (not slate-700)", () => {
  const src = read("components/ui/switch.tsx");
  assert.ok(
    !src.includes("bg-slate-700"),
    "Switch unchecked must not use bg-slate-700 (looks ON in light mode)",
  );
  assert.ok(
    src.includes("data-[state=unchecked]:bg-muted"),
    "Switch unchecked must use bg-muted",
  );
});

test("TC-VIS-08b - post-card execution badges adapt to both themes", () => {
  const src = read("components/composed/post-card.tsx");
  assert.ok(
    src.includes("text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"),
    "DIGITAL badge must use dual-theme cyan tokens",
  );
  assert.ok(
    src.includes("text-amber-600 dark:text-amber-400 bg-amber-500/10"),
    "non-DIGITAL badge must use dual-theme amber tokens",
  );
  assert.ok(
    !src.includes("bg-cyan-950/30") && !src.includes("bg-amber-950/30"),
    "Badges must not use dark-only *-950/30 backgrounds",
  );
});

// -----------------------------------------------------------------------------
// TC-ALIGN: text & icon centering contracts (PLAN-VISUAL-ALIGNMENT-AUDIT-2026-10)
// -----------------------------------------------------------------------------
test("TC-ALIGN-01 - badge inner structure centers icon + text (no baseline drift)", () => {
  const src = read("components/ui/badge.tsx");
  assert.ok(
    src.includes("inline-flex items-center justify-center leading-none select-none"),
    "Badge root must be inline-flex centered with leading-none",
  );
  assert.ok(
    src.includes("shrink-0 inline-flex items-center justify-center"),
    "Badge icon wrapper must be shrink-0 and centered",
  );
  assert.ok(
    src.includes("inline-flex items-center gap-1.5 leading-none"),
    "Badge children wrapper must be inline-flex centered with leading-none",
  );
});

test("TC-ALIGN-02 - input affixes are vertically centered (top-1/2 -translate-y-1/2)", () => {
  const src = read("components/ui/input.tsx");
  assert.ok(
    src.includes("absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"),
    "prefixIcon container must be absolutely centered on the vertical axis",
  );
  assert.ok(
    src.includes("absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"),
    "suffix container must be absolutely centered on the vertical axis",
  );
});

test("TC-ALIGN-03 - button variants eliminate line-height sag + icon squish", () => {
  const src = read("components/ui/button.tsx");
  assert.ok(src.includes("leading-none"), "buttonVariants must include leading-none");
  assert.ok(
    src.includes("[&>svg]:shrink-0"),
    "buttonVariants must protect direct-child svg icons with shrink-0",
  );
});

test("TC-ALIGN-04 - avatar initials sit at the circle centroid", () => {
  const src = read("components/ui/avatar.tsx");
  assert.ok(
    src.includes("leading-none flex items-center justify-center"),
    "Avatar initials span must be centered with leading-none",
  );
});

test("TC-ALIGN-05 - post-card budget pill + rows are geometrically centered", () => {
  const src = read("components/composed/post-card.tsx");
  assert.ok(
    src.includes("inline-flex items-center justify-center") && src.includes("leading-none"),
    "Budget pill must be inline-flex centered with leading-none (never inline-block)",
  );
  assert.ok(
    !src.includes("inline-block px-3 py-1 rounded-full"),
    "Budget pill must not use inline-block baseline layout",
  );
  assert.ok(
    src.includes("[&>svg]:shrink-0"),
    "Location/deadline rows must guard icons with [&>svg]:shrink-0",
  );
});

test("TC-ALIGN-06 - logo W boxes use leading-none on all 5 headers/shells", () => {
  const files = [
    "components/shell/public-header.tsx",
    "components/landing/workgo-navbar.tsx",
    "components/shell/app-shell-client.tsx",
    "components/shell/auth-shell.tsx",
    "components/shell/app-header.tsx",
  ];
  for (const f of files) {
    assert.ok(
      read(f).includes("leading-none select-none"),
      `${f} logo box must include leading-none select-none`,
    );
  }
  assert.ok(
    read("components/landing/workgo-navbar.tsx").includes("ArrowRight className=\"w-3.5 h-3.5 shrink-0\""),
    "Navbar CTA ArrowRight must be shrink-0",
  );
});

test("TC-ALIGN-07 - filter X buttons + live counter + hero pill + greetings centered", () => {
  const posts = read("app/[locale]/(public)/posts/page.tsx");
  assert.ok(
    posts.includes("inline-flex items-center justify-center rounded-full p-0.5"),
    "Filter X buttons must be inline-flex centered",
  );
  assert.ok(
    posts.includes("animate-pulse shrink-0") && posts.includes('<span className="leading-none">'),
    "Live counter dot must be shrink-0 and label leading-none",
  );
  const hero = read("components/landing/particle-ocean-hero.tsx");
  assert.ok(
    hero.includes("animate-pulse shrink-0") && hero.includes('<span className="leading-none">'),
    "Hero pill dot must be shrink-0 and label leading-none",
  );
  for (const f of [
    "app/[locale]/(app)/client/page.tsx",
    "app/[locale]/(app)/provider/page.tsx",
  ]) {
    const src = read(f);
    assert.ok(
      src.includes("animate-pulse shrink-0") && src.includes('<span className="leading-none">{greeting}</span>'),
      `${f} greeting badge must center Sparkles icon and leading-none text`,
    );
  }
  const sections = read("components/landing/workgo-landing-sections.tsx");
  assert.ok(
    sections.includes("inline-flex items-center gap-1 text-[#34D399] leading-none [&>svg]:shrink-0"),
    "Escrow badge must be inline-flex centered with guarded icon",
  );
  const sidebar = read("components/shell/sidebar.tsx");
  assert.ok(
    sidebar.includes("ml-auto inline-flex items-center justify-center leading-none"),
    "Sidebar count badge must be inline-flex centered with leading-none",
  );
});

test("TC-ALIGN-08 - star-rating buttons have fixed centered hit-area", () => {
  const src = read("components/ui/star-rating.tsx");
  assert.ok(
    src.includes("inline-flex items-center justify-center"),
    "Star buttons must be inline-flex centered (touch-stable, EC-07)",
  );
});

test("TC-VIS-08c - globals.css styles native select options + light CTA contrast", () => {
  const css = read("app/globals.css");
  assert.ok(css.includes("select option"), "globals.css must style native select option elements");
  assert.ok(
    css.includes("background-color: var(--bg-surface)"),
    "select options must use var(--bg-surface) background",
  );
  assert.ok(
    css.includes("color: var(--text-primary)"),
    "select options must use var(--text-primary) foreground",
  );
  assert.ok(
    css.includes('[data-theme="light"] .landing-cta-panel p'),
    "globals.css must override landing CTA paragraph color in light mode",
  );
  assert.ok(
    css.includes("rgba(255, 255, 255, 0.95)"),
    "light CTA paragraph must be near-white for contrast on blue gradient",
  );
});
