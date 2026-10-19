import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = "http://localhost:3000/vi";
const EVIDENCE_DIR = path.resolve(".team/evidence/ui-fix");
const NAV_SEL = 'nav[aria-label="Điều hướng bổ sung WorkGo"]';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x800", width: 1024, height: 800 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1536x900", width: 1536, height: 900 },
];

const consoleErrors = [];
const results = {};

// S6 chủ động emulate offline (đúng yêu cầu) → HMR/dev-client của Next sẽ log
// lỗi hạ tầng dev (mất websocket, chunk hmr-client, tài nguyên mạng). Đây không
// phải lỗi app — chỉ lọc đúng 3 nhóm hạ tầng này; mọi lỗi khác vẫn tính.
const DEV_INFRA_NOISE = /ERR_INTERNET_DISCONNECTED|_next\/hmr|hmr-client/;

function newPage(browser, vp) {
  return browser.newPage({ viewport: { width: vp.width, height: vp.height } });
}

function trackErrors(page, vpName) {
  page.on("console", (msg) => {
    if (msg.type() !== "error" || DEV_INFRA_NOISE.test(msg.text())) return;
    consoleErrors.push(`[${vpName}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    if (DEV_INFRA_NOISE.test(err.message)) return;
    consoleErrors.push(`[${vpName}] pageerror: ${err.message}`);
  });
}

async function shoot(page, vp, checkId) {
  try {
    // caret:"initial" — mặc định "hide" của Playwright chèn inline style
    // caret-color:transparent vào input và có thể đua với hydration của Next dev
    // (gây hydration-mismatch giả). Không chạm DOM app trong lúc chờ hydrate.
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${vp.name}-${checkId}.png`), caret: "initial" });
  } catch {
    /* screenshot best-effort */
  }
}

function record(vp, checkId, pass, details) {
  results[vp.name][checkId] = { pass, ...details };
  console.log(`[${vp.name}] ${checkId}: ${pass === false ? "FAIL" : pass === "SKIP" ? "SKIP" : "PASS"} ${JSON.stringify(details)}`);
}

async function load(page) {
  // "load" (không phải domcontentloaded): đảm bảo React đã hydrate + HMR client
  // ổn định trước khi đo / emulate offline (tránh event offline rơi trước listener).
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(800);
}

// S1 — SubNav visible & clickable
async function runS1(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, vp.name);
  let pass = false;
  let details = {};
  try {
    await load(page);
    const m = await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      if (!nav) return { navFound: false };
      const r = nav.getBoundingClientRect();
      const header = document.querySelector("header");
      const hr = header ? header.getBoundingClientRect() : null;
      const x = Math.min(r.left + 40, window.innerWidth - 2);
      const y = r.top + r.height / 2;
      const el = document.elementFromPoint(x, y);
      const hitNav = !!(el && el.closest(sel));
      return {
        navFound: true,
        height: r.height,
        top: r.top,
        headerBottom: hr ? hr.bottom : null,
        hitNav,
        hitTag: el ? `${el.tagName}.${String(el.className).slice(0, 40)}` : null,
        linkCount: nav.querySelectorAll("button").length,
      };
    }, NAV_SEL);
    details = { ...m };
    pass =
      m.navFound &&
      m.height >= 57 &&
      m.height <= 65 &&
      m.hitNav &&
      m.linkCount === 15 &&
      (m.headerBottom === null || Math.abs(m.top - m.headerBottom) <= 2);
    await shoot(page, vp, "S1");
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S1", pass, details);
  return page;
}

// S2 — SubNav fixed under header while scrolled (1440)
async function runS2(page, vp) {
  let pass = false;
  let details = {};
  try {
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
    await page.waitForTimeout(400);
    const m = await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      const header = document.querySelector("header");
      const nr = nav.getBoundingClientRect();
      const hr = header.getBoundingClientRect();
      const banner = document.querySelector("[data-offline-banner]");
      return { navTop: nr.top, headerTop: hr.top, headerBottom: hr.bottom, offline: !!banner, scrollY: window.scrollY };
    }, NAV_SEL);
    details = { ...m };
    pass =
      m.scrollY >= 300 &&
      Math.abs(m.navTop - 76) <= 2 &&
      m.headerTop <= 2 &&
      Math.abs(m.headerBottom - m.navTop) <= 2;
    await shoot(page, vp, "S2");
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S2", pass, details);
}

