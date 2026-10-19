// Cycle 4 (Phase 3) — F-17 / debt D4: prove the auth UI does NOT fail silently
// when localStorage is blocked (private mode / quota-full).
//
// Both auth writers must react:
//   - the header dropdown modal (host path: shell → saveAuth → boolean)
//   - the trung-pages LoginPage (page path: `if (!saveAuth(...)) quotaToast`)
//
// Usage: node scripts/qa-auth-quota-sweep.mjs      (dev server on :3000 must be up)
// Evidence: .team/evidence/cycle4/quota-sweep-results.json + *.png

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = "http://localhost:3000/vi";
const EVIDENCE_DIR = path.resolve(".team/evidence/cycle4");
const PANEL_ID = "#workgo-header-menu";
const NAV_SEL = 'nav[aria-label="Điều hướng bổ sung WorkGo"]';
const QUOTA_TOAST =
  "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const consoleErrors = [];
const DEV_INFRA_NOISE = /ERR_INTERNET_DISCONNECTED|_next\/hmr|hmr-client/;

function trackErrors(page, label) {
  page.on("console", (msg) => {
    if (msg.type() !== "error" || DEV_INFRA_NOISE.test(msg.text())) return;
    consoleErrors.push(`[${label}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    if (DEV_INFRA_NOISE.test(err.message)) return;
    consoleErrors.push(`[${label}] pageerror: ${err.message}`);
  });
}

/** Block every localStorage write while keeping reads intact. */
async function blockStorage(page) {
  await page.addInitScript(() => {
    const proto = window.Storage && window.Storage.prototype;
    if (!proto) return;
    proto.setItem = function blockedSetItem() {
      throw new DOMException("QuotaExceededError: storage blocked for the D4 probe", "QuotaExceededError");
    };
    // removeItem may also be blocked in private mode; keep clear() working so
    // the app cannot end up half-cleared (not part of this probe).
  });
}

async function shoot(page, name) {
  try {
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${name}.png`), caret: "initial" });
  } catch {
    /* best effort */
  }
}

function readAuthState(page) {
  return page.evaluate(
    (panelId) => {
      const header = document.querySelector("header");
      const panel = document.querySelector(panelId);
      const dialog = document.querySelector('[role="dialog"]');
      return {
        dialogOpen: !!dialog,
        dialogText: dialog ? dialog.textContent.replace(/\s+/g, " ").trim() : null,
        accountName: header ? (header.querySelector('[class*="menuAccountName"]') || {}).textContent || null : null,
        hasLoginBtn: panel ? !!panel.querySelector('[class*="signInBtn"]') : null,
        token: localStorage.getItem("accessToken"),
        user: localStorage.getItem("workgo_auth_user"),
      };
    },
    PANEL_ID
  );
}

// ---------------------------------------------------------------------------
// Q1 — header modal: blocked storage ⇒ visible quota message, stays open
// ---------------------------------------------------------------------------
async function runQ1(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  trackErrors(page, "Q1");
  const details = {};
  try {
    await blockStorage(page);
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(900);

    await page.locator(`${PANEL_ID}`).evaluate((el) => {
      const header = el.closest("header") || document.querySelector("header");
      const trigger = Array.from(header.querySelectorAll("button")).find(
        (b) => /menuTrigger/.test(b.className) && b.getBoundingClientRect().width > 0
      );
      trigger && trigger.click();
    });
    await page.waitForTimeout(250);
    await page.locator(`${PANEL_ID} [class*="signInBtn"]`).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    await page.locator('[role="dialog"] input[name="userName"]').fill("quota-user");
    await page.locator('[role="dialog"] input[name="password"]').fill("123456");
    await page.locator('[role="dialog"] button[type="submit"]').click();

    // The success path auto-closes after ~1s; a silent failure would close the
    // modal with no message. Wait past that window.
    await page.waitForTimeout(1800);
    details.state = await readAuthState(page);
    await shoot(page, "1440x900-Q1-modal-storage-blocked");

    const pass =
      details.state.token === null &&
      details.state.user === null &&
      details.state.accountName === null &&
      details.state.hasLoginBtn === true &&
      details.state.dialogOpen === true &&
      details.state.dialogText !== null &&
      details.state.dialogText.includes(QUOTA_TOAST);
    console.log(`[Q1 modal/storage-blocked] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[Q1 modal/storage-blocked] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Q2 — trung-pages LoginPage: blocked storage ⇒ quota toast, no session
// ---------------------------------------------------------------------------
async function runQ2(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  trackErrors(page, "Q2");
  const details = {};
  try {
    await blockStorage(page);
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(900);

    await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      const btn = nav && Array.from(nav.querySelectorAll("button")).find((b) => b.textContent.trim() === "Đăng nhập");
      btn && btn.click();
    }, NAV_SEL);
    await page.waitForSelector('main input[type="email"]', { timeout: 5000 });
    await page.locator('main input[type="email"]').fill("quota@example.com");
    await page.locator('main input[type="password"]').fill("123456");
    await page.locator('main button[type="submit"]').click();
    await page.waitForTimeout(900);

    details.state = await readAuthState(page);
    details.toastText = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[class*="toastNotification"]'))
        .map((t) => t.textContent.replace(/\s+/g, " ").trim())
        .join(" | ")
    );
    await shoot(page, "1440x900-Q2-login-page-storage-blocked");

    const pass =
      details.state.token === null &&
      details.state.user === null &&
      details.state.accountName === null &&
      details.toastText.includes(QUOTA_TOAST);
    console.log(`[Q2 login-page/storage-blocked] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[Q2 login-page/storage-blocked] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("=== CYCLE 4 / F-17 QUOTA SWEEP (Q1..Q2) on", BASE, "===");
  const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });

  const q1 = await runQ1(browser);
  const q2 = await runQ2(browser);
  await browser.close();

  const out = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    probe: "localStorage.setItem throws QuotaExceededError (D4 / F-17)",
    expectedCopy: QUOTA_TOAST,
    checks: { Q1: q1, Q2: q2 },
    consoleErrors,
    consoleClean: consoleErrors.length === 0,
    failCount: (q1.pass ? 0 : 1) + (q2.pass ? 0 : 1) + (consoleErrors.length ? 1 : 0),
  };
  out.pass = out.failCount === 0;
  fs.writeFileSync(path.join(EVIDENCE_DIR, "quota-sweep-results.json"), JSON.stringify(out, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(`[Q1] ${q1.pass ? "PASS" : "FAIL"}`);
  console.log(`[Q2] ${q2.pass ? "PASS" : "FAIL"}`);
  console.log(`console errors: ${consoleErrors.length}`);
  console.log(`saved: ${path.join(EVIDENCE_DIR, "quota-sweep-results.json")}`);
  process.exit(out.pass ? 0 : 1);
}

main().catch((err) => {
  console.error("QUOTA SWEEP CRASHED:", err);
  process.exit(1);
});
