import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

test("Task 2 - Posts Page implements filtering state, firstRun guard, and 6 skeleton grid", () => {
  const pagePath = path.join(ROOT, "src/app/[locale]/(public)/posts/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.match(content, /firstRun\s*=\s*React\.useRef\(true\)/, "firstRun ref guard must be initialized");
  assert.match(content, /\[filtering,\s*setFiltering\]\s*=\s*React\.useState\(false\)/, "filtering state must be defined");
  assert.match(content, /firstRun\.current\s*=\s*false/, "firstRun must toggle to false after initial mount");
  assert.match(content, /setFiltering\(true\)/, "setFiltering(true) must be called on subsequent queries");
  assert.match(content, /setFiltering\(false\)/, "setFiltering(false) must be called after fetch settles");
  assert.match(content, /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5/, "Skeleton grid must match 6-card layout");
});

test("Task 2 - Zero result state renders 3 featured chips with parity keys", () => {
  const pagePath = path.join(ROOT, "src/app/[locale]/(public)/posts/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.match(content, /trending\.items\.slice\(0,\s*3\)/, "3 featured trending items must be extracted");
  assert.match(content, /featuredLabel/, "featuredLabel translation key must be used");

  const viJson = JSON.parse(fs.readFileSync(path.join(ROOT, "src/dictionaries/vi.json"), "utf-8"));
  const enJson = JSON.parse(fs.readFileSync(path.join(ROOT, "src/dictionaries/en.json"), "utf-8"));

  assert.ok(viJson.posts.featuredLabel, "vi.json must have posts.featuredLabel");
  assert.ok(enJson.posts.featuredLabel, "en.json must have posts.featuredLabel");
});

test("Task 2 - FilterSidebar implements collapsible sections, price presets, and delivery/rating/verified options", () => {
  const sidebarPath = path.join(ROOT, "src/components/composed/filter-sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.match(content, /ChevronDown|ChevronUp/, "FilterSidebar must support collapsible section toggles");
  assert.match(content, /500000/, "FilterSidebar must define price preset with 500,000");
  assert.match(content, /2000000/, "FilterSidebar must define price preset with 2,000,000");
  assert.match(content, /deliveryTime|delivery/, "FilterSidebar must support delivery time filter option");
  assert.match(content, /minRating|rating/, "FilterSidebar must support rating filter option");
  assert.match(content, /onlyVerified|verified/, "FilterSidebar must support verified provider filter option");
});
