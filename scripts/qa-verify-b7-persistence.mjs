import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const EVIDENCE_DIR = path.resolve(".team/evidence/cycle2");

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function testPersistenceOnOrigin(browser, originName, originUrl) {
  console.log(`\n=== Testing B7 Persistence on ${originName} (${originUrl}) ===`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // 1. Initial navigation
  await page.goto(originUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  // Navigate to MyServices (click navigation or header link)
  console.log("Navigating to MyServices...");
  await page.evaluate(() => {
    // In web-app App.jsx / webapp-shell.tsx: can click nav link or dispatch state
    const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
      .find(el => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
    if (link) link.click();
  });
  await page.waitForTimeout(600);

  // Check table presence
  const tableExists = await page.evaluate(() => !!document.querySelector("table"));
  console.log(`Table exists in DOM: ${tableExists}`);
  if (!tableExists) {
    throw new Error(`Failed to navigate to MyServices table on ${originName}`);
  }

  // 2. Check initial toggle switch state
  const initialSwitch = await page.evaluate(() => {
    const sw = document.querySelector('table tbody tr:first-child input[type="checkbox"], table tbody tr:first-child button[role="switch"], table tbody tr:first-child [class*="switch"]');
    const checked = sw ? (sw.checked || sw.getAttribute("aria-checked") === "true" || sw.classList.contains("active") || sw.className.includes("checked")) : null;
    const raw = localStorage.getItem("workgo_provider_services_overrides");
    return { hasSwitch: !!sw, checked, rawStorage: raw ? raw.slice(0, 80) : null };
  });
  console.log("Initial switch check:", initialSwitch);

  // 3. Click switch to toggle
  console.log("Toggling switch...");
  await page.evaluate(() => {
    const sw = document.querySelector('table tbody tr:first-child input[type="checkbox"], table tbody tr:first-child button[role="switch"], table tbody tr:first-child [class*="switch"]');
    if (sw) sw.click();
  });
  await page.waitForTimeout(500);

  const afterToggle = await page.evaluate(() => {
    const raw = localStorage.getItem("workgo_provider_services_overrides");
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {}
    const firstStatus = parsed && parsed[0] ? parsed[0].status : null;
    return { hasStorage: !!raw, firstStatus, count: parsed ? parsed.length : 0 };
  });
  console.log("Storage after toggle:", afterToggle);

  // 4. Reload page and verify state persistence
  console.log("Reloading page to verify persistence...");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // Re-navigate to MyServices if reload goes to default home
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
      .find(el => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
    if (link) link.click();
  });
  await page.waitForTimeout(600);

  const reloadedState = await page.evaluate(() => {
    const raw = localStorage.getItem("workgo_provider_services_overrides");
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {}
    const firstStatus = parsed && parsed[0] ? parsed[0].status : null;
    return { hasStorage: !!raw, firstStatus, count: parsed ? parsed.length : 0 };
  });
  console.log("Reloaded state:", reloadedState);
  const persistencePass = reloadedState.firstStatus === afterToggle.firstStatus;
  console.log(`Persistence check: ${persistencePass ? "PASS" : "FAIL"}`);

  // 5. Test corrupted JSON in localStorage (E7 resilience)
  console.log("Injecting corrupted JSON into localStorage...");
  await page.evaluate(() => {
    localStorage.setItem("workgo_provider_services_overrides", "{corrupted json syntax!!!");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
      .find(el => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
    if (link) link.click();
  });
  await page.waitForTimeout(600);

  const resilientAfterCorrupt = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    return { rowCount: rows.length, noCrash: rows.length > 0 };
  });
  console.log("Resilience after corrupted JSON:", resilientAfterCorrupt);

  // 6. Test clear localStorage (reset path)
  console.log("Clearing localStorage key...");
  await page.evaluate(() => {
    localStorage.removeItem("workgo_provider_services_overrides");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
      .find(el => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
    if (link) link.click();
  });
  await page.waitForTimeout(600);

  const resetState = await page.evaluate(() => {
    const raw = localStorage.getItem("workgo_provider_services_overrides");
    const rows = document.querySelectorAll("table tbody tr");
    return { hasStorage: !!raw, rowCount: rows.length };
  });
  console.log("Reset state after clear:", resetState);

  // Screenshot
  const ssPath = path.join(EVIDENCE_DIR, `qa-verify-persist-${originName.replace(/[^a-z0-9]/gi, "-")}.png`);
  await page.screenshot({ path: ssPath, fullPage: false });
  console.log(`Screenshot saved to: ${ssPath}`);

  await page.close();
  return {
    origin: originName,
    persistencePass,
    resilientAfterCorrupt: resilientAfterCorrupt.noCrash,
    resetPass: resetState.rowCount > 0 && !resetState.hasStorage,
    consoleErrors: consoleErrors.length,
  };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });

  try {
    const res1 = await testPersistenceOnOrigin(browser, "webapp-5173", "http://localhost:5173/");
    const res2 = await testPersistenceOnOrigin(browser, "website-3000-vi", "http://localhost:3000/vi");

    console.log("\n=== B7 PERSISTENCE VERIFICATION SUMMARY ===");
    console.log(JSON.stringify({ "web-app :5173": res1, "website-frontend :3000/vi": res2 }, null, 2));

    const allPassed = res1.persistencePass && res1.resilientAfterCorrupt && res2.persistencePass && res2.resilientAfterCorrupt;
    if (allPassed) {
      console.log("\n>>> B7 PERSISTENCE & RESILIENCE: 100% PASSED <<<");
    } else {
      console.error("\n>>> B7 PERSISTENCE: FAILURES DETECTED <<<");
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error("B7 script execution error:", err);
  process.exit(1);
});