// S3 — trung pages full width (no 650px shrink)
async function runS3(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, vp.name);
  let pass = false;
  let details = {};
  try {
    await load(page);
    const targets = ["Tìm việc", "Nạp tiền", "Ví"];
    const measurements = [];
    for (const label of targets) {
      const clicked = await page.evaluate(
        ({ sel, label }) => {
          const nav = document.querySelector(sel);
          if (!nav) return false;
          const btn = Array.from(nav.querySelectorAll("button")).find((b) => b.textContent.trim() === label);
          if (!btn) return false;
          btn.click();
          return true;
        },
        { sel: NAV_SEL, label }
      );
      if (!clicked) {
        measurements.push({ label, clicked: false });
        continue;
      }
      try {
        await page.waitForSelector('[class*="offsetScope"]', { timeout: 5000 });
      } catch {
        /* measurement below reports childExists:false explicitly */
      }
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const scope = document.querySelector('[class*="offsetScope"]');
        const child = scope ? scope.firstElementChild : null;
        const cr = child ? child.getBoundingClientRect() : null;
        return {
          vw: window.innerWidth,
          childExists: !!child,
          width: cr ? Math.round(cr.width * 10) / 10 : -1,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      measurements.push({ label, clicked: true, ...m, minWidth: Math.round(Math.min(1320, m.vw) * 0.85 * 10) / 10 });
    }
    details = { measurements };
    pass = measurements.every(
      (m) => m.clicked && m.childExists && m.width >= m.minWidth && m.scrollWidth <= m.vw + 1
    );
    await shoot(page, vp, "S3");
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S3", pass, details);
}

// S4 — header no overflow (vp >= 1024, scrolled)
async function runS4(page, vp) {
  let pass = false;
  let details = {};
  try {
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => {
      const vw = window.innerWidth;
      const header = document.querySelector("header");
      if (!header) return { headerFound: false, vw };
      const els = Array.from(header.querySelectorAll("button, a, form")).filter(
        (e) => e.getBoundingClientRect().width > 0
      );
      const rights = els.map((e) => e.getBoundingClientRect().right);
      const container = header.querySelector('[class*="headerContainer"]');
      const cw = container ? container.getBoundingClientRect().width : null;
      const navLinks = Array.from(header.querySelectorAll('[class*="navLink"]'));
      const heights = navLinks.map((e) => e.getBoundingClientRect().height);
      return {
        headerFound: true,
        vw,
        maxRight: rights.length ? Math.round(Math.max(...rights) * 10) / 10 : 0,
        elementCount: els.length,
        containerWidth: cw === null ? null : Math.round(cw * 10) / 10,
        maxNavLinkHeight: heights.length ? Math.round(Math.max(...heights) * 10) / 10 : 0,
      };
    });
    details = { ...m };
    pass =
      m.headerFound &&
      m.maxRight <= m.vw - 1 &&
      m.containerWidth !== null &&
      m.containerWidth <= Math.min(m.vw, 1320) + 8 &&
      m.maxNavLinkHeight <= 36;
    await shoot(page, vp, "S4");
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S4", pass, details);
}

// S5 — mobile hero SearchBar submit button compact (390, unscrolled)
async function runS5(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, vp.name);
  let pass = false;
  let details = {};
  try {
    await load(page);
    const m = await page.evaluate(() => {
      const container = document.querySelector('[class*="searchBarContainer"]');
      if (!container) return { containerFound: false };
      const btn = container.querySelector('[class*="submitBtn"]');
      if (!btn) return { containerFound: true, btnFound: false };
      const cr = container.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      return {
        containerFound: true,
        btnFound: true,
        containerWidth: Math.round(cr.width * 10) / 10,
        btnWidth: Math.round(br.width * 10) / 10,
        btnHeight: Math.round(br.height * 10) / 10,
      };
    });
    details = { ...m };
    pass = m.containerFound && m.btnFound && m.btnHeight <= 64 && m.btnWidth >= m.containerWidth - 8;
    await shoot(page, vp, "S5");
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S5", pass, details);
}

// S6 — offline banner pushes header + subnav down, restores cleanly
async function runS6(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, vp.name);
  let pass = false;
  let details = {};
  try {
    await load(page);
    const onlineBefore = await page.evaluate(() => navigator.onLine);
    if (!onlineBefore) throw new Error("page not online before offline emulation");
    await page.context().setOffline(true);
    await page.waitForSelector("[data-offline-banner]", { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    const off = await page.evaluate(
      (sel) => {
        const banner = document.querySelector("[data-offline-banner]");
        const header = document.querySelector("header");
        const nav = document.querySelector(sel);
        const br = banner ? banner.getBoundingClientRect() : null;
        const hr = header ? header.getBoundingClientRect() : null;
        const nr = nav ? nav.getBoundingClientRect() : null;
        return {
          hasBanner: !!banner,
          bannerHeight: br ? Math.round(br.height * 10) / 10 : null,
          bannerBottom: br ? br.bottom : null,
          headerTop: hr ? hr.top : null,
          headerBottom: hr ? hr.bottom : null,
          navTop: nr ? nr.top : null,
        };
      },
      NAV_SEL
    );
    await shoot(page, vp, "S6-offline");
    const passOffline =
      off.hasBanner &&
      off.bannerBottom <= off.headerTop + 2 &&
      Math.abs(off.headerTop - Math.round(off.bannerHeight)) <= 2 &&
      Math.abs(off.navTop - off.headerBottom) <= 2;

    await page.context().setOffline(false);
    await page
      .waitForFunction(() => !document.querySelector("[data-offline-banner]"), { timeout: 3000 })
      .catch(() => {});
    await page.waitForTimeout(300);
    const on = await page.evaluate((sel) => {
      const banner = document.querySelector("[data-offline-banner]");
      const header = document.querySelector("header");
      const nav = document.querySelector(sel);
      const hr = header ? header.getBoundingClientRect() : null;
      const nr = nav ? nav.getBoundingClientRect() : null;
      return {
        bannerGone: !banner,
        headerTop: hr ? hr.top : null,
        navTop: nr ? nr.top : null,
      };
    }, NAV_SEL);
    const passRestore = on.bannerGone && on.headerTop <= 2 && Math.abs(on.navTop - 76) <= 2;
    details = { offline: off, restore: on };
    pass = passOffline && passRestore;
    await shoot(page, vp, "S6-online");
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S6", pass, details);
}

// S7 — service-form: header hidden, subnav on top, content clears (1440, best-effort)
async function runS7(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, vp.name);
  let pass = false;
  let skipped = false;
  let details = {};
  try {
    await load(page);
    const navClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("header button")).find(
        (b) => b.textContent.trim() === "Quản lý Dịch vụ"
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!navClicked) {
      skipped = true;
      details = { reason: "header nav 'Quản lý Dịch vụ' not found" };
    } else {
      await page
        .waitForFunction(() => document.querySelector('[class*="offsetScope"]') !== null, { timeout: 5000 })
        .catch(() => {});
      const createClicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent.includes("Tạo dịch vụ mới")
        );
        if (!btn) return false;
        btn.click();
        return true;
      });
      if (!createClicked) {
        skipped = true;
        details = { reason: "'Tạo dịch vụ mới' button not found (SKIP)" };
      } else {
        await page.waitForFunction(() => !document.querySelector("header"), { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);
        const m = await page.evaluate(
          (sel) => {
            const header = document.querySelector("header");
            const nav = document.querySelector(sel);
            const nr = nav ? nav.getBoundingClientRect() : null;
            const scope = document.querySelector('[class*="offsetScope"]');
            const child = scope ? scope.firstElementChild : null;
            const cr = child ? child.getBoundingClientRect() : null;
            return {
              headerExists: !!header,
              navTop: nr ? nr.top : null,
              navBottom: nr ? nr.bottom : null,
              childExists: !!child,
              childTop: cr ? cr.top : null,
            };
          },
          NAV_SEL
        );
        details = { ...m };
        pass = !m.headerExists && m.navTop !== null && m.navTop <= 2 && m.childExists && m.childTop >= m.navBottom - 2;
        await shoot(page, vp, "S7");
      }
    }
  } catch (err) {
    details = { error: String(err && err.message ? err.message : err) };
  }
  record(vp, "S7", skipped ? "SKIP" : pass, details);
}

