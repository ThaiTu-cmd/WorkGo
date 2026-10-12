import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("C3-JOURNEY-01: Step 1 — Search input hardening, limits, and sanitization", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  assert.match(formSrc, /export const SEARCH_MAX_LENGTH = 100/, "Search must enforce 100 max length constant");
  assert.match(formSrc, /sanitizeSearchQuery/, "Search query must be sanitized before usage");
  assert.match(formSrc, /maxLength=\{SEARCH_MAX_LENGTH\}/, "Input must have maxLength attribute bound");
});

test("C3-JOURNEY-02: Step 2 — Suggestions Combobox & Recent Searches Selection", () => {
  const suggestionsSrc = read("src/components/landing/fiverr/fiverr-search-suggestions.tsx");

  assert.match(suggestionsSrc, /role="listbox"/, "Suggestions container must have role=listbox");
  assert.match(suggestionsSrc, /role="option"/, "Each suggestion item must have role=option");
  assert.match(suggestionsSrc, /role="group"/, "Must group items into distinct categories");
  assert.match(suggestionsSrc, /onClearHistory/, "Must provide clear history action for user control");
});

test("C3-JOURNEY-03: Step 3 — Search Form Navigation to Posts Marketplace", () => {
  const formSrc = read("src/components/landing/fiverr/fiverr-search-form.tsx");

  assert.match(
    formSrc,
    /router\.push\(`\/\$\{locale\}\/posts\?q=\$\{encodeURIComponent\(q\)\}`\)/,
    "Search form submit and suggestion select must navigate to posts marketplace with encoded query"
  );
});

test("C3-JOURNEY-04: Step 4 — Posts Marketplace parameter extraction and URL state of truth", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsSrc, /qParam\s*=\s*searchParams\.get\(["']q["']\)/, "Posts page must read q parameter from searchParams");
  assert.match(postsSrc, /postsApi\s*\.list\(\{/, "Posts page must query posts API with active parameters");
});

test("C3-JOURNEY-05: Step 5 — Quick Category Pills synchronize query with page reset", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");

  assert.match(postsSrc, /quickPills/, "Posts page must render quick category pills");
  assert.match(postsSrc, /updateQuery\(\{\s*q:\s*label,\s*page:\s*1\s*\}\)/, "Clicking a quick pill must update q and reset page to 1");
  assert.match(postsSrc, /pill-scroll\s+rail-momentum/, "Quick pills must feature touch momentum scrolling");
});

test("C3-JOURNEY-06: Step 6 — Posts grid renders PostCards with proper locale routing", () => {
  const postsSrc = read("src/app/[locale]/(public)/posts/page.tsx");
  const postCardSrc = read("src/components/composed/post-card.tsx");

  assert.match(postsSrc, /<PostCard\s+post=\{post\}\s+locale=\{locale\}\s*\/>/, "Posts page must render PostCard components");
  assert.match(
    postCardSrc,
    /href=\{`\/\$\{locale\}\/posts\/\$\{post\.postId\}`\}/,
    "PostCard must link directly to the localized post details page"
  );
});

test("C3-JOURNEY-07: Step 7 — Post details page loads details and mounts ProposalDrawer", () => {
  assert.ok(exists("src/app/[locale]/(public)/posts/[id]/page.tsx"), "Post detail page must exist");
  const detailSrc = read("src/app/[locale]/(public)/posts/[id]/page.tsx");

  assert.match(detailSrc, /<ProposalDrawer/, "Post detail page must mount ProposalDrawer");
  assert.match(detailSrc, /setDrawerOpen\(true\)/, "Action button must open ProposalDrawer");
  assert.match(detailSrc, /t\(["']applyNow["']\)/, "Action button must use localized applyNow label");
});

test("C3-JOURNEY-08: Step 8 — Conversion Funnel Integrity: zero missing files and zero broken contracts", () => {
  const paths = [
    "src/lib/landing/recent-searches.ts",
    "src/lib/landing/adaptive-3d.ts",
    "src/lib/landing/format-price.ts",
    "src/components/landing/fiverr/fiverr-search-form.tsx",
    "src/components/landing/fiverr/fiverr-search-suggestions.tsx",
    "src/app/[locale]/(public)/posts/page.tsx",
    "src/components/composed/post-card.tsx",
    "src/app/[locale]/(public)/posts/[id]/page.tsx",
  ];

  for (const p of paths) {
    assert.ok(exists(p), `Funnel step file ${p} must exist and be accessible`);
  }
});
