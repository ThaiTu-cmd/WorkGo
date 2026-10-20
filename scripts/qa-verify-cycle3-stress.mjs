import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");
const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const EVIDENCE_DIR = path.resolve(".team/evidence/cycle3-final");
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const ORIGINS = [
  { name: "3000-vi", url: "http://localhost:3000/vi" },
];

function failShot(page, name) {
  return page.screenshot({ path: path.join(EVIDENCE_DIR, `stress-FAIL-${name}.png`), fullPage: false });
}

// (a) Fast-3G CLS: skeleton rect vs settled card rect + LayoutShift sum.
async function clsProbe(browser, origin, vp, reduce) {
  const tag = `${origin.name}-${vp.w}${reduce ? "-reduce" : ""}`;
  const contextOpts = { viewport: { width: vp.w, height: vp.h } };
  if (reduce) {
    try { contextOpts.reducedMotion = "reduce"; } catch { /* old engine: ignore */ }
  }
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();
  const log = { origin: origin.name, viewport: `${vp.w}x${vp.h}`, probe: "cls", reduce: !!reduce, pass: false };
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 150, downloadThroughput: 204800, uploadThroughput: 76800,
    });
    await page.goto(origin.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.evaluate(() => {
      window.__clsSum = 0;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (!e.hadRecentInput) window.__clsSum += e.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch { /* older engine */ }
    });
    // search -> catalog skeleton
    await page.evaluate(() => {
      const input = document.querySelector("main input[type='text'], main input:not([type])");
      if (input) {
        input.focus();
        document.execCommand("insertText", false, "Logo");
        const form = input.closest("form");
        if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    });
    // poll for skeleton presence, capture first skeleton rect
    let skRect = null;
    for (let i = 0; i < 40; i++) {
      skRect = await page.evaluate(() => {
        const sk = document.querySelector("[aria-busy='true'] [class*='sk'], [class*='skCard'], [aria-busy='true'] > div");
        if (!sk) return null;
        const r = sk.getBoundingClientRect();
        return r.width > 0 ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
      });
      if (skRect) break;
      await page.waitForTimeout(150);
    }
    // wait settle: busy gone + cards present
    let settled = false;
    for (let i = 0; i < 40; i++) {
      settled = await page.evaluate(() => !document.querySelector("[aria-busy='true']") && document.querySelectorAll("[class*='cardItem']").length > 0);
      if (settled) break;
      await page.waitForTimeout(200);
    }
    const after = await page.evaluate(() => {
      const card = document.querySelector("[class*='cardItem']");
      const r = card ? card.getBoundingClientRect() : null;
      let sum = null;
      try { sum = (window.__clsSum ?? null); } catch { /* ignore */ }
      if (sum === null) {
        try { sum = performance.getEntriesByType("layout-shift").filter((e) => !e.hadRecentInput).reduce((a, e) => a + e.value, 0); } catch { sum = null; }
      }
      return { cardRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, clsSum: sum };
    });
    let rectDiff = null;
    if (skRect && after.cardRect) {
      rectDiff = Math.max(
        Math.abs(skRect.x - after.cardRect.x), Math.abs(skRect.y - after.cardRect.y),
        Math.abs(skRect.w - after.cardRect.w), Math.abs(skRect.h - after.cardRect.h)
      );
    }
    log.skRect = skRect;
    log.cardRect = after.cardRect;
    log.clsSum = after.clsSum;
    log.rectDiff = rectDiff;
    // PASS: CLS sum < 0.01, or fallback rect diff <= 2px (E4).
    log.pass = (typeof after.clsSum === "number" && after.clsSum < 0.01)
      || (rectDiff !== null && rectDiff <= 2);
    if (!log.pass) await failShot(page, `cls-${tag}`);
  } catch (e) {
    log.error = String(e).slice(0, 200);
    try { await failShot(page, `cls-${tag}`); } catch { /* ignore */ }
  }
  console.log(JSON.stringify(log));
  await context.close();
  return log.pass;
}

