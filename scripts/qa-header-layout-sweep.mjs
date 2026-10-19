import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const EVIDENCE_DIR = path.resolve(".team/evidence/header-layout");
const TARGET_URL = "http://localhost:3000/vi";

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runSweep() {
  console.log("=== STARTING QA HEADER LAYOUT SWEEP ===");

  // 1. Check if localhost:3000 is UP
  try {
    const res = await fetch(TARGET_URL);
    if (!res.ok) {
      console.error(`Target ${TARGET_URL} returned status ${res.status}`);
    }
  } catch (err) {
    console.error(`FATAL: ${TARGET_URL} is not reachable: ${err.message}`);
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });

  const desktopViewports = [
    { width: 1100, height: 900 },
    { width: 1279, height: 900 },
    { width: 1280, height: 900 },
    { width: 1366, height: 900 },
    { width: 1440, height: 900 },
    { width: 1441, height: 900 },
    { width: 1500, height: 900 },
    { width: 1536, height: 900 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 },
  ];

  const mobileViewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ];

  const allResults = {
    timestamp: new Date().toISOString(),
    targetUrl: TARGET_URL,
    overallPass: true,
    failCount: 0,
    consoleErrors: [],
    viewports: [],
  };

  const vpMetrics = {};

  // ==========================================
  // Desktop Viewports
  // ==========================================
  for (const vp of desktopViewports) {
    const vpKey = `${vp.width}x${vp.height}`;
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`[${vpKey} console.error] ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      errors.push(`[${vpKey} pageerror] ${err.message}`);
    });

    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    // Scroll >50px so headerScrolled is active and navSearch is rendered
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForFunction(() => {
      const header = document.querySelector("header");
      return header && header.className.includes("headerScrolled");
    });
    // Wait for layout settle
    await page.waitForTimeout(300);

    const vpFails = [];

    // Measure metrics
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const cw = doc.clientWidth;
      const sw = doc.scrollWidth;

      const header = document.querySelector("header");
      const container = header ? header.querySelector('[class*="headerContainer"]') : null;
      const left = header ? header.querySelector('[class*="leftSection"]') : null;
      const logo = header ? header.querySelector('a[class*="logo"]') : null;
      const search = header ? header.querySelector('form[class*="navSearch"]') : null;
      const nav = header ? header.querySelector('nav[class*="desktopNav"]') : null;
      const actions = header ? header.querySelector('[class*="actionButtons"]') : null;
      const menuTrigger = header ? header.querySelector('button[class*="menuTrigger"]') : null;
      const signInBtn = header ? header.querySelector('button[class*="signInBtn"]') : null;
      const joinBtn = header ? header.querySelector('button[class*="joinBtn"]') : null;

      const getR = (el) => (el ? el.getBoundingClientRect() : null);

      const rContainer = getR(container);
      const rLeft = getR(left);
      const rLogo = getR(logo);
      const rSearch = getR(search);
      const rNav = getR(nav);
      const rActions = getR(actions);
      const rTrigger = getR(menuTrigger);
      const rSignIn = getR(signInBtn);
      const rJoin = getR(joinBtn);

      let gap1 = null;
      let gap2 = null;
      if (nav && left && actions) {
        gap1 = rNav.left - rLeft.right;
        gap2 = rActions.left - rNav.right;
      }

      return {
        cw,
        sw,
        logoX: rLogo ? rLogo.x : null,
        searchW: rSearch ? rSearch.width : null,
        searchRight: rSearch ? rSearch.right : null,
        navW: rNav ? rNav.width : null,
        navLeft: rNav ? rNav.left : null,
        navRight: rNav ? rNav.right : null,
        actionsW: rActions ? rActions.width : null,
        gap1,
        gap2,
        containerRight: rContainer ? rContainer.right : null,
        containerX: rContainer ? rContainer.x : null,
        triggerRight: rTrigger ? rTrigger.right : null,
        triggerX: rTrigger ? rTrigger.x : null,
        signInRight: rSignIn ? rSignIn.right : null,
        joinRight: rJoin ? rJoin.right : null,
        isSearchVisible: !!search && window.getComputedStyle(search).display !== "none",
      };
    });

    vpMetrics[vp.width] = metrics;

    // H1: Horizontal overflow
    if (metrics.sw > metrics.cw) {
      vpFails.push(`H1: horizontal overflow: scrollWidth (${metrics.sw}) > clientWidth (${metrics.cw})`);
    }

    // H2: Gaps equality at 1280, 1440, 1441, 1500, 1920
    const checkGapsVps = [1280, 1440, 1441, 1500, 1920];
    if (checkGapsVps.includes(vp.width)) {
      if (metrics.gap1 === null || metrics.gap2 === null) {
        vpFails.push(`H2: gap1 or gap2 is null`);
      } else {
        if (metrics.gap1 < 8) {
          vpFails.push(`H2: gap1 (${metrics.gap1.toFixed(1)}) < 8px`);
        }
        if (metrics.gap2 < 8) {
          vpFails.push(`H2: gap2 (${metrics.gap2.toFixed(1)}) < 8px`);
        }
        const gapDiff = Math.abs(metrics.gap1 - metrics.gap2);
        if (gapDiff > 4) {
          vpFails.push(`H2: gap difference (${gapDiff.toFixed(1)}) > 4px (gap1=${metrics.gap1.toFixed(1)}, gap2=${metrics.gap2.toFixed(1)})`);
        }
      }
    }

    // H4: Trigger & actions inside container
    if (metrics.triggerRight !== null && metrics.containerRight !== null) {
      if (metrics.triggerRight > metrics.containerRight + 0.5) {
        vpFails.push(`H4: menuTrigger.right (${metrics.triggerRight.toFixed(1)}) > container.right (${metrics.containerRight.toFixed(1)})`);
      }
      if (metrics.containerX !== null && metrics.triggerX !== null && metrics.triggerX < metrics.containerX) {
        vpFails.push(`H4: menuTrigger.x (${metrics.triggerX.toFixed(1)}) < container.x (${metrics.containerX.toFixed(1)})`);
      }
    }
    if (metrics.joinRight !== null && metrics.containerRight !== null) {
      if (metrics.joinRight > metrics.containerRight + 0.5) {
        vpFails.push(`H4: joinBtn.right (${metrics.joinRight.toFixed(1)}) > container.right (${metrics.containerRight.toFixed(1)})`);
      }
    }
    if (metrics.signInRight !== null && metrics.containerRight !== null) {
      if (metrics.signInRight > metrics.containerRight + 0.5) {
        vpFails.push(`H4: signInBtn.right (${metrics.signInRight.toFixed(1)}) > container.right (${metrics.containerRight.toFixed(1)})`);
      }
    }

    // H6: Search does not push/overlap nav, and search.width >= 200 at >= 1280
    if (vp.width >= 1280) {
      if (!metrics.isSearchVisible) {
        vpFails.push(`H6: search should be visible at >=1280px`);
      } else {
        if (metrics.searchW < 200) {
          vpFails.push(`H6: search.width (${metrics.searchW.toFixed(1)}) < 200px`);
        }
        if (metrics.searchRight !== null && metrics.navLeft !== null) {
          if (metrics.searchRight > metrics.navLeft + 0.5) {
            vpFails.push(`H6: search overlaps nav: search.right (${metrics.searchRight.toFixed(1)}) > nav.left (${metrics.navLeft.toFixed(1)})`);
          }
        }
      }
    }

    // H5: Panel anchor
    // Open menu trigger and check panel
    let panelMetrics = null;
    try {
      await page.click('header button[class*="menuTrigger"]');
      await page.waitForFunction(() => {
        const panel = document.querySelector("#workgo-header-menu");
        return panel && window.getComputedStyle(panel).display !== "none";
      });
      await page.waitForTimeout(200);

      panelMetrics = await page.evaluate(() => {
        const panel = document.querySelector("#workgo-header-menu");
        const trigger = document.querySelector('header button[class*="menuTrigger"]');
        const doc = document.documentElement;
        const rPanel = panel ? panel.getBoundingClientRect() : null;
        const rTrigger = trigger ? trigger.getBoundingClientRect() : null;
        return {
          cw: doc.clientWidth,
          panelRight: rPanel ? rPanel.right : null,
          panelLeft: rPanel ? rPanel.left : null,
          triggerRight: rTrigger ? rTrigger.right : null,
        };
      });

      if (panelMetrics.panelRight !== null && panelMetrics.triggerRight !== null) {
        const panelDiff = Math.abs(panelMetrics.panelRight - panelMetrics.triggerRight);
        if (panelDiff > 1.0) {
          vpFails.push(`H5: abs(panel.right - trigger.right) = ${panelDiff.toFixed(2)}px > 1.0px (panel=${panelMetrics.panelRight.toFixed(1)}, trigger=${panelMetrics.triggerRight.toFixed(1)})`);
        }
        if (panelMetrics.panelLeft < 0) {
          vpFails.push(`H5: panel.left (${panelMetrics.panelLeft.toFixed(1)}) < 0`);
        }
        if (panelMetrics.panelRight > panelMetrics.cw + 0.5) {
          vpFails.push(`H5: panel.right (${panelMetrics.panelRight.toFixed(1)}) > clientWidth (${panelMetrics.cw})`);
        }
      } else {
        vpFails.push(`H5: panel or trigger not found on menu open`);
      }

      if (vp.width === 1440) {
        const shotPath = path.join(EVIDENCE_DIR, "1440-menu-open.png");
        await page.screenshot({ path: shotPath });
      }

      // Close menu
      await page.click('header button[class*="menuTrigger"]');
      await page.waitForTimeout(200);
    } catch (e) {
      vpFails.push(`H5 error: ${e.message}`);
    }

    // Save screenshots for 1280, 1440, 1441, 1920
    const shotVps = [1280, 1440, 1441, 1920];
    if (shotVps.includes(vp.width)) {
      const shotPath = path.join(EVIDENCE_DIR, `${vp.width}-default.png`);
      await page.screenshot({ path: shotPath });
    }

    if (errors.length > 0) {
      allResults.consoleErrors.push(...errors);
    }

    const vpPassed = vpFails.length === 0 && errors.length === 0;
    if (!vpPassed) {
      allResults.overallPass = false;
      allResults.failCount += vpFails.length + errors.length;
    }

    console.log(`[Desktop ${vpKey}] pass: ${vpPassed} (fails: ${vpFails.length}, errors: ${errors.length})`);
    if (vpFails.length > 0) {
      console.log(`  -> ${vpFails.join("; ")}`);
    }

    allResults.viewports.push({
      viewport: vpKey,
      metrics: {
        logoX: metrics.logoX,
        searchW: metrics.searchW,
        navW: metrics.navW,
        actionsW: metrics.actionsW,
        gap1: metrics.gap1,
        gap2: metrics.gap2,
        containerRight: metrics.containerRight,
        triggerRight: metrics.triggerRight,
        panelRight: panelMetrics ? panelMetrics.panelRight : null,
      },
      pass: vpPassed,
      fails: vpFails,
    });

    await page.close();
  }

  // ==========================================
  // H3: Check 1440 -> 1441 Jump
  // ==========================================
  console.log("\n--- Checking H3: 1440 -> 1441 Jump ---");
  const m1440 = vpMetrics[1440];
  const m1441 = vpMetrics[1441];
  const h3Fails = [];
  if (m1440 && m1441) {
    const gap1Diff = Math.abs(m1440.gap1 - m1441.gap1);
    const gap2Diff = Math.abs(m1440.gap2 - m1441.gap2);
    const logoXDiff = Math.abs(m1440.logoX - m1441.logoX);

    if (gap1Diff > 2) {
      h3Fails.push(`H3: gap1 difference between 1440 and 1441 is ${gap1Diff.toFixed(2)}px > 2px`);
    }
    if (gap2Diff > 2) {
      h3Fails.push(`H3: gap2 difference between 1440 and 1441 is ${gap2Diff.toFixed(2)}px > 2px`);
    }
    if (logoXDiff > 1) {
      h3Fails.push(`H3: logoX difference between 1440 and 1441 is ${logoXDiff.toFixed(2)}px > 1px (1440=${m1440.logoX.toFixed(1)}, 1441=${m1441.logoX.toFixed(1)})`);
    }
  } else {
    h3Fails.push("H3: Missing metrics for 1440 or 1441");
  }

  if (h3Fails.length > 0) {
    console.log(`H3 FAIL: ${h3Fails.join("; ")}`);
    allResults.overallPass = false;
    allResults.failCount += h3Fails.length;
    allResults.viewports.push({
      viewport: "H3_1440_1441_transition",
      pass: false,
      fails: h3Fails,
    });
  } else {
    console.log("H3 PASS: 1440 -> 1441 smooth transition verified.");
    allResults.viewports.push({
      viewport: "H3_1440_1441_transition",
      pass: true,
      fails: [],
    });
  }

  // ==========================================
  // H7: Auth with long name (1440x900)
  // ==========================================
  console.log("\n--- Checking H7: Auth with long name @ 1440x900 ---");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`[H7 console.error] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      errors.push(`[H7 pageerror] ${err.message}`);
    });

    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    // Set localStorage auth
    await page.evaluate(() => {
      const longNameUser = {
        name: "Nguyễn Thị Phương Thảo Hoàng Long",
        email: "longname@workgo.vn",
      };
      localStorage.setItem("accessToken", "mock-long-name-token-12345");
      localStorage.setItem("workgo_auth_user", JSON.stringify(longNameUser));
      window.dispatchEvent(new Event("workgo-auth-changed"));
    });

    // Reload to apply auth state
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForTimeout(400);

    const h7Fails = [];
    const authMetrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const cw = doc.clientWidth;
      const sw = doc.scrollWidth;

      const header = document.querySelector("header");
      const container = header ? header.querySelector('[class*="headerContainer"]') : null;
      const left = header ? header.querySelector('[class*="leftSection"]') : null;
      const search = header ? header.querySelector('form[class*="navSearch"]') : null;
      const nav = header ? header.querySelector('nav[class*="desktopNav"]') : null;
      const actions = header ? header.querySelector('[class*="actionButtons"]') : null;
      const badge = header ? header.querySelector('[class*="userBadge"]') : null;
      const trigger = header ? header.querySelector('button[class*="menuTrigger"]') : null;

      const getR = (el) => (el ? el.getBoundingClientRect() : null);

      const rContainer = getR(container);
      const rLeft = getR(left);
      const rSearch = getR(search);
      const rNav = getR(nav);
      const rActions = getR(actions);
      const rBadge = getR(badge);
      const rTrigger = getR(trigger);

      let gap1 = null;
      let gap2 = null;
      if (nav && left && actions) {
        gap1 = rNav.left - rLeft.right;
        gap2 = rActions.left - rNav.right;
      }

      return {
        cw,
        sw,
        badgeW: rBadge ? rBadge.width : null,
        searchW: rSearch ? rSearch.width : null,
        containerRight: rContainer ? rContainer.right : null,
        triggerRight: rTrigger ? rTrigger.right : null,
        gap1,
        gap2,
      };
    });

    // H1 pass check
    if (authMetrics.sw > authMetrics.cw) {
      h7Fails.push(`H7 (H1): horizontal overflow: scrollWidth (${authMetrics.sw}) > clientWidth (${authMetrics.cw})`);
    }
    // H4 check
    if (authMetrics.triggerRight !== null && authMetrics.containerRight !== null) {
      if (authMetrics.triggerRight > authMetrics.containerRight + 0.5) {
        h7Fails.push(`H7 (H4): trigger.right (${authMetrics.triggerRight.toFixed(1)}) > container.right (${authMetrics.containerRight.toFixed(1)})`);
      }
    }
    // Badge width <= 120.5
    if (authMetrics.badgeW === null || authMetrics.badgeW > 120.5) {
      h7Fails.push(`H7: badge width (${authMetrics.badgeW ? authMetrics.badgeW.toFixed(1) : "null"}) > 120.5px`);
    }
    // Search width >= 200
    if (authMetrics.searchW === null || authMetrics.searchW < 200) {
      h7Fails.push(`H7: search width (${authMetrics.searchW ? authMetrics.searchW.toFixed(1) : "null"}) < 200px`);
    }

    const shotPath = path.join(EVIDENCE_DIR, "1440-auth-longname.png");
    await page.screenshot({ path: shotPath });

    // Clean up localStorage
    await page.evaluate(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("workgo_auth_user");
      window.dispatchEvent(new Event("workgo-auth-changed"));
    });

    if (errors.length > 0) allResults.consoleErrors.push(...errors);
    const h7Pass = h7Fails.length === 0 && errors.length === 0;
    if (!h7Pass) {
      allResults.overallPass = false;
      allResults.failCount += h7Fails.length + errors.length;
    }
    console.log(`[H7 Auth Long Name] pass: ${h7Pass} (badgeW: ${authMetrics.badgeW?.toFixed(1)}, searchW: ${authMetrics.searchW?.toFixed(1)})`);
    if (h7Fails.length > 0) console.log(`  -> ${h7Fails.join("; ")}`);

    allResults.viewports.push({
      viewport: "1440_auth_long_name",
      metrics: authMetrics,
      pass: h7Pass,
      fails: h7Fails,
    });

    await page.close();
  }

  // ==========================================
  // H8: Mobile Sanity (390x844, 768x1024)
  // ==========================================
  console.log("\n--- Checking H8: Mobile Sanity ---");
  for (const vp of mobileViewports) {
    const vpKey = `${vp.width}x${vp.height}`;
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`[${vpKey} console.error] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      errors.push(`[${vpKey} pageerror] ${err.message}`);
    });

    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("header");
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForTimeout(300);

    const h8Fails = [];
    const mobileMetrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const cw = doc.clientWidth;
      const sw = doc.scrollWidth;

      const header = document.querySelector("header");
      const toggle = header ? header.querySelector('button[class*="menuToggle"]') : null;
      const rToggle = toggle ? toggle.getBoundingClientRect() : null;
      const isToggleVisible = toggle ? window.getComputedStyle(toggle).display !== "none" : false;

      return {
        cw,
        sw,
        isToggleVisible,
        toggleRight: rToggle ? rToggle.right : null,
      };
    });

    // H1 pass check
    if (mobileMetrics.sw > mobileMetrics.cw) {
      h8Fails.push(`H8 (H1): horizontal overflow: scrollWidth (${mobileMetrics.sw}) > clientWidth (${mobileMetrics.cw})`);
    }

    // menuToggle visible and right <= clientWidth
    if (!mobileMetrics.isToggleVisible) {
      h8Fails.push(`H8: menuToggle is not visible`);
    }
    if (mobileMetrics.toggleRight !== null && mobileMetrics.toggleRight > mobileMetrics.cw + 0.5) {
      h8Fails.push(`H8: menuToggle.right (${mobileMetrics.toggleRight.toFixed(1)}) > clientWidth (${mobileMetrics.cw})`);
    }

    // Open mobile drawer
    try {
      await page.click('header button[class*="menuToggle"]');
      await page.waitForFunction(() => {
        const drawer = document.querySelector("#workgo-header-menu");
        return drawer && window.getComputedStyle(drawer).display !== "none";
      });
      await page.waitForTimeout(200);

      const drawerMetrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const drawer = document.querySelector("#workgo-header-menu");
        const rDrawer = drawer ? drawer.getBoundingClientRect() : null;
        const computed = drawer ? window.getComputedStyle(drawer) : null;
        return {
          cw: doc.clientWidth,
          drawerLeft: rDrawer ? rDrawer.left : null,
          drawerRight: rDrawer ? rDrawer.right : null,
          overflowY: computed ? computed.overflowY : null,
        };
      });

      if (drawerMetrics.drawerLeft === null || Math.abs(drawerMetrics.drawerLeft - 0) > 2) {
        h8Fails.push(`H8: drawer.left (${drawerMetrics.drawerLeft?.toFixed(1)}) is not near 0`);
      }
      if (drawerMetrics.drawerRight === null || Math.abs(drawerMetrics.drawerRight - drawerMetrics.cw) > 2) {
        h8Fails.push(`H8: drawer.right (${drawerMetrics.drawerRight?.toFixed(1)}) is not near clientWidth (${drawerMetrics.cw})`);
      }
      if (drawerMetrics.overflowY !== "auto" && drawerMetrics.overflowY !== "scroll") {
        h8Fails.push(`H8: drawer overflow-y is ${drawerMetrics.overflowY}, expected auto or scroll`);
      }

      if (vp.width === 390) {
        const shotPath = path.join(EVIDENCE_DIR, "390-mobile.png");
        await page.screenshot({ path: shotPath });
      }

      // Close mobile drawer
      await page.click('header button[class*="menuToggle"]');
      await page.waitForTimeout(200);
    } catch (e) {
      h8Fails.push(`H8 drawer open error: ${e.message}`);
    }

    if (errors.length > 0) allResults.consoleErrors.push(...errors);
    const h8Pass = h8Fails.length === 0 && errors.length === 0;
    if (!h8Pass) {
      allResults.overallPass = false;
      allResults.failCount += h8Fails.length + errors.length;
    }
    console.log(`[Mobile ${vpKey}] pass: ${h8Pass}`);
    if (h8Fails.length > 0) console.log(`  -> ${h8Fails.join("; ")}`);

    allResults.viewports.push({
      viewport: vpKey,
      metrics: mobileMetrics,
      pass: h8Pass,
      fails: h8Fails,
    });

    await page.close();
  }

  await browser.close();

  // Save sweep-results.json
  const jsonPath = path.join(EVIDENCE_DIR, "sweep-results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2), "utf8");
  console.log(`\nSweep results saved to ${jsonPath}`);
  console.log(`Overall Pass: ${allResults.overallPass}, Total Fails: ${allResults.failCount}, Console Errors: ${allResults.consoleErrors.length}`);

  if (!allResults.overallPass || allResults.failCount > 0 || allResults.consoleErrors.length > 0) {
    console.error("SWEEP FAILED!");
    process.exit(1);
  } else {
    console.log("ALL SWEEP CHECKS PASSED SUCCESSFULLY!");
  }
}

runSweep().catch((err) => {
  console.error("Sweep crashed:", err);
  process.exit(1);
});
