import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");
const readAndroid = (p) => fs.readFileSync(path.join(ANDROID_ROOT, p), "utf-8");
const existsAndroid = (p) => fs.existsSync(path.join(ANDROID_ROOT, p));
const readWeb = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const existsWeb = (p) => fs.existsSync(path.join(ROOT, p));

// ==========================================
// C2-5: FLATLIST 60FPS TUNING & MEMO
// ==========================================

test("C2-5 / PERF-01: Mobile catalog.tsx FlatList has tuning parameters", () => {
  const src = readAndroid("src/app/catalog.tsx");
  assert.match(src, /windowSize=\{\s*5\s*\}/, "FlatList must have windowSize={5}");
  assert.match(src, /maxToRenderPerBatch=\{\s*6\s*\}/, "FlatList must have maxToRenderPerBatch={6}");
  assert.match(src, /initialNumToRender=\{\s*6\s*\}/, "FlatList must have initialNumToRender={6}");
  assert.match(src, /keyboardDismissMode=["']on-drag["']/, "FlatList must have keyboardDismissMode='on-drag'");
});

test("C2-5 / PERF-02: Mobile service-card.tsx is wrapped in React.memo", () => {
  const src = readAndroid("src/components/service-card.tsx");
  assert.match(src, /React\.memo/, "service-card.tsx must be memoized with React.memo");
});

// ==========================================
// C2-6: FILTER SHEET & SIDEBAR MODULAR SPLIT
// ==========================================

test("C2-6 / SPLIT-01: Mobile FilterSheet modular sections exist and are composed", () => {
  const mobileSections = [
    "src/components/filters/category-section.tsx",
    "src/components/filters/execution-section.tsx",
    "src/components/filters/budget-section.tsx",
    "src/components/filters/verified-section.tsx",
  ];
  for (const s of mobileSections) {
    assert.ok(existsAndroid(s), `Mobile section ${s} must exist`);
  }

  const sheetSrc = readAndroid("src/components/filter-sheet.tsx");
  assert.match(sheetSrc, /CategorySection/, "filter-sheet.tsx must import/render CategorySection");
  assert.match(sheetSrc, /ExecutionSection/, "filter-sheet.tsx must import/render ExecutionSection");
  assert.match(sheetSrc, /BudgetSection/, "filter-sheet.tsx must import/render BudgetSection");
  assert.match(sheetSrc, /VerifiedSection/, "filter-sheet.tsx must import/render VerifiedSection");
});

test("C2-6 / SPLIT-02: Web FilterSidebar modular sections exist and are composed", () => {
  const webSections = [
    "src/components/composed/filters/category-section.tsx",
    "src/components/composed/filters/execution-section.tsx",
    "src/components/composed/filters/budget-section.tsx",
    "src/components/composed/filters/delivery-section.tsx",
    "src/components/composed/filters/rating-verified-section.tsx",
  ];
  for (const s of webSections) {
    assert.ok(existsWeb(s), `Web section ${s} must exist`);
  }

  const sidebarSrc = readWeb("src/components/composed/filter-sidebar.tsx");
  assert.match(sidebarSrc, /CategorySection/, "filter-sidebar.tsx must import/render CategorySection");
  assert.match(sidebarSrc, /ExecutionSection/, "filter-sidebar.tsx must import/render ExecutionSection");
  assert.match(sidebarSrc, /BudgetSection/, "filter-sidebar.tsx must import/render BudgetSection");
  assert.match(sidebarSrc, /DeliverySection/, "filter-sidebar.tsx must import/render DeliverySection");
  assert.match(sidebarSrc, /RatingVerifiedSection/, "filter-sidebar.tsx must import/render RatingVerifiedSection");
});

// ==========================================
// C2-8: HAPTICS, TOAST & A11Y CONTRACTS
// ==========================================

test("C2-8 / A11Y-01: Mobile toast system exists and has auto-dismiss & alert role", () => {
  assert.ok(existsAndroid("src/components/toast.tsx"), "toast.tsx must exist");
  const src = readAndroid("src/components/toast.tsx");
  assert.match(src, /export\s+function\s+ToastProvider/, "Must export ToastProvider");
  assert.match(src, /export\s+function\s+useToast/, "Must export useToast");
  assert.match(src, /export\s+function\s+ToastHost/, "Must export ToastHost");
  assert.match(src, /2500/, "Toast must have 2500ms auto-dismiss timer");
  assert.match(src, /accessibilityRole=["']alert["']/, "Toast must have accessibilityRole='alert'");
});

test("C2-8 / A11Y-02: Mobile haptics utility safely guards platform errors", () => {
  assert.ok(existsAndroid("src/utils/haptics.ts"), "haptics.ts must exist");
  const src = readAndroid("src/utils/haptics.ts");
  assert.match(src, /selectionAsync/, "Must call selectionAsync");
  assert.match(src, /notificationAsync/, "Must call notificationAsync");
  assert.match(src, /catch/, "Must have try/catch error guard");
});

test("C2-8 / A11Y-03: Mobile offline banner component exists with retry", () => {
  assert.ok(existsAndroid("src/components/offline-banner.tsx"), "offline-banner.tsx must exist");
  const src = readAndroid("src/components/offline-banner.tsx");
  assert.match(src, /export\s+function\s+OfflineBanner/, "Must export OfflineBanner");
  assert.match(src, /onRetry/, "Must accept onRetry callback");
  assert.match(src, /accessibilityRole=["']alert["']/, "Banner must have alert role");
});

test("C2-8 / A11Y-04: Mobile interactive controls define accessibilityLabel and accessibilityRole", () => {
  const searchSrc = readAndroid("src/components/search-bar.tsx");
  assert.match(searchSrc, /accessibilityLabel/, "SearchBar must have accessibilityLabel");
  assert.match(searchSrc, /accessibilityRole=["']button["']/, "SearchBar buttons must have accessibilityRole='button'");

  const filterSrc = readAndroid("src/components/filter-sheet.tsx");
  assert.match(filterSrc, /accessibilityLabel=["']Xóa bộ lọc["']/, "FilterSheet must label clear button");
  assert.match(filterSrc, /accessibilityLabel=["']Áp dụng bộ lọc["']/, "FilterSheet must label apply button");

  const detailSrc = readAndroid("src/app/detail.tsx");
  assert.match(detailSrc, /accessibilityLabel=["']Quay lại["']/, "detail.tsx must label back button");
});