// (b) Offline continuity: app is 100% local (mocks + localStorage), so a loaded
// app must keep working after the network drops, WITH a banner. Cold reload
// while offline cannot render without a service worker (browser-level, out of
// scope) — that limitation is documented, not tested here.
async function offlineProbe(browser, origin) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const log = { origin: origin.name, probe: "offline", pass: false };
  try {
    await page.goto(origin.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(600);
    await context.setOffline(true);
    await page.waitForTimeout(500);
    const banner = await page.evaluate(() => {
      const el = document.querySelector("[class*='offlineBanner']");
      if (!el) return { shown: false };
      const r = el.getBoundingClientRect();
      return { shown: r.width > 0 && r.height > 0, text: el.textContent.trim().slice(0, 40) };
    });
    // interact offline: navigate + toggle + search, all local
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
        .find((el) => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
      if (link) link.click();
    });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const sw = document.querySelector('table tbody tr:first-child label[class*="switch"] input[type="checkbox"]:not([disabled])');
      if (sw) sw.click();
    });
    await page.waitForTimeout(500);
    const svc = await page.evaluate(() => ({
      table: !!document.querySelector("table"),
      rows: document.querySelectorAll("table tbody tr").length,
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `offline-banner-${origin.name}-390.png`), fullPage: false });
    // back online -> banner hides
    await context.setOffline(false);
    await page.waitForTimeout(500);
    const bannerGone = await page.evaluate(() => {
      const el = document.querySelector("[class*='offlineBanner']");
      return !el;
    });
    log.banner = banner;
    log.svc = svc;
    log.bannerGone = bannerGone;
    log.pass = banner.shown && svc.table && svc.rows > 0 && svc.sw <= svc.cw && bannerGone;
    if (!log.pass) await failShot(page, `offline-${origin.name}`);
  } catch (e) {
    log.error = String(e).slice(0, 200);
    try { await failShot(page, `offline-${origin.name}`); } catch { /* ignore */ }
  } finally {
    try { await context.setOffline(false); } catch { /* ignore */ }
  }
  console.log(JSON.stringify(log));
  await context.close();
  return log.pass;
}

// (c) Paste unicode vectors into the form (no save -> no store pollution, E2).
// Correct expectations: soft-cap slices to 100 (valid boundary) so the form may
// ADVANCE; assert cap + no crash + no overflow. Save-integrity is proven by a
// separate save-flow run (see evidence notes), not by this light gate probe.
async function pasteProbe(browser, origin) {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  const log = { origin: origin.name, probe: "paste", pass: false };
  try {
    await page.goto(origin.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll("header a, header button, nav a, nav button"))
        .find((el) => el.textContent && el.textContent.includes("Quản lý Dịch vụ"));
      if (link) link.click();
    });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Tạo dịch vụ"));
      if (btn) btn.click();
    });
    try { await page.waitForSelector("input[placeholder*='VD:']", { timeout: 8000 }); }
    catch { throw new Error("form never opened"); }
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const title = document.querySelector("input[placeholder*='VD:']");
      if (title) {
        title.focus();
        document.execCommand("insertText", false, "🎉".repeat(40) + "日本語テスト" + "a".repeat(60));
      }
      const desc = document.querySelector("textarea");
      if (desc) {
        desc.focus();
        document.execCommand("insertText", false, "<div><b><i>lồng</i></b></div>\na\n\n\n\nb " + "mô tả ".repeat(10));
      }
    });
    await page.waitForTimeout(300);
    // Read the cap BEFORE any Next click (145 pasted chars must read back ≤100).
    const check = await page.evaluate(() => {
      const title = document.querySelector("input[placeholder*='VD:']");
      const titleLen = title?.value?.length ?? -1;
      return {
        titleLen,
        titleCapped: titleLen !== -1 && titleLen <= 100,
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      };
    });
    log.check = check;
    log.pass = check.titleCapped && check.sw <= check.cw;
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `paste-${origin.name}-320.png`), fullPage: false });
    if (!log.pass) await failShot(page, `paste-${origin.name}`);
  } catch (e) {
    log.error = String(e).slice(0, 200);
    try { await failShot(page, `paste-${origin.name}`); } catch { /* ignore */ }
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
      results.push(await clsProbe(browser, origin, vp, false));
    }
    results.push(await clsProbe(browser, origin, { w: 390, h: 844 }, true));
    results.push(await offlineProbe(browser, origin));
    results.push(await pasteProbe(browser, origin));
  }
  const pass = results.every(Boolean);
  console.log(JSON.stringify({ stressPass: pass, checks: `${results.filter(Boolean).length}/${results.length}` }));
  if (!pass) process.exitCode = 1;
} finally {
  await browser.close();
}
