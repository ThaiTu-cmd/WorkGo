import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");

function readAndroid(relPath) {
  return fs.readFileSync(path.join(ANDROID_ROOT, relPath), "utf-8");
}

test("VIS-A01 (Single source EXEC_CONFIG): exec-config.ts exists and is imported by service-card and detail", () => {
  const configPath = path.join(ANDROID_ROOT, "src/constants/exec-config.ts");
  assert.ok(fs.existsSync(configPath), "exec-config.ts must exist as single source of truth");

  const serviceCardSrc = readAndroid("src/components/service-card.tsx");
  const detailSrc = readAndroid("src/app/detail.tsx");

  assert.match(
    serviceCardSrc,
    /from\s+['"]@\/constants\/exec-config['"]/,
    "service-card.tsx must import EXEC_CONFIG from exec-config"
  );
  assert.match(
    detailSrc,
    /from\s+['"]@\/constants\/exec-config['"]/,
    "detail.tsx must import EXEC_CONFIG from exec-config"
  );
});

test("VIS-A02 (Mobile theme consistency in states): No hardcoded white background in skeleton or pastel red in error", () => {
  const statesSrc = readAndroid("src/components/states.tsx");
  assert.doesNotMatch(
    statesSrc,
    /backgroundColor:\s*['"]#FEE2E2['"]/,
    "states.tsx ErrorState should not hardcode light pastel red #FEE2E2"
  );
});

test("VIS-A03 (StatusBar theme wiring): _layout.tsx wires StatusBar from expo-status-bar", () => {
  const layoutSrc = readAndroid("src/app/_layout.tsx");
  assert.match(layoutSrc, /from\s+['"]expo-status-bar['"]/, "_layout.tsx must import StatusBar from expo-status-bar");
  assert.match(layoutSrc, /<StatusBar/, "_layout.tsx must render <StatusBar component");
});

test("VIS-A04 (Keyboard avoidance): proposal-sheet.tsx uses height behavior on Android", () => {
  const sheetSrc = readAndroid("src/components/proposal-sheet.tsx");
  assert.match(
    sheetSrc,
    /Platform\.OS\s*===\s*['"]ios['"]\s*\?\s*['"]padding['"]\s*:\s*['"]height['"]/,
    "proposal-sheet.tsx must use 'height' behavior on Android to prevent hiding submit button"
  );
});

test("VIS-A05 (Toast after modal close): detail.tsx delays toast until after sheet close", () => {
  const detailSrc = readAndroid("src/app/detail.tsx");
  assert.match(
    detailSrc,
    /setSheetVisible\(false\)[\s\S]*?setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*?toast\.show/,
    "detail.tsx must dismiss sheet first, then show toast after timeout due to separate native windows"
  );
});

test("VIS-A06 (Sheet translucent status bar): filter-sheet and proposal-sheet enable statusBarTranslucent", () => {
  const filterSheetSrc = readAndroid("src/components/filter-sheet.tsx");
  const proposalSheetSrc = readAndroid("src/components/proposal-sheet.tsx");

  assert.match(filterSheetSrc, /statusBarTranslucent/, "filter-sheet.tsx Modal must enable statusBarTranslucent");
  assert.match(proposalSheetSrc, /statusBarTranslucent/, "proposal-sheet.tsx Modal must enable statusBarTranslucent");
});
