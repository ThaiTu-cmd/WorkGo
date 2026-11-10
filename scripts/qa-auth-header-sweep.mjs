// Cycle 4 — auth + consolidated header sweep (A1..A8).
//
// Drives the real Next dev server at http://localhost:3000/vi (which serves
// website-frontend/src/_webapp-mirror/components/common/{Header,AuthModal}).
// Proves the mock auth flow end-to-end: the header flips between
// Đăng nhập/Đăng ký and the account group, in both the modal and the
// trung-pages (LoginPage / RegisterPage), and back on logout.
//
// Usage: node scripts/qa-auth-header-sweep.mjs
// Evidence: .team/evidence/cycle4/sweep-results.json + *.png

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = "http://localhost:3000/vi";
const EVIDENCE_DIR = path.resolve(".team/evidence/cycle4");
const NAV_SEL = 'nav[aria-label="Điều hướng bổ sung WorkGo"]';
const PANEL_ID = "#workgo-header-menu";

const VP390 = { name: "390x844", width: 390, height: 844 };
const VP1440 = { name: "1440x900", width: 1440, height: 900 };

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const consoleErrors = [];
const checks = {};
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

async function shoot(page, name) {
  try {
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${name}.png`), caret: "initial" });
  } catch {
    /* best effort */
  }
}

async function load(page) {
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(900);
}

/** Snapshot of the header + SubNav auth state (labels, counts, storage). */
function readAuthState(page) {
  return page.evaluate((panelId) => {
    const header = document.querySelector("header");
    const panel = document.querySelector(panelId);
    const btns = (root) => Array.from((root || document).querySelectorAll("button"));
    const trigger = btns(header).find(
      (b) => /menuTrigger|menuToggle/.test(b.className) && b.getBoundingClientRect().width > 0
    );
    const nav = document.querySelector('nav[aria-label="Điều hướng bổ sung WorkGo"]');
    return {
      panelFound: !!panel,
      panelVisible: panel ? getComputedStyle(panel).display !== "none" : null,
      triggerLabel: trigger ? trigger.textContent.trim().replace(/\s+/g, " ") : null,
      visibleTriggers: btns(header).filter(
        (b) => /menuTrigger|menuToggle/.test(b.className) && b.getBoundingClientRect().width > 0
      ).length,
      desktopNavLinks: header
        ? Array.from(header.querySelectorAll('[class*="navLink"]')).filter((e) => !/Active/.test(e.className)).length
        : 0,
      menuItems: panel ? panel.querySelectorAll('[class*="menuItem"]').length : 0,
      accountName: header ? (header.querySelector('[class*="menuAccountName"]') || {}).textContent || null : null,
      accountEmail: header ? (header.querySelector('[class*="menuAccountEmail"]') || {}).textContent || null : null,
      hasLoginBtn: panel ? !!panel.querySelector('[class*="signInBtn"]') : null,
      hasLogoutBtn: !!Array.from(btns(header)).find((b) => b.textContent.trim() === "Đăng xuất"),
      subNavCount: nav ? nav.querySelectorAll("button").length : null,
      subNavLabels: nav ? Array.from(nav.querySelectorAll("button")).map((b) => b.textContent.trim()) : null,
      token: localStorage.getItem("accessToken"),
      user: localStorage.getItem("workgo_auth_user"),
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, PANEL_ID);
}

async function openPanel(page, vp) {
  if (vp.width >= 1100) {
    await page.locator(`${PANEL_ID}`).evaluate((el) => {
      const header = el.closest("header") || document.querySelector("header");
      const trigger = Array.from(header.querySelectorAll("button")).find(
        (b) => /menuTrigger/.test(b.className) && b.getBoundingClientRect().width > 0
      );
      trigger && trigger.click();
    });
  } else {
    await page.locator('header button[class*="menuToggle"]').click();
  }
  await page.waitForTimeout(250);
}

// ---------------------------------------------------------------------------
// A1 + A2 + A3 — modal login flips the header, logout flips it back
// ---------------------------------------------------------------------------
async function runA1A3(browser, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  trackErrors(page, `A1A3-${vp.name}`);
  const details = {};
  try {
    await load(page);
    details.before = await readAuthState(page);

    // A1 — open the header dropdown, then the "Đăng nhập" entry inside it.
    await openPanel(page, vp);
    const panelOpened = (await readAuthState(page)).panelVisible === true;
    await page.locator(`${PANEL_ID} [class*="signInBtn"]`).click();
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
    details.modalOpened = true;

    await page.locator('[role="dialog"] input[name="userName"]').fill("demo-user");
    await page.locator('[role="dialog"] input[name="password"]').fill("123456");
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page
      .waitForFunction(() => !!localStorage.getItem("accessToken") && !!localStorage.getItem("workgo_auth_user"), {
        timeout: 6000,
      })
      .catch(() => {});
    await page.waitForTimeout(1400); // modal keeps its success state ~1s before closing

    details.afterLogin = await readAuthState(page);
    details.panelOpened = panelOpened;
    await shoot(page, `${vp.name}-A1-after-modal-login`);

    const persist = JSON.parse(details.afterLogin.user || "null");
    const a1 =
      details.modalOpened &&
      details.afterLogin.token !== null &&
      persist &&
      persist.name === "demo-user" &&
      details.afterLogin.accountName === "demo-user" &&
      details.afterLogin.hasLogoutBtn === true;
    const a2 =
      details.before.accountName === null &&
      details.before.hasLoginBtn === true &&
      details.afterLogin.hasLoginBtn === false &&
      details.afterLogin.accountEmail === "demo-user@workgo.demo" &&
      details.afterLogin.subNavCount === 13 &&
      details.before.subNavCount === 15 &&
      details.afterLogin.subNavLabels &&
      !details.afterLogin.subNavLabels.includes("Đăng nhập") &&
      !details.afterLogin.subNavLabels.includes("Đăng ký");

    // A3 — logout from the panel.
    await openPanel(page, vp);
    await page.locator(`${PANEL_ID} button[class*="menuLogout"]`).click();
    await page.waitForTimeout(600);
    details.afterLogout = await readAuthState(page);
    await shoot(page, `${vp.name}-A3-after-logout`);
    const a3 =
      details.afterLogout.token === null &&
      details.afterLogout.user === null &&
      details.afterLogout.accountName === null &&
      details.afterLogout.hasLoginBtn === true &&
      details.afterLogout.hasLogoutBtn === false &&
      details.afterLogout.subNavCount === 15;

    console.log(`[A1 ${vp.name}] ${a1 ? "PASS" : "FAIL"}`);
    console.log(`[A2 ${vp.name}] ${a2 ? "PASS" : "FAIL"}`);
    console.log(`[A3 ${vp.name}] ${a3 ? "PASS" : "FAIL"}`);
    return { passA1: a1, passA2: a2, passA3: a3, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[A1A3 ${vp.name}] FAIL (error) ${details.error}`);
    return { passA1: false, passA2: false, passA3: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// A4 — SubNav "Đăng nhập" page signs in and the header follows
// ---------------------------------------------------------------------------
async function runA4(browser, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  trackErrors(page, `A4-${vp.name}`);
  const details = {};
  try {
    await load(page);
    const clicked = await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      const btn = nav && Array.from(nav.querySelectorAll("button")).find((b) => b.textContent.trim() === "Đăng nhập");
      if (!btn) return false;
      btn.click();
      return true;
    }, NAV_SEL);
    await page.waitForSelector('main input[type="email"]', { timeout: 5000 });
    await page.locator('main input[type="email"]').fill("user@example.com");
    await page.locator('main input[type="password"]').fill("123456");
    await page.locator('main button[type="submit"]').click();
    await page.waitForTimeout(900);
    details.after = await readAuthState(page);
    await shoot(page, `${vp.name}-A4-login-page`);

    const toast = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[class*="toastNotification"]')).some((t) =>
        t.textContent.includes("Đăng nhập thành công")
      )
    );
    const pass =
      clicked &&
      toast &&
      details.after.token !== null &&
      details.after.accountName === "user@example.com" &&
      details.after.subNavCount === 13;
    console.log(`[A4 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[A4 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// A5 (1440) — exactly one dropdown trigger, one closed panel, 2 desktop links
// A6 (390)  — the mobile trigger opens/closes the same always-mounted panel
// ---------------------------------------------------------------------------
async function runA5(browser, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  trackErrors(page, `A5-${vp.name}`);
  let details = {};
  try {
    await load(page);
    const closed = await readAuthState(page);
    await openPanel(page, vp);
    const opened = await readAuthState(page);
    await shoot(page, `${vp.name}-A5-panel-open`);
    // Close again with the same trigger.
    await openPanel(page, vp);
    const reclosed = await readAuthState(page);

    details = { closed, opened, reclosed };
    const pass =
      closed.visibleTriggers === 1 &&
      closed.panelFound === true &&
      closed.panelVisible === false &&
      closed.desktopNavLinks === 2 &&
      closed.subNavCount === 15 &&
      opened.panelVisible === true &&
      opened.menuItems >= 5 &&
      opened.hasLoginBtn === true &&
      opened.accountName === null &&
      reclosed.panelVisible === false &&
      closed.docOverflow <= 1;
    console.log(`[A5 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[A5 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

async function runA6(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  trackErrors(page, "A6-390");
  let details = {};
  try {
    await load(page);
    await page.locator('header button[class*="menuToggle"]').click();
    await page.waitForTimeout(300);
    const opened = await readAuthState(page);
    const box = await page.locator(PANEL_ID).boundingBox();
    await shoot(page, "390x844-A6-drawer-open");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const closed = await readAuthState(page);

    details = { opened, closed, box };
    const pass =
      opened.panelVisible === true &&
      opened.visibleTriggers === 1 &&
      box !== null &&
      box.width <= 391 &&
      box.x >= -1 &&
      box.x + box.width <= 391 &&
      closed.panelVisible === false &&
      closed.docOverflow <= 1;
    console.log(`[A6 390x844] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[A6 390x844] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// A7 — RegisterPage signs the user in straight away (BUG-3)
// ---------------------------------------------------------------------------
async function runA7(browser, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  trackErrors(page, `A7-${vp.name}`);
  const details = {};
  try {
    await load(page);
    // Validation first: submit empty → inline errors, no session.
    await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      const btn = nav && Array.from(nav.querySelectorAll("button")).find((b) => b.textContent.trim() === "Đăng ký");
      btn && btn.click();
    }, NAV_SEL);
    await page.waitForSelector('main input[type="text"]', { timeout: 5000 });
    // Validate on blur: Tab through the three empty fields (keyboard only — no
    // pointer coordinates, so the errors appearing cannot shift the click
    // target out from under the mouse).
    await page.locator('main input[type="text"]').focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    details.validationErrors = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main em")).map((e) => e.textContent.trim())
    );
    details.describedBy = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main input")).map((i) => i.getAttribute("aria-describedby"))
    );
    details.noSessionAfterInvalidSubmit = await page.evaluate(() => localStorage.getItem("accessToken") === null);
    await shoot(page, `${vp.name}-A7-register-validation`);

    await page.locator('main input[type="text"]').fill("Nguyễn Văn A");
    await page.locator('main input[type="email"]').fill("newbie@example.com");
    await page.locator('main input[type="password"]').fill("123456");
    await page.locator('main input[type="password"]').press("Enter");
    await page.waitForTimeout(900);
    details.after = await readAuthState(page);
    await shoot(page, `${vp.name}-A7-register-page-success`);

    const pass =
      details.validationErrors.length >= 3 &&
      details.describedBy.filter(Boolean).length >= 3 &&
      details.noSessionAfterInvalidSubmit === true &&
      details.after.token !== null &&
      details.after.accountName === "Nguyễn Văn A" &&
      details.after.subNavCount === 13 &&
      details.after.hasLogoutBtn === true;
    console.log(`[A7 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[A7 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// A8 — the modal register tab auto-signs-in too, with a clean console
// ---------------------------------------------------------------------------
async function runA8(browser, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  trackErrors(page, `A8-${vp.name}`);
  const details = {};
  try {
    await load(page);
    await openPanel(page, vp);
    await page.locator(`${PANEL_ID} [class*="joinBtn"]`).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.locator('[role="dialog"] input[name="lastName"]').fill("Trần");
    await page.locator('[role="dialog"] input[name="firstName"]').fill("B");
    await page.locator('[role="dialog"] input[name="userName"]').fill("tranb");
    await page.locator('[role="dialog"] input[name="email"]').fill("tranb@example.com");
    await page.locator('[role="dialog"] input[name="password"]').fill("123456");
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page
      .waitForFunction(() => !!localStorage.getItem("workgo_auth_user"), { timeout: 6000 })
      .catch(() => {});
    await page.waitForTimeout(1400);
    details.after = await readAuthState(page);
    await shoot(page, `${vp.name}-A8-modal-register`);

    const pass =
      details.after.token !== null &&
      details.after.accountName === "Trần B" &&
      details.after.accountEmail === "tranb@example.com" &&
      details.after.subNavCount === 13;
    console.log(`[A8 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[A8 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("=== CYCLE 4 AUTH + HEADER SWEEP (A1..A8) on", BASE, "===");
  const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });

  const a1 = await runA1A3(browser, VP1440);
  const a1m = await runA1A3(browser, VP390);
  checks.A1 = { pass: a1.passA1 && a1m.passA1, details: { desktop: a1.details, mobile: a1m.details } };
  checks.A2 = { pass: a1.passA2 && a1m.passA2, details: { desktop: a1.details, mobile: a1m.details } };
  checks.A3 = { pass: a1.passA3 && a1m.passA3, details: { desktop: a1.details, mobile: a1m.details } };
  checks.A4 = await runA4(browser, VP1440).then((r) => ({ pass: r.pass, details: r.details }));
  checks.A5 = await runA5(browser, VP1440).then((r) => ({ pass: r.pass, details: r.details }));
  checks.A6 = await runA6(browser).then((r) => ({ pass: r.pass, details: r.details }));
  checks.A7 = await runA7(browser, VP390).then((r) => ({ pass: r.pass, details: r.details }));
  checks.A8 = await runA8(browser, VP1440).then((r) => ({ pass: r.pass, details: r.details }));

  await browser.close();

  console.log("\n=== SUMMARY ===");
  let failCount = 0;
  for (const id of ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]) {
    const ok = checks[id] && checks[id].pass === true;
    if (!ok) failCount++;
    console.log(`[${id}] ${ok ? "PASS" : "FAIL"}`);
  }
  const a8clean = consoleErrors.filter((e) => !e.startsWith("[A8")).length === 0;
  console.log(`console errors: ${consoleErrors.length}`);
  if (consoleErrors.length) failCount++;

  const out = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    checks,
    consoleErrors,
    consoleClean: consoleErrors.length === 0,
    a8ConsoleClean: a8clean,
    pass: failCount === 0,
    failCount,
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, "sweep-results.json"), JSON.stringify(out, null, 2));
  console.log(`saved: ${path.join(EVIDENCE_DIR, "sweep-results.json")}`);
  process.exit(failCount ? 1 : 0);
}

main().catch((err) => {
  console.error("SWEEP CRASHED:", err);
  process.exit(1);
});
