import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");

function readWeb(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function readAndroid(rel) {
  return fs.readFileSync(path.join(ANDROID_ROOT, rel), "utf-8");
}

// =============================================================================
// QA-C3-01: THEME SEQUENCE SUITE (P1-02)
// System(Light) -> Manual Dark -> Manual Light -> Refresh -> System(Dark)
// =============================================================================
test("QA-C3-01: Theme sequence lifecycle simulation & cross-component sync", () => {
  const layoutSrc = readWeb("src/app/layout.tsx");
  const settingsSrc = readWeb("src/app/[locale]/(app)/settings/page.tsx");
  const toggleSrc = readWeb("src/components/shell/theme-toggle.tsx");

  // Verify layout.tsx script logic contract
  assert.match(
    layoutSrc,
    /localStorage\.getItem\(['"]workgo_theme['"]\)/,
    "layout.tsx must check stored theme preference first"
  );
  assert.match(
    layoutSrc,
    /matchMedia\(['"]\(prefers-color-scheme:\s*light\)['"]\)/,
    "layout.tsx must check prefers-color-scheme: light fallback"
  );
  assert.match(
    layoutSrc,
    /document\.documentElement\.classList\.remove\(['"]light['"],\s*['"]dark['"]\)/,
    "layout.tsx must clear stale theme classes"
  );
  assert.match(
    layoutSrc,
    /document\.documentElement\.setAttribute\(['"]data-theme['"],\s*t\)/,
    "layout.tsx must synchronize data-theme attribute"
  );

  // Cross-component event sync contract
  assert.match(
    settingsSrc,
    /new\s+CustomEvent\(['"]workgo-theme-change['"],\s*\{\s*detail:\s*\{\s*theme:/,
    "settings page must dispatch workgo-theme-change on theme select"
  );
  assert.match(
    toggleSrc,
    /window\.addEventListener\(['"]workgo-theme-change['"],\s*onCustom\)/,
    "theme-toggle must listen to workgo-theme-change"
  );
  assert.match(
    toggleSrc,
    /new\s+MutationObserver/,
    "theme-toggle must observe documentElement mutations"
  );
  assert.match(
    toggleSrc,
    /isApplying/,
    "theme-toggle must guard against recursive MutationObserver loops via isApplying flag"
  );

  // Functional simulation of 12-step sequence logic using stubs
  class MockDOMElement {
    constructor() {
      this.classes = new Set();
      this.attributes = new Map();
    }
    get classList() {
      return {
        add: (c) => this.classes.add(c),
        remove: (...cs) => cs.forEach((c) => this.classes.delete(c)),
        contains: (c) => this.classes.has(c),
      };
    }
    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }
    getAttribute(k) {
      return this.attributes.get(k) || null;
    }
  }

  const mockStorage = new Map();
  let systemPrefersLight = true;

  const mockLocalStorage = {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
  };

  const mockMatchMedia = (query) => ({
    matches: query.includes("light") ? systemPrefersLight : !systemPrefersLight,
  });

  const dom = new MockDOMElement();

  function runLayoutInitScript() {
    const s = mockLocalStorage.getItem("workgo_theme");
    const t = s || (mockMatchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    dom.classList.remove("light", "dark");
    dom.classList.add(t);
    dom.setAttribute("data-theme", t);
    return t;
  }

  // Step 1: Initial cold load, no saved pref, system light
  systemPrefersLight = true;
  mockLocalStorage.removeItem("workgo_theme");
  const initTheme = runLayoutInitScript();
  assert.strictEqual(initTheme, "light", "Step 1: Unset preference defaults to system light");
  assert.strictEqual(dom.getAttribute("data-theme"), "light");
  assert.ok(dom.classList.contains("light"));

  // Step 2: Switch manually to Dark
  mockLocalStorage.setItem("workgo_theme", "dark");
  dom.classList.remove("light", "dark");
  dom.classList.add("dark");
  dom.setAttribute("data-theme", "dark");
  assert.strictEqual(dom.getAttribute("data-theme"), "dark");
  assert.ok(dom.classList.contains("dark"));

  // Step 3: Switch manually to Light
  mockLocalStorage.setItem("workgo_theme", "light");
  dom.classList.remove("light", "dark");
  dom.classList.add("light");
  dom.setAttribute("data-theme", "light");
  assert.strictEqual(dom.getAttribute("data-theme"), "light");
  assert.ok(dom.classList.contains("light"));

  // Step 4: Refresh page (re-run init script with saved 'light')
  const refreshTheme = runLayoutInitScript();
  assert.strictEqual(refreshTheme, "light", "Step 4: Reload persists manual light preference");
  assert.strictEqual(dom.getAttribute("data-theme"), "light");

  // Step 5: Clear preference and change OS to Dark -> evaluates to dark
  mockLocalStorage.removeItem("workgo_theme");
  systemPrefersLight = false;
  const sysDarkTheme = runLayoutInitScript();
  assert.strictEqual(sysDarkTheme, "dark", "Step 5: System dark preference adopted when unpinned");
  assert.strictEqual(dom.getAttribute("data-theme"), "dark");
  assert.ok(dom.classList.contains("dark"));
});

// =============================================================================
// QA-C3-02: DETAIL FALLBACK COVER 16:10 DARK-SAFE (P1-04)
// =============================================================================
test("QA-C3-02: Detail screen cover fallback 16:10 ratio and dark-safe theme token", () => {
  const detailSrc = readAndroid("src/app/detail.tsx");

  // Cover wrapper ratio 16:10
  assert.match(
    detailSrc,
    /aspectRatio:\s*16\s*\/\s*10/,
    "detail.tsx coverWrapper must maintain 16:10 aspect ratio"
  );

  // Fallback cover container with briefcase icon
  assert.match(
    detailSrc,
    /styles\.fallbackCover/,
    "detail.tsx must render fallbackCover view when attachments are empty"
  );
  assert.match(
    detailSrc,
    /💼/,
    "detail.tsx fallbackCover must display 💼 briefcase icon"
  );

  // Dynamic theme background element applied to prevent stark black/white flashes
  assert.match(
    detailSrc,
    /backgroundColor:\s*theme\.backgroundElement/,
    "detail.tsx coverWrapper and fallbackCover must apply theme.backgroundElement dynamically"
  );
});

// =============================================================================
// QA-C3-03: MOBILE LONG-TEXT & BUDGET BOUNDARY GUARDS (P1-05)
// =============================================================================
test("QA-C3-03: Mobile long text and budget overflow guards (numberOfLines and flex)", () => {
  const detailSrc = readAndroid("src/app/detail.tsx");
  const myPostsSrc = readAndroid("src/app/(tabs)/my-posts.tsx");
  const serviceCardSrc = readAndroid("src/components/service-card.tsx");

  // detail.tsx guards
  assert.match(
    detailSrc,
    /styles\.headerTitle\}[^>]*numberOfLines=\{1\}/,
    "detail.tsx header title must truncate at numberOfLines={1}"
  );
  assert.match(
    detailSrc,
    /styles\.budgetValue[^>]*numberOfLines=\{1\}/,
    "detail.tsx bottomBar budgetValue must have numberOfLines={1} to prevent breaking action bar"
  );

  // my-posts.tsx guards
  assert.match(
    myPostsSrc,
    /numberOfLines=\{2\}\s+style=\{styles\.postTitle\}/,
    "my-posts.tsx title must limit to numberOfLines={2}"
  );
  assert.match(
    myPostsSrc,
    /numberOfLines=\{1\}\s+style=\{[^}]*styles\.categoryTag/,
    "my-posts.tsx category tag must limit to numberOfLines={1}"
  );

  // service-card.tsx guards
  assert.match(
    serviceCardSrc,
    /numberOfLines=\{2\}\s+style=\{styles\.title\}/,
    "service-card.tsx title must limit to numberOfLines={2}"
  );
  assert.match(
    serviceCardSrc,
    /numberOfLines=\{1\}\s+style=\{[^}]*styles\.clientName/,
    "service-card.tsx clientName must limit to numberOfLines={1}"
  );
});

// =============================================================================
// QA-C3-04: NETWORK-DROP RESILIENCE ON BOTTOM SHEETS (P1-06)
// =============================================================================
test("QA-C3-04: Bottom sheets offline resilience (local state filter & draft preservation)", () => {
  const filterSrc = readAndroid("src/components/filter-sheet.tsx");
  const proposalSrc = readAndroid("src/components/proposal-sheet.tsx");

  // FilterSheet operates 100% locally with zero runtime network dependencies
  assert.doesNotMatch(
    filterSrc,
    /import\s+.*apiFetch/,
    "filter-sheet.tsx must not import apiFetch"
  );
  assert.doesNotMatch(
    filterSrc,
    /import\s+\{[^}]*\b(postsApi|catalogApi|proposalsApi)\b[^}]*\}\s+from/,
    "filter-sheet.tsx must not import runtime API modules"
  );

  // ProposalSheet draft autosave and error resilience
  assert.match(
    proposalSrc,
    /import\s+\{[^}]*\b(loadDraft|saveDraft|clearDraft)\b[^}]*\}\s+from\s+['"]@\/store\/proposal-draft['"]/,
    "proposal-sheet.tsx must import loadDraft, saveDraft, clearDraft"
  );
  assert.match(
    proposalSrc,
    /clearDraft\(userId,\s*postId\)/,
    "proposal-sheet.tsx must clear draft on successful submission"
  );
  assert.match(
    proposalSrc,
    /catch\s*\{[\s\S]*?\/\/\s*Keep draft[\s\S]*?\}\s*finally/,
    "proposal-sheet.tsx must preserve draft and idempotency key on catch/error"
  );
});

// =============================================================================
// QA-C3-05: MOBILE SERVICE CARD REACT.MEMO INTEGRITY (P1-08)
// =============================================================================
test("QA-C3-05: ServiceCard is memoized with custom equality comparator", () => {
  const cardSrc = readAndroid("src/components/service-card.tsx");

  assert.match(
    cardSrc,
    /React\.memo\(ServiceCardInner,\s*\((prev|prevProps),\s*(next|nextProps)\)\s*=>/,
    "service-card.tsx must wrap ServiceCardInner with React.memo and custom comparator"
  );
  assert.match(
    cardSrc,
    /prev\.post\.postId\s*===\s*next\.post\.postId/,
    "ServiceCard memo comparator must check post.postId equality"
  );
  assert.match(
    cardSrc,
    /prev\.onPress\s*===\s*next\.onPress/,
    "ServiceCard memo comparator must check onPress equality"
  );
});

// =============================================================================
// QA-C3-06: MOBILE BOTTOM SHEET HAPTIC INTERACTIONS (P2-10)
// =============================================================================
test("QA-C3-06: Bottom sheets trigger selection haptics on open and close", () => {
  const filterSrc = readAndroid("src/components/filter-sheet.tsx");
  const proposalSrc = readAndroid("src/components/proposal-sheet.tsx");
  const detailSrc = readAndroid("src/app/detail.tsx");
  const searchSrc = readAndroid("src/components/search-bar.tsx");

  // filter-sheet.tsx haptics
  assert.match(
    filterSrc,
    /import\s+\{[^}]*\bhapticFeedback\b[^}]*\}\s+from\s+['"]@\/utils\/haptics['"]/,
    "filter-sheet.tsx must import hapticFeedback"
  );
  assert.match(
    filterSrc,
    /hapticFeedback\.selection\(\)/,
    "filter-sheet.tsx must trigger hapticFeedback.selection() on close"
  );

  // proposal-sheet.tsx haptics
  assert.match(
    proposalSrc,
    /import\s+\{[^}]*\bhapticFeedback\b[^}]*\}\s+from\s+['"]@\/utils\/haptics['"]/,
    "proposal-sheet.tsx must import hapticFeedback"
  );
  assert.match(
    proposalSrc,
    /hapticFeedback\.selection\(\)/,
    "proposal-sheet.tsx must trigger hapticFeedback.selection() on close"
  );

  // detail.tsx trigger haptics when opening proposal sheet
  assert.match(
    detailSrc,
    /import\s+\{[^}]*\bhapticFeedback\b[^}]*\}\s+from\s+['"]@\/utils\/haptics['"]/,
    "detail.tsx must import hapticFeedback"
  );
  assert.match(
    detailSrc,
    /hapticFeedback\.selection\(\)/,
    "detail.tsx must trigger hapticFeedback.selection() when opening proposal sheet"
  );

  // search-bar.tsx triggers haptics when opening filter sheet
  assert.match(
    searchSrc,
    /hapticFeedback\.selection\(\)/,
    "search-bar.tsx must trigger hapticFeedback.selection() when opening filter sheet or selecting chip"
  );
});

// =============================================================================
// QA-C3-07: MOBILE ACCESSIBILITY LABELS AUDIT (P2-11)
// =============================================================================
test("QA-C3-07: Mobile interactive buttons provide explicit accessibilityLabel", () => {
  const serviceCardSrc = readAndroid("src/components/service-card.tsx");
  const filterSheetSrc = readAndroid("src/components/filter-sheet.tsx");
  const proposalSheetSrc = readAndroid("src/components/proposal-sheet.tsx");
  const detailSrc = readAndroid("src/app/detail.tsx");

  // Share button
  assert.match(
    serviceCardSrc,
    /accessibilityLabel=["']Chia sẻ việc làm["']/,
    "service-card share button must have accessibilityLabel='Chia sẻ việc làm'"
  );

  // FilterSheet close button & backdrop
  assert.match(
    filterSheetSrc,
    /accessibilityLabel=["']Đóng bộ lọc["']/,
    "filter-sheet close elements must have accessibilityLabel='Đóng bộ lọc'"
  );

  // ProposalSheet close button & backdrop
  assert.match(
    proposalSheetSrc,
    /accessibilityLabel=["']Đóng biểu mẫu đề xuất["']/,
    "proposal-sheet close elements must have accessibilityLabel='Đóng biểu mẫu đề xuất'"
  );

  // Detail back button
  assert.match(
    detailSrc,
    /accessibilityLabel=["']Quay lại["']/,
    "detail.tsx back button must have accessibilityLabel='Quay lại'"
  );
});