async function main() {
  console.log("=== UI FIX SWEEP (B1-B5) on", BASE, "===");
  const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });

  for (const vp of VIEWPORTS) {
    results[vp.name] = {};
    const page1 = await runS1(browser, vp);
    if (vp.width === 390) await runS5(browser, vp);
    if (vp.width === 1440) await runS2(page1, vp);
    if (vp.width >= 1024) await runS4(page1, vp);
    await page1.close();
    await runS3(browser, vp);
    if (vp.width === 390 || vp.width === 1440) await runS6(browser, vp);
    if (vp.width === 1440) await runS7(browser, vp);
  }

  await browser.close();

  console.log("\n=== SUMMARY ===");
  let failCount = 0;
  const checks = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
  for (const vp of VIEWPORTS) {
    const row = checks
      .map((c) => {
        const r = results[vp.name][c];
        if (!r) return `${c}:—`;
        if (r.pass === "SKIP") return `${c}:SKIP`;
        return `${c}:${r.pass ? "PASS" : "FAIL"}`;
      })
      .join(" ");
    console.log(`[${vp.name}] ${row}`);
    for (const c of checks) {
      const r = results[vp.name][c];
      if (r && r.pass === false) failCount++;
    }
  }
  console.log(`console errors: ${consoleErrors.length}`);
  if (consoleErrors.length) failCount++;

  const out = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    viewports: results,
    consoleErrors,
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
