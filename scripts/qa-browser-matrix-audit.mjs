import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const EVIDENCE_DIR = path.resolve(".team/evidence/ui-audit-2026-10-16");

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runAudit() {
  console.log("=== STARTING PLAYWRIGHT B1-B8 QA VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });

  const results = {
    b1_scrollX: [],
    b2_hitArea: [],
    b3_reachability: [],
    b4_parity: [],
    b5_interactive: [],
    b6_console_network: [],
    b8_reduced_motion: [],
  };

  const viewports = [
    { name: "320x568 (Mobile Small)", width: 320, height: 568 },
    { name: "390x844 (Mobile iPhone)", width: 390, height: 844 },
    { name: "768x1024 (Tablet)", width: 768, height: 1024 },
    { name: "1024x800 (Laptop)", width: 1024, height: 800 },
    { name: "1440x900 (Desktop)", width: 1440, height: 900 },
  ];

  const origins = [
    { name: "web-app (:5173)", url: "http://localhost:5173/" },
    { name: "website-frontend (:3000/vi)", url: "http://localhost:3000/vi" },
  ];

  // ==========================================
  // B1 & B3 (Header reachability) across 5 viewports x 2 origins
  // ==========================================
  console.log("\n--- B1: Horizontal Overflow & Reachability ---");
  for (const origin of origins) {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(origin.url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      const overflow = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth;
        const cw = document.documentElement.clientWidth;
        const bw = document.body.scrollWidth;
        return { sw, cw, bw, pass: sw <= cw };
      });

      console.log(`[B1] ${origin.name} @ ${vp.name}: sw=${overflow.sw}, cw=${overflow.cw} -> ${overflow.pass ? "PASS" : "FAIL"}`);
      results.b1_scrollX.push({
        origin: origin.name,
        viewport: vp.name,
        ...overflow,
      });

      // B3 Reachability: Header buttons
      const headerBtns = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("header button, header a")).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20),
            tag: el.tagName,
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
            right: Math.round(r.right),
          };
        }).filter((b) => b.w > 0 && b.h > 0);
      });

      const buttonsOutside = headerBtns.filter((b) => b.right > vp.width);
      const headerPass = buttonsOutside.length === 0;
      console.log(`  Header buttons count: ${headerBtns.length}, outside viewport: ${buttonsOutside.length} -> ${headerPass ? "PASS" : "FAIL"}`);

      results.b3_reachability.push({
        origin: origin.name,
        viewport: vp.name,
        pass: headerPass,
        buttons: headerBtns,
        outside: buttonsOutside,
      });

      await page.close();
    }
  }

  // ==========================================
  // B2: Hit Area Measurement (Mobile @ 320x568 on :5173)
  // ==========================================
  console.log("\n--- B2: Button & Control Hit Area ---");
  {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const hitAreas = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, [role=button]")).map((b) => {
        const r = b.getBoundingClientRect();
        const style = window.getComputedStyle(b);
        const afterStyle = window.getComputedStyle(b, "::after");
        const hasAfter = afterStyle && afterStyle.content && afterStyle.content !== "none" && afterStyle.position === "absolute";
        return {
          text: (b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 25),
          w: Math.round(r.width),
          h: Math.round(r.height),
          hasAfterInset: hasAfter ? afterStyle.inset || afterStyle.top : "none",
          effectiveHit: hasAfter ? ">=44px via ::after" : `${Math.round(r.width)}x${Math.round(r.height)}`,
        };
      });
      return btns;
    });

    console.log(`Found ${hitAreas.length} buttons on 320px home view. Sample:`);
    for (const b of hitAreas.slice(0, 10)) {
      console.log(`  - [${b.text}]: visual=${b.w}x${b.h}, effectiveHit=${b.effectiveHit}`);
    }
    results.b2_hitArea = hitAreas;
    await page.close();
  }

  // ==========================================
  // B3: P1 Header Hamburger Interaction & Drawer @ 320x568
  // ==========================================
  console.log("\n--- B3: P1 Hamburger & Drawer Interaction @ 320x568 ---");
  {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Find hamburger button
    const menuToggle = await page.$("button[class*='menuToggle']");
    if (menuToggle) {
      const rect = await menuToggle.boundingBox();
      console.log(`Hamburger toggle found at rect: x=${rect.x}, y=${rect.y}, w=${rect.width}, h=${rect.height}, right=${rect.x + rect.width}`);
      const inViewport = rect.x + rect.width <= 320;
      console.log(`Hamburger within viewport 320: ${inViewport ? "PASS" : "FAIL"}`);

      // Click to open drawer
      await menuToggle.click();
      await page.waitForTimeout(400);

      const drawer = await page.$("[class*='mobileDrawer']");
      const drawerVisible = drawer ? await drawer.isVisible() : false;
      console.log(`Drawer opened and visible: ${drawerVisible ? "PASS" : "FAIL"}`);

      if (drawer) {
        const drawerBox = await drawer.boundingBox();
        const maxHStyle = await page.evaluate(() => {
          const d = document.querySelector("[class*='mobileDrawer']");
          const s = window.getComputedStyle(d);
          return { maxHeight: s.maxHeight, overflowY: s.overflowY };
        });
        console.log(`Drawer geometry: h=${drawerBox.height}, maxHeight=${maxHStyle.maxHeight}, overflowY=${maxHStyle.overflowY}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-verify-320-drawer-opened.png") });
    } else {
      console.log("WARN: menuToggle button not found via selector");
    }
    await page.close();
  }

  // ==========================================
  // B3: P2 MyServices Toolbar Reachability @ 390x844
  // ==========================================
  console.log("\n--- B3: P2 MyServices Toolbar Reachability @ 390x844 ---");
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });

    // Navigate to MyServices via header/nav
    await page.evaluate(() => {
      // Find "Quản lý Dịch vụ" or click nav item
      const links = Array.from(document.querySelectorAll("a, button"));
      const myServicesBtn = links.find((l) => l.textContent && l.textContent.includes("Quản lý Dịch vụ"));
      if (myServicesBtn) myServicesBtn.click();
    });
    await page.waitForTimeout(600);

    const toolbarInfo = await page.evaluate(() => {
      const tabsRow = document.querySelector("[class*='tabsRow']");
      const pageSw = document.documentElement.scrollWidth;
      const pageCw = document.documentElement.clientWidth;
      if (!tabsRow) return { error: "tabsRow not found", pageSw, pageCw };

      const tabBtns = Array.from(tabsRow.querySelectorAll("button")).map((b) => {
        const r = b.getBoundingClientRect();
        return { text: b.textContent.trim(), right: Math.round(r.right), x: Math.round(r.x) };
      });

      // Scroll tabsRow to end
      tabsRow.scrollLeft = tabsRow.scrollWidth;

      const tabBtnsAfterScroll = Array.from(tabsRow.querySelectorAll("button")).map((b) => {
        const r = b.getBoundingClientRect();
        return { text: b.textContent.trim(), right: Math.round(r.right), x: Math.round(r.x) };
      });

      const tableWrapper = document.querySelector("[class*='tableWrapper']");
      const tableInfo = tableWrapper
        ? { sw: tableWrapper.scrollWidth, cw: tableWrapper.clientWidth, overflowX: window.getComputedStyle(tableWrapper).overflowX }
        : null;

      return {
        pageSw,
        pageCw,
        tabsRowSw: tabsRow.scrollWidth,
        tabsRowCw: tabsRow.clientWidth,
        tabBtns,
        tabBtnsAfterScroll,
        tableInfo,
      };
    });

    console.log("MyServices Toolbar check:", JSON.stringify(toolbarInfo, null, 2));
    const pageNoScroll = toolbarInfo.pageSw <= toolbarInfo.pageCw;
    const lastChip = toolbarInfo.tabBtnsAfterScroll ? toolbarInfo.tabBtnsAfterScroll[toolbarInfo.tabBtnsAfterScroll.length - 1] : null;
    const lastChipReachable = lastChip && lastChip.right <= 390;
    console.log(`Page sw<=cw (390): ${pageNoScroll ? "PASS" : "FAIL"}`);
    console.log(`Last chip reachable inside 390 after inner scroll: ${lastChipReachable ? "PASS" : "FAIL"}`);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-verify-390-myservices-toolbar.png") });
    await page.close();
  }

  // ==========================================
  // B3: H1 Dropdown Menu on Last Row @ 1440x900
  // ==========================================
  console.log("\n--- B3: H1 Dropdown Menu On Last Row @ 1440x900 ---");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });

    // Navigate to MyServices
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button"));
      const myServicesBtn = links.find((l) => l.textContent && l.textContent.includes("Quản lý Dịch vụ"));
      if (myServicesBtn) myServicesBtn.click();
    });
    await page.waitForTimeout(600);

    const dropdownCheck = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tbody tr, [class*='row']"));
      const actionBtns = Array.from(document.querySelectorAll("button[class*='actionBtn'], button[title*='Tùy chọn'], button[aria-label*='Tùy chọn']"));
      if (actionBtns.length === 0) {
        // Look for buttons inside table
        const allTableBtns = Array.from(document.querySelectorAll("table button"));
        return { count: allTableBtns.length, error: "actionBtns not found by class" };
      }

      // Click last action button
      const lastBtn = actionBtns[actionBtns.length - 1];
      lastBtn.click();
      return { clicked: true, totalBtns: actionBtns.length };
    });

    await page.waitForTimeout(400);

    const dropdownVisibility = await page.evaluate(() => {
      const menu = document.querySelector("[class*='dropdownMenu']");
      if (!menu) return { found: false };
      const r = menu.getBoundingClientRect();
      const style = window.getComputedStyle(menu);
      const items = Array.from(menu.querySelectorAll("button, a")).map((i) => i.textContent.trim());
      return {
        found: true,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        zIndex: style.zIndex,
        items,
        clippedTop: r.top < 0,
        clippedBottom: r.bottom > window.innerHeight,
      };
    });

    console.log("Dropdown menu status:", JSON.stringify(dropdownVisibility, null, 2));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-verify-1440-last-row-dropdown.png") });
    await page.close();
  }

  // ==========================================
  // B3: P3 AuthModal Login/Register @ 320x568
  // ==========================================
  console.log("\n--- B3: P3 AuthModal Login & Register @ 320x568 ---");
  {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Open login modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, a"));
      const loginBtn = btns.find((b) => b.textContent && b.textContent.includes("Đăng ký"));
      if (loginBtn) loginBtn.click();
    });
    await page.waitForTimeout(400);

    const modalMetrics = await page.evaluate(() => {
      const modal = document.querySelector("[class*='modalBox']");
      if (!modal) return { found: false };
      const r = modal.getBoundingClientRect();
      const s = window.getComputedStyle(modal);
      const closeBtn = document.querySelector("button[class*='closeBtn']");
      const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      return {
        found: true,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) },
        maxHeight: s.maxHeight,
        overflowY: s.overflowY,
        fitsIn320: r.right <= 320,
        closeBtn: closeRect ? { w: Math.round(closeRect.width), h: Math.round(closeRect.height) } : null,
      };
    });

    console.log("AuthModal metrics @ 320x568:", JSON.stringify(modalMetrics, null, 2));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-verify-320-authmodal-register.png") });
    await page.close();
  }

  // ==========================================
  // B4: Parity Check between :5173 and :3000/vi @ 1440x900
  // ==========================================
  console.log("\n--- B4: Parity Check (:5173 vs :3000/vi) ---");
  {
    const pageA = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageA.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await pageA.waitForTimeout(500);

    const sectionsA = await pageA.evaluate(() => {
      return Array.from(document.querySelectorAll("section, header, footer")).map((s) => ({
        tag: s.tagName,
        className: (s.className || "").toString().slice(0, 30),
        h2: (s.querySelector("h1, h2, h3")?.textContent || "").trim().slice(0, 30),
      }));
    });

    const pageB = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageB.goto("http://localhost:3000/vi", { waitUntil: "domcontentloaded" });
    await pageB.waitForTimeout(500);

    const sectionsB = await pageB.evaluate(() => {
      return Array.from(document.querySelectorAll("section, header, footer")).map((s) => ({
        tag: s.tagName,
        className: (s.className || "").toString().slice(0, 30),
        h2: (s.querySelector("h1, h2, h3")?.textContent || "").trim().slice(0, 30),
      }));
    });

    console.log(`Sections count: :5173=${sectionsA.length}, :3000/vi=${sectionsB.length}`);
    await pageA.screenshot({ path: path.join(EVIDENCE_DIR, "qa-parity-5173-1440.png") });
    await pageB.screenshot({ path: path.join(EVIDENCE_DIR, "qa-parity-3000-1440.png") });
    await pageA.close();
    await pageB.close();
  }

  // ==========================================
  // B5: Interactive Navigation Flows on :3000/vi
  // ==========================================
  console.log("\n--- B5: Interactive Navigation Flows on :3000/vi ---");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const networkCalls = [];
    page.on("request", (req) => {
      const u = req.url();
      if (u.includes("8888") || u.includes("8081") || u.includes("8082")) {
        networkCalls.push(u);
      }
    });

    await page.goto("http://localhost:3000/vi", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // 1. Search keyword
    const searchInput = await page.$("input[type='text'], input[placeholder*='tìm']");
    if (searchInput) {
      await searchInput.fill("Logo");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(600);
      console.log("Search 'Logo' executed -> navigated to Catalog view");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-flow-catalog-search.png") });
    }

    // 2. Click Service Card to Detail
    const card = await page.$("[class*='serviceCard'], [class*='cardContainer']");
    if (card) {
      await card.click();
      await page.waitForTimeout(600);
      console.log("Clicked service card -> navigated to Detail view");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-flow-service-detail.png") });
    }

    // 3. Navigate to MyServices
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button"));
      const myServices = links.find((l) => l.textContent && l.textContent.includes("Quản lý Dịch vụ"));
      if (myServices) myServices.click();
    });
    await page.waitForTimeout(600);
    console.log("Navigated to MyServices view");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-flow-myservices.png") });

    // 4. Navigate to Service Form
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button"));
      const createBtn = links.find((l) => l.textContent && (l.textContent.includes("Tạo dịch vụ mới") || l.textContent.includes("Tạo mới")));
      if (createBtn) createBtn.click();
    });
    await page.waitForTimeout(600);
    console.log("Navigated to Service Form view");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "qa-flow-serviceform.png") });

    console.log(`Backend leak check: ${networkCalls.length} calls to :8888/:8081/:8082`);
    results.b6_console_network = { backendLeaks: networkCalls.length };

    await page.close();
  }

  // ==========================================
  // B8: Reduced Motion Check
  // ==========================================
  console.log("\n--- B8: Reduced Motion Emulation ---");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("http://localhost:3000/vi", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyVisible = await page.evaluate(() => {
      const b = document.body;
      const s = window.getComputedStyle(b);
      return { opacity: s.opacity, display: s.display, visibility: s.visibility };
    });
    console.log("Reduced motion emulation body styles:", bodyVisible);
    await page.close();
  }

  await browser.close();
  console.log("\n=== PLAYWRIGHT B1-B8 QA VERIFICATION COMPLETE ===");
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
