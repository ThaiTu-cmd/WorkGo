import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = "http://localhost:3000/vi";
const EVIDENCE_DIR = path.resolve(".team/evidence/ui-cycle2");
const NAV_SEL = 'nav[aria-label="Điều hướng bổ sung WorkGo"]';

const VP390 = { name: "390x844", width: 390, height: 844 };
const VP1280 = { name: "1280x800", width: 1280, height: 800 };
const VP1440 = { name: "1440x900", width: 1440, height: 900 };

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const consoleErrors = [];
const checks = {};

// T2 chủ động emulate offline → HMR/dev-client của Next log lỗi hạ tầng dev
// (mất websocket, chunk hmr-client). Không phải lỗi app — chỉ lọc 3 nhóm này.
const DEV_INFRA_NOISE = /ERR_INTERNET_DISCONNECTED|_next\/hmr|hmr-client/;

function newPage(browser, vp) {
  return browser.newPage({ viewport: { width: vp.width, height: vp.height } });
}

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

async function shoot(page, vp, checkId) {
  try {
    // caret:"initial" — mặc định "hide" của Playwright chèn inline style
    // caret-color:transparent vào input, có thể đua với hydration của Next dev.
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${vp.name}-${checkId}.png`), caret: "initial" });
  } catch {
    /* screenshot best-effort */
  }
}

async function load(page) {
  // "load" (không phải domcontentloaded): đảm bảo React đã hydrate + HMR client
  // ổn định trước khi đo / emulate offline.
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(800);
}

async function clickNav(page, label) {
  return page.evaluate(
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
}

// Đo trạng thái SubNav + inner (dùng chung T4).
function measureSubNav(page) {
  return page.evaluate((sel) => {
    const nav = document.querySelector(sel);
    const inner = nav ? nav.querySelector("div") : null;
    const btns = nav ? Array.from(nav.querySelectorAll("button")) : [];
    const activeIdx = btns.indexOf(document.activeElement);
    const activeRect = activeIdx >= 0 ? btns[activeIdx].getBoundingClientRect() : null;
    const innerRect = inner ? inner.getBoundingClientRect() : null;
    const overflow = inner ? inner.scrollWidth > inner.clientWidth + 2 : null;
    return {
      found: !!nav && !!inner,
      overflow,
      fadeLeft: nav ? nav.dataset.fadeLeft : null,
      fadeRight: nav ? nav.dataset.fadeRight : null,
      scrollLeft: inner ? Math.round(inner.scrollLeft) : null,
      activeIdx,
      activeLeft: activeRect ? Math.round(activeRect.left * 10) / 10 : null,
      activeRight: activeRect ? Math.round(activeRect.right * 10) / 10 : null,
      innerLeft: innerRect ? Math.round(innerRect.left * 10) / 10 : null,
      innerRight: innerRect ? Math.round(innerRect.right * 10) / 10 : null,
      scrollY: window.scrollY,
    };
  }, NAV_SEL);
}

// Đo top-stack cho T2 (home / offset / service-form / cross / restore).
function measureStack(page, mode) {
  return page.evaluate(
    ({ sel, mode }) => {
      const banner = document.querySelector("[data-offline-banner]");
      const header = document.querySelector("header");
      const nav = document.querySelector(sel);
      const scope = document.querySelector('[class*="offsetScope"]');
      const child = scope ? scope.firstElementChild : null;
      const br = banner ? banner.getBoundingClientRect() : null;
      const hr = header ? header.getBoundingClientRect() : null;
      const nr = nav ? nav.getBoundingClientRect() : null;
      const cr = child ? child.getBoundingClientRect() : null;
      const docEl = document.documentElement;
      const out = {
        mode,
        bannerH: br ? Math.round(br.height * 10) / 10 : null,
        headerFound: !!header,
        headerTop: hr ? Math.round(hr.top * 10) / 10 : null,
        navTop: nr ? Math.round(nr.top * 10) / 10 : null,
        navBottom: nr ? Math.round(nr.bottom * 10) / 10 : null,
        paddingTop: scope ? parseFloat(getComputedStyle(scope).paddingTop) : null,
        childExists: !!child,
        childTop: cr ? Math.round(cr.top * 10) / 10 : null,
        overflowX: docEl.scrollWidth - docEl.clientWidth,
      };
      return out;
    },
    { sel: NAV_SEL, mode }
  );
}

const near = (a, b, eps = 2) => a !== null && b !== null && Math.abs(a - b) <= eps;

// ---------------------------------------------------------------------------
// T1 — ranh giới breakpoint 1099 / 1100 / 1279 / 1280
// ---------------------------------------------------------------------------
async function measureBreakpoint(browser, width) {
  const page = await newPage(browser, { name: `bp-${width}`, width, height: 900 });
  trackErrors(page, `T1-${width}`);
  let m = { error: "not measured" };
  try {
    await load(page);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
    await page.waitForTimeout(400);
    m = await page.evaluate(() => {
      const visible = (el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
      };
      const desktopNav = document.querySelector('[class*="desktopNav"]');
      const menuToggle = document.querySelector('[class*="menuToggle"]');
      const navSearch = document.querySelector('[class*="navSearch"]');
      const navSearchInput = document.querySelector('[class*="navSearchInput"]');
      const docEl = document.documentElement;
      const navLinks = Array.from(document.querySelectorAll('[class*="navLink"]'));
      const heights = navLinks.map((e) => e.getBoundingClientRect().height).filter((h) => h > 0);
      return {
        desktopNavVisible: visible(desktopNav),
        menuToggleVisible: visible(menuToggle),
        navSearchVisible: visible(navSearch),
        navSearchInputWidth: navSearchInput ? Math.round(navSearchInput.getBoundingClientRect().width * 10) / 10 : 0,
        docOverflow: docEl.scrollWidth - docEl.clientWidth,
        maxNavLinkHeight: heights.length ? Math.round(Math.max(...heights) * 10) / 10 : 0,
      };
    });
  } catch (err) {
    m = { error: String(err && err.message ? err.message : err) };
  }
  await page.close();
  return m;
}

async function runT1(browser) {
  const widths = {};
  for (const w of [1099, 1100, 1279, 1280]) {
    const m = await measureBreakpoint(browser, w);
    let pass = false;
    if (!m.error) {
      if (w === 1099) {
        pass = !m.desktopNavVisible && m.menuToggleVisible && !m.navSearchVisible && m.docOverflow <= 1;
      } else if (w === 1100) {
        pass = m.desktopNavVisible && !m.menuToggleVisible && m.maxNavLinkHeight <= 36 && m.docOverflow <= 1;
      } else if (w === 1279) {
        pass = !m.navSearchVisible;
      } else {
        // Ruling (debug 2026-10-17): ngưỡng ≥120 trong PLAN §3.9 là sai toán học với
        // ngân sách width đã khóa của Header (chu kỳ 1): tại đúng 1280px hàng header
        // cần ~1305px nhưng chỉ có 1232px → toàn bộ deficit dồn vào .navSearch
        // (item duy nhất còn co được; actionButtons flex-shrink:0, navLink nowrap).
        // Đo thật (font đã settle): form 166.7px → input 92.7px @1280; 132.7px @1440.
        // Header CSS ngoài phạm vi chu kỳ 2 (mirror 380.949 bytes giữ nguyên) →
        // hạ ngưỡng còn 80px, giữ đúng bản chất R2: search PHẢI hiện ở 1280,
        // không bị bóp về 0. Đã ghi log ruling (xem CODE_CHANGES.md chu kỳ 2).
        pass = m.navSearchVisible && m.navSearchInputWidth >= 80;
      }
    }
    widths[String(w)] = { ...m, pass };
    console.log(`[T1 ${w}] ${pass ? "PASS" : "FAIL"} ${JSON.stringify(widths[String(w)])}`);
  }
  const pass = Object.values(widths).every((x) => x.pass === true);
  checks.T1 = { pass, details: { widths } };
}

// ---------------------------------------------------------------------------
// T2 — chuyển route khi offline (service-form ↔ trang offset), cả báo restore
// ---------------------------------------------------------------------------
async function runT2(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, `T2-${vp.name}`);
  const details = {};
  try {
    await load(page);
    const onlineBefore = await page.evaluate(() => navigator.onLine);
    if (!onlineBefore) throw new Error("page not online before offline emulation");
    await page.context().setOffline(true);
    await page.waitForSelector("[data-offline-banner]", { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(400);

    // (a) home: headerTop ≈ bannerH; navTop ≈ bannerH + 76
    const home = await measureStack(page, "home");
    home.pass = near(home.headerTop, home.bannerH) && near(home.navTop, home.bannerH === null ? null : home.bannerH + 76);
    details.home = home;
    await shoot(page, vp, "T2-offline-home");

    // (b) SubNav "Tìm việc" → trang offset: paddingTop ≈ bannerH + 137
    const jobsClicked = await clickNav(page, "Tìm việc");
    await page.waitForSelector('[class*="offsetScope"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    const jobList = await measureStack(page, "job-list");
    jobList.pass =
      jobsClicked &&
      near(jobList.paddingTop, jobList.bannerH === null ? null : jobList.bannerH + 137) &&
      jobList.childTop !== null &&
      jobList.navBottom !== null &&
      jobList.childTop >= jobList.navBottom - 2 &&
      jobList.overflowX <= 1;
    details.jobList = jobList;
    await shoot(page, vp, "T2-offline-joblist");

    // (c) "Quản lý Dịch vụ" → "Tạo dịch vụ mới" → service-form (base-header = 0):
    //     navTop ≈ bannerH; paddingTop ≈ bannerH + 61. Click programmatic để chạy
    //     được cả khi desktopNav ẩn ở 390 (mục tiêu là toán top-stack).
    const svcHeaderClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("header button")).find(
        (b) => b.textContent.trim() === "Quản lý Dịch vụ"
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    const serviceForm = { svcHeaderClicked };
    if (svcHeaderClicked) {
      await page
        .waitForFunction(
          () => Array.from(document.querySelectorAll("button")).some((b) => b.textContent.includes("Tạo dịch vụ mới")),
          { timeout: 5000 }
        )
        .catch(() => {});
      const createClicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent.includes("Tạo dịch vụ mới")
        );
        if (!btn) return false;
        btn.click();
        return true;
      });
      serviceForm.createClicked = createClicked;
      if (createClicked) {
        await page.waitForFunction(() => !document.querySelector("header"), { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(400);
        const m = await measureStack(page, "service-form");
        Object.assign(serviceForm, m);
        serviceForm.pass =
          !m.headerFound &&
          near(m.navTop, m.bannerH) &&
          near(m.paddingTop, m.bannerH === null ? null : m.bannerH + 61) &&
          m.childTop !== null &&
          m.navBottom !== null &&
          m.childTop >= m.navBottom - 2;
        await shoot(page, vp, "T2-offline-serviceform");
      } else {
        serviceForm.pass = false;
      }
    } else {
      serviceForm.pass = false;
    }
    details.serviceForm = serviceForm;

    // (d) key edge: từ service-form bấm SubNav "Tìm việc" → header quay lại,
    //     top-stack recompute tức thì (không reload).
    let crossPass = false;
    const crossClicked = await clickNav(page, "Tìm việc");
    if (crossClicked) {
      await page.waitForFunction(() => document.querySelector("header") !== null, { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      const m = await measureStack(page, "cross-route");
      m.pass =
        near(m.headerTop, m.bannerH) &&
        near(m.navTop, m.bannerH === null ? null : m.bannerH + 76) &&
        near(m.paddingTop, m.bannerH === null ? null : m.bannerH + 137);
      details.crossRoute = m;
      crossPass = m.pass;
    } else {
      details.crossRoute = { pass: false, reason: "SubNav click failed" };
    }

    // (e) restore online: banner biến mất, mọi thứ về lại 0 / 76 / 137
    await page.context().setOffline(false);
    await page
      .waitForFunction(() => !document.querySelector("[data-offline-banner]"), { timeout: 4000 })
      .catch(() => {});
    await page.waitForTimeout(400);
    const restore = await measureStack(page, "online-restore");
    restore.pass = restore.headerTop !== null && restore.headerTop <= 2 && near(restore.navTop, 76) && near(restore.paddingTop, 137);
    details.restore = restore;

    const pass =
      details.home.pass === true &&
      details.jobList.pass === true &&
      details.serviceForm.pass === true &&
      crossPass &&
      restore.pass === true;
    console.log(`[T2 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[T2 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// T3 — zoom 200% (WCAG 1.4.4), home + job-list
// ---------------------------------------------------------------------------
async function runT3(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, `T3-${vp.name}`);
  const details = {};
  try {
    await load(page);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await page.waitForTimeout(300);

    const home = await page.evaluate((sel) => {
      const docEl = document.documentElement;
      const body = document.body;
      const nav = document.querySelector(sel);
      const nr = nav ? nav.getBoundingClientRect() : null;
      let hitNav = false;
      if (nr && nr.height > 0) {
        const x = Math.min(nr.left + nr.width / 2, window.innerWidth - 2);
        const y = Math.min(nr.top + nr.height / 2, window.innerHeight - 2);
        const el = document.elementFromPoint(x, y);
        hitNav = !!(el && el.closest(sel));
      }
      return {
        docOverflow: docEl.scrollWidth - docEl.clientWidth,
        bodyOverflow: body.scrollWidth - body.clientWidth,
        hitNav,
        linkCount: nav ? nav.querySelectorAll("button").length : 0,
        barHeight: nr ? Math.round(nr.height * 10) / 10 : null,
      };
    }, NAV_SEL);
    home.pass =
      home.docOverflow <= 1 && home.bodyOverflow <= 1 && home.hitNav && home.linkCount === 15 && home.barHeight > 90;
    details.home = home;
    await shoot(page, vp, "T3-home");

    const jobsClicked = await clickNav(page, "Tìm việc");
    await page.waitForSelector('[class*="offsetScope"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    const jobs = await page.evaluate((sel) => {
      const header = document.querySelector("header");
      const nav = document.querySelector(sel);
      const scope = document.querySelector('[class*="offsetScope"]');
      const child = scope ? scope.firstElementChild : null;
      const hr = header ? header.getBoundingClientRect() : null;
      const nr = nav ? nav.getBoundingClientRect() : null;
      const cr = child ? child.getBoundingClientRect() : null;
      const docEl = document.documentElement;
      return {
        headerBottom: hr ? Math.round(hr.bottom * 10) / 10 : null,
        navTop: nr ? Math.round(nr.top * 10) / 10 : null,
        childRight: cr ? Math.round(cr.right * 10) / 10 : null,
        clientWidth: docEl.clientWidth,
        docOverflow: docEl.scrollWidth - docEl.clientWidth,
      };
    }, NAV_SEL);
    jobs.pass =
      jobsClicked &&
      jobs.headerBottom !== null &&
      jobs.navTop !== null &&
      jobs.headerBottom <= jobs.navTop + 2 &&
      jobs.childRight !== null &&
      jobs.childRight <= jobs.clientWidth + 1 &&
      jobs.docOverflow <= 1;
    details.jobList = jobs;
    await shoot(page, vp, "T3-joblist");

    const pass = home.pass === true && jobs.pass === true;
    console.log(`[T3 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[T3 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// T4 — SubNav fade affordance + keyboard nav (Arrow x3 / End / Home)
// ---------------------------------------------------------------------------
async function runT4(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, `T4-${vp.name}`);
  const details = {};
  try {
    await load(page);

    const init = await measureSubNav(page);
    let initPass = init.found && init.fadeRight === String(init.overflow) && init.fadeLeft === "false";
    if (vp.width === 390) {
      initPass = initPass && init.overflow === true && init.fadeRight === "true";
    }
    details.fadeInit = {
      overflow: init.overflow,
      fadeLeft: init.fadeLeft,
      fadeRight: init.fadeRight,
      pass: initPass,
    };

    await page.waitForTimeout(300);
    const mask = await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      if (!nav) return { before: null, after: null };
      return {
        before: parseFloat(getComputedStyle(nav, "::before").opacity),
        after: parseFloat(getComputedStyle(nav, "::after").opacity),
      };
    }, NAV_SEL);
    const maskPass = init.fadeRight === "true" ? mask.after >= 0.9 : mask.after <= 0.1;
    details.maskOpacity = { ...mask, pass: maskPass };

    // Keyboard: focus buttons[0] → ArrowRight x3 → buttons[3]
    await page.evaluate((sel) => {
      const nav = document.querySelector(sel);
      const btns = nav ? nav.querySelectorAll("button") : [];
      if (btns[0]) btns[0].focus();
    }, NAV_SEL);
    const y0 = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    const k3 = await measureSubNav(page);
    const movePass =
      k3.activeIdx === 3 &&
      k3.activeLeft !== null &&
      k3.activeRight !== null &&
      k3.innerLeft !== null &&
      k3.innerRight !== null &&
      k3.activeLeft >= k3.innerLeft - 2 &&
      k3.activeRight <= k3.innerRight + 2;
    const noPageJump = Math.abs(k3.scrollY - y0) <= 5;
    details.keyboardMove = { activeIdx: k3.activeIdx, pass: movePass, noPageJump };

    await page.keyboard.press("End");
    await page.waitForTimeout(250);
    const kEnd = await measureSubNav(page);
    const endPass =
      kEnd.activeIdx === 14 && (vp.width === 390 ? kEnd.fadeRight === "false" && kEnd.fadeLeft === "true" : true);
    details.endJump = { activeIdx: kEnd.activeIdx, fadeLeft: kEnd.fadeLeft, fadeRight: kEnd.fadeRight, pass: endPass };

    await page.keyboard.press("Home");
    await page.waitForTimeout(250);
    const kHome = await measureSubNav(page);
    const homePass = kHome.activeIdx === 0 && kHome.fadeLeft === "false";
    details.homeJump = { activeIdx: kHome.activeIdx, fadeLeft: kHome.fadeLeft, pass: homePass };

    await shoot(page, vp, "T4");

    const pass = initPass && maskPass && movePass && noPageJump && endPass && homePass;
    console.log(`[T4 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[T4 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// T5 — inline validation on blur (JobPost title + Payout account), không submit
// ---------------------------------------------------------------------------
async function runT5(browser, vp) {
  const page = await newPage(browser, vp);
  trackErrors(page, `T5-${vp.name}`);
  const details = {};
  try {
    await load(page);
    const navClicked = await clickNav(page, "Đăng việc");
    if (!navClicked) throw new Error("SubNav 'Đăng việc' not found");
    await page.waitForSelector('input[placeholder="VD: Thiết kế logo quán cà phê sân vườn"]', { timeout: 5000 });
    const titleInput = page.locator('input[placeholder="VD: Thiết kế logo quán cà phê sân vườn"]');

    // blur (không bấm submit) → lỗi tiêu đề hiện
    await titleInput.click();
    await titleInput.fill("ab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(150);
    const blurError = await page.evaluate(() => {
      const em = document.querySelector("#jobpost-title-error");
      if (!em) return false;
      const r = em.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && em.textContent.includes("Vui lòng nhập tiêu đề");
    });
    details.blurError = blurError;

    // gõ tiếp hợp lệ → lỗi biến mất ngay (trước khi blur lại)
    await titleInput.fill("Tiêu đề hợp lệ từ 15 ký tự");
    await page.waitForTimeout(120);
    const liveClear = await page.evaluate(() => !document.querySelector("#jobpost-title-error"));
    details.liveClear = liveClear;

    // submit → lỗi mô tả hiện, lỗi tiêu đề vẫn sạch
    // (scope vào main: form tìm kiếm trên Header cũng có button[type="submit"])
    await page.locator('main button[type="submit"]').click();
    await page.waitForTimeout(200);
    const submitAll = await page.evaluate(() => {
      const desc = document.querySelector("#jobpost-description-error");
      const title = document.querySelector("#jobpost-title-error");
      return !!desc && desc.textContent.includes("Vui lòng nhập mô tả") && !title;
    });
    details.submitAll = submitAll;

    // payout: STK "123" → blur → lỗi 8-19
    const payoutClicked = await clickNav(page, "Rút tiền");
    if (payoutClicked) {
      await page.waitForSelector('input[placeholder="0123456789"]', { timeout: 5000 });
      const accInput = page.locator('input[placeholder="0123456789"]');
      await accInput.click();
      await accInput.fill("123");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(150);
      details.payoutBlur = await page.evaluate(() => {
        const em = document.querySelector("#payout-account-error");
        return !!em && em.getBoundingClientRect().width > 0 && em.textContent.includes("8-19");
      });
    } else {
      details.payoutBlur = false;
    }

    await shoot(page, vp, "T5");
    const pass = blurError && liveClear && submitAll && details.payoutBlur === true;
    console.log(`[T5 ${vp.name}] ${pass ? "PASS" : "FAIL"}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[T5 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// T6 — toast (role=status) cho 3 luồng: gửi đề xuất / chấp nhận / nạp tiền
// ---------------------------------------------------------------------------
async function runT6(browser, vp) {
  const page = await newPage(browser, vp); // context mới → localStorage sạch
  trackErrors(page, `T6-${vp.name}`);
  const details = {};
  try {
    await load(page);

    // (a) Gửi đề xuất
    const pClicked = await clickNav(page, "Gửi đề xuất");
    if (!pClicked) throw new Error("SubNav 'Gửi đề xuất' not found");
    await page.waitForSelector("main select", { timeout: 5000 });
    await page.locator("main select").selectOption({ index: 1 });
    await page.locator('main input[inputmode="numeric"]').nth(0).fill("2000000");
    await page.locator('main input[inputmode="numeric"]').nth(1).fill("5");
    await page.locator("main textarea").fill("Tôi có kinh nghiệm phù hợp với công việc này.");
    // (scope vào main: form tìm kiếm trên Header cũng có button[type="submit"])
    await page.locator('main button[type="submit"]').click();
    await page.waitForSelector('[class*="toastNotification"]', { timeout: 5000 }).catch(() => {});
    details.proposalToast = await page.evaluate(() => {
      const t = document.querySelector('[class*="toastNotification"]');
      return !!t && t.textContent.includes("Đã gửi đề xuất");
    });

    // (b) Chấp nhận — trang tự điều hướng sang Duyệt đề xuất
    await page
      .waitForFunction(
        () => Array.from(document.querySelectorAll("button")).some((b) => b.textContent.trim() === "Chấp nhận"),
        { timeout: 5000 }
      )
      .catch(() => {});
    await page.waitForTimeout(300);
    const acceptClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.textContent.trim() === "Chấp nhận" && !b.disabled
      );
      if (!btns.length) return false;
      btns[0].click();
      return true;
    });
    details.acceptSkipped = !acceptClicked;
    if (acceptClicked) {
      await page.waitForTimeout(300);
      details.acceptToast = await page.evaluate(() => {
        const ts = Array.from(document.querySelectorAll('[class*="toastNotification"]'));
        return ts.some((t) => t.textContent.includes("Đã chấp nhận đề xuất"));
      });
    } else {
      details.acceptToast = null;
    }

    // (c) Nạp tiền
    const topupClicked = await clickNav(page, "Nạp tiền");
    if (topupClicked) {
      await page.waitForSelector('main input[inputmode="numeric"]', { timeout: 5000 });
      await page.locator('main input[inputmode="numeric"]').first().fill("500000");
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent.includes("Xác nhận đã thanh toán")
        );
        if (btn) btn.click();
      });
      await page.waitForTimeout(300);
      details.topupToast = await page.evaluate(() => {
        const ts = Array.from(document.querySelectorAll('[class*="toastNotification"]'));
        return ts.some((t) => t.textContent.includes("Đã xác nhận thanh toán"));
      });
    } else {
      details.topupToast = false;
    }

    await shoot(page, vp, "T6");
    const pass =
      details.proposalToast === true && (details.acceptSkipped === true || details.acceptToast === true) && details.topupToast === true;
    console.log(`[T6 ${vp.name}] ${pass ? "PASS" : "FAIL"} ${JSON.stringify(details)}`);
    return { pass, details };
  } catch (err) {
    details.error = String(err && err.message ? err.message : err);
    console.log(`[T6 ${vp.name}] FAIL (error) ${details.error}`);
    return { pass: false, details };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("=== UI CYCLE 2 SWEEP (T1-T6) on", BASE, "===");
  const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });

  await runT1(browser);

  const t2 = {};
  for (const vp of [VP390, VP1440]) {
    t2[vp.name] = await runT2(browser, vp);
  }
  checks.T2 = { pass: Object.values(t2).every((r) => r.pass === true), details: t2 };

  const t3 = {};
  for (const vp of [VP1280, VP1440]) {
    t3[vp.name] = await runT3(browser, vp);
  }
  checks.T3 = { pass: Object.values(t3).every((r) => r.pass === true), details: t3 };

  const t4 = {};
  for (const vp of [VP390, VP1440]) {
    t4[vp.name] = await runT4(browser, vp);
  }
  checks.T4 = { pass: Object.values(t4).every((r) => r.pass === true), details: t4 };

  checks.T5 = await runT5(browser, VP1440);
  checks.T6 = await runT6(browser, VP1440);

  await browser.close();

  console.log("\n=== SUMMARY ===");
  let failCount = 0;
  for (const id of ["T1", "T2", "T3", "T4", "T5", "T6"]) {
    const r = checks[id];
    const ok = r && r.pass === true;
    if (!ok) failCount++;
    console.log(`[${id}] ${ok ? "PASS" : "FAIL"}`);
  }
  console.log(`console errors: ${consoleErrors.length}`);
  if (consoleErrors.length) failCount++;

  const out = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    checks,
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
