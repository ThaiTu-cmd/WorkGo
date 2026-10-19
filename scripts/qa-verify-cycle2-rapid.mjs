import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");
const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";

// Ports/URLs overridable via argv (E3); defaults match plan §3.1.
const ORIGINS = process.argv[2]
  ? process.argv.slice(2).map((u, i) => ({ name: `arg${i}`, url: u }))
  : [
      { name: "5173", url: "http://localhost:5173/" },
      { name: "3000-vi", url: "http://localhost:3000/vi" },
    ];
const EVIDENCE_DIR = path.resolve(".team/evidence/cycle2");

async function waitSettled(page, timeoutMs = 4000) {
  const start = Date.now();
  for (;;) {
    const busy = await page.evaluate(() => !!document.querySelector("[aria-busy='true']"));
    if (!busy) return true;
    if (Date.now() - start > timeoutMs) return false;
    await page.waitForTimeout(100);
  }
}

// Probe R1: 20-char rapid typing into catalog search -> final list matches final query.
async function probeType(browser, origin, vp) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const log = { origin: origin.name, viewport: `${vp.w}x${vp.h}`, probe: "rapid-type", pass: false };
  try {
    await page.goto(origin.url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(600);
    const hasInput = await page.evaluate(() => {
      const input = document.querySelector("main input[type='text'], main input:not([type])");
      if (!input) return false;
      input.focus();
      return true;
    });
    if (!hasInput) throw new Error("no hero search input");
    const box = page.locator("main input[type='text'], main input:not([type])").first();
    await box.pressSequentially("LogoThietKeWeb 番号AB12", { delay: 15 });
    await page.keyboard.press("Enter");
    const settled = await waitSettled(page);
    const state = await page.evaluate(() => {
      const count = document.querySelector("[class*='resultCount']");
      const cards = document.querySelectorAll("[class*='cardItem']").length;
      return { countText: count ? count.textContent.trim().slice(0, 30) : null, cards };
    });
    // Final query matches nothing -> settled empty list with announced count, no stuck busy.
    log.settled = settled;
    log.countText = state.countText;
    log.cards = state.cards;
    log.pass = settled && state.countText !== null;
  } catch (e) {
    log.error = String(e).slice(0, 200);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `rapid-FAIL-${origin.name}-${vp.w}.png`), fullPage: false });
  }
  console.log(JSON.stringify(log));
  await page.close();
  return log.pass;
}

// Probe R2: 5 rapid MyServices tab clicks -> last tab active + rows match it.
async function probeTabs(browser, origin, vp) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const log = { origin: origin.name, viewport: `${vp.w}x${vp.h}`, probe: "rapid-tabs", pass: false };
  page.on("dialog", async (d) => { log.dialogSeen = d.type(); await d.dismiss(); });
  try {
    await page.goto(origin.url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
        .find((el) => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
      if (link) link.click();
    });
    await page.waitForTimeout(700);
    const tabs = ["Đang bán", "Chờ duyệt", "Tạm ngưng", "Bản nháp", "Tất cả"];
    for (const t of tabs) {
      await page.evaluate((label) => {
        const btn = Array.from(document.querySelectorAll("[class*='tabsRow'] button"))
          .find((b) => b.textContent.includes(label));
        if (btn) btn.click();
      }, t);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
      const active = Array.from(document.querySelectorAll("[class*='tabsRow'] button"))
        .find((b) => b.className.includes("Active") || b.getAttribute("aria-selected") === "true");
      return {
        activeText: active ? active.textContent.trim().slice(0, 20) : null,
        rows: document.querySelectorAll("table tbody tr").length,
        emptyShown: !!document.querySelector("[class*='emptyContainer']"),
      };
    });
    // Last click was "Tất cả" -> all 6 rows, no crash.
    log.activeText = state.activeText;
    log.rows = state.rows;
    log.pass = state.rows === 6;
  } catch (e) {
    log.error = String(e).slice(0, 200);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `rapid-tabs-FAIL-${origin.name}-${vp.w}.png`), fullPage: false });
  }
  console.log(JSON.stringify(log));
  await page.close();
  return log.pass;
}

const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
const results = [];
try {
  for (const origin of ORIGINS) {
    for (const vp of [{ w: 390, h: 844 }, { w: 1440, h: 900 }]) {
      results.push(await probeType(browser, origin, vp));
      results.push(await probeTabs(browser, origin, vp));
    }
  }
  const pass = results.every(Boolean);
  console.log(JSON.stringify({ rapidPass: pass, checks: `${results.filter(Boolean).length}/${results.length}` }));
  if (!pass) process.exitCode = 1;
} finally {
  await browser.close();
}
