import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const SRC = path.join(REPO, "website-frontend", "src", "_webapp-mirror");
const MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

const read = (p) => fs.readFileSync(p, "utf-8");
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

// ---------- C2-1: 1024px band guard ----------
test("C2-1: header has 900-1100px band tightening (gap + font + search width)", () => {
  const css = read(path.join(SRC, "components/common/Header/Header.module.css"));
  assert.match(css, /@media\s*\(min-width:\s*900px\)\s*and\s*\(max-width:\s*1100px\)/);
  const band = css.slice(css.indexOf("@media (min-width: 900px) and (max-width: 1100px)"));
  assert.match(band, /\.desktopNav\s*\{[^}]*gap:\s*16px/);
  assert.match(band, /\.navLink\s*\{[^}]*font-size:\s*0\.88rem/);
  assert.match(band, /\.navSearch\s*\{[^}]*width:\s*240px/);
});

// ---------- C2-2: hit-area ::after guards ----------
for (const [name, file, cls] of [
  ["arrow", "components/home/PopularServices/PopularServices.module.css", "arrowBtn"],
  ["tag", "components/home/HeroBanner/HeroBanner.module.css", "tagBtn"],
  ["chip", "pages/CatalogSearch/components/SearchToolbar/SearchToolbar.module.css", "chipRemoveBtn"],
]) {
  test(`C2-2: .${cls} has position:relative + ::after inset -6px (${name})`, () => {
    const css = read(path.join(SRC, file));
    assert.match(css, new RegExp(`\\.${cls}\\s*\\{[^}]*position:\\s*relative`));
    assert.match(css, new RegExp(`\\.${cls}::after\\s*\\{[^}]*inset:\\s*-6px`));
  });
}

test("C2-2: chip row wraps and chip remove meets 32px minimum", () => {
  const css = read(path.join(SRC, "pages/CatalogSearch/components/SearchToolbar/SearchToolbar.module.css"));
  assert.match(css, /\.chipRow\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /\.chipRow\s*\{[^}]*min-width:\s*0/);
  assert.match(css, /\.chipRemoveBtn\s*\{[^}]*min-width:\s*32px/);
  assert.match(css, /\.chipRemoveBtn\s*\{[^}]*min-height:\s*32px/);
});

// ---------- C2-3: skeleton shimmer ----------
for (const f of [
  "components/common/Skeleton/SkeletonServiceCard.jsx",
  "components/common/Skeleton/SkeletonServiceCard.module.css",
  "components/common/Skeleton/SkeletonTable.jsx",
  "components/common/Skeleton/SkeletonTable.module.css",
]) {
  test(`C2-3: skeleton file exists in src and mirror byte-identical: ${f}`, () => {
    const src = path.join(SRC, f);
    const dst = path.join(MIRROR, f);
    assert.ok(fs.existsSync(src), `missing ${f}`);
    assert.ok(fs.existsSync(dst), `mirror missing ${f}`);
    assert.equal(sha256(dst), sha256(src), `mirror hash mismatch: ${f}`);
  });
}

test("C2-3: skeleton CSS has shimmer + prefers-reduced-motion killswitch", () => {
  for (const f of [
    "components/common/Skeleton/SkeletonServiceCard.module.css",
    "components/common/Skeleton/SkeletonTable.module.css",
  ]) {
    const css = read(path.join(SRC, f));
    assert.match(css, /@keyframes\s+\w*[Ss]himmer/);
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  }
});

test("C2-3: skeleton components are aria-hidden and Catalog debounces isFiltering", () => {
  const card = read(path.join(SRC, "components/common/Skeleton/SkeletonServiceCard.jsx"));
  const table = read(path.join(SRC, "components/common/Skeleton/SkeletonTable.jsx"));
  assert.match(card, /aria-hidden="true"/);
  assert.match(table, /aria-hidden="true"/);
  assert.match(card, /count\s*=\s*6/);
  const catalog = read(path.join(SRC, "pages/CatalogSearch/CatalogSearchPage.jsx"));
  assert.match(catalog, /isFiltering/);
  assert.match(catalog, /setTimeout\(\(\)\s*=>\s*setIsFiltering\(false\),\s*250\)/);
  assert.match(catalog, /SkeletonServiceCard/);
});

// ---------- C2-4: empty-state actions ----------
test("C2-4: ServicesTable empty has optional props + two action buttons", () => {
  const jsx = read(path.join(SRC, "pages/MyServices/components/ServicesTable/ServicesTable.jsx"));
  assert.match(jsx, /onClearFilters\?|onClearFilters,/);
  assert.match(jsx, /onCreateService\?|onCreateService,/);
  assert.match(jsx, /emptyResetBtn/);
  assert.match(jsx, /emptySecondaryBtn/);
  assert.match(jsx, /Xóa tất cả bộ lọc/);
  assert.match(jsx, /Tạo dịch vụ mới/);
  const css = read(path.join(SRC, "pages/MyServices/components/ServicesTable/ServicesTable.module.css"));
  assert.match(css, /\.emptyResetBtn\s*\{[^}]*min-height:\s*44px/);
  assert.match(css, /\.emptySecondaryBtn\s*\{[^}]*min-height:\s*44px/);
});

test("C2-4: MyServicesPage wires onClearFilters/onCreateService (full reset)", () => {
  const jsx = read(path.join(SRC, "pages/MyServices/MyServicesPage.jsx"));
  assert.match(jsx, /onClearFilters=\{handleClearFilters\}/);
  assert.match(jsx, /setActiveTab\('ALL'\)/);
  assert.match(jsx, /setSearchQuery\(''\)/);
  assert.match(jsx, /setSelectedCategory\('ALL'\)/);
});

test("C2-5: My Services loads provider services from catalog-service", () => {
  const shell = read(path.join(REPO, "website-frontend/src/components/webapp-bridge/webapp-shell.tsx"));
  assert.doesNotMatch(shell, /providerServicesStore|mockProviderServices/);
  const page = read(path.join(REPO, "website-frontend/src/_webapp-mirror/pages/MyServices/MyServicesPage.jsx"));
  assert.match(page, /useMyServices\(\)/);
});

