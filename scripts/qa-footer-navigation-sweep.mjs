import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { FOOTER_COLUMNS } from "../website-frontend/src/_webapp-mirror/components/common/Footer/footerLinks.js";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = "http://localhost:3000/vi";
const EVIDENCE_DIR = path.resolve(".team/evidence/footer-nav");
const PAGES_DIR = path.resolve(".team/evidence/footer-nav/pages");

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}
if (!fs.existsSync(PAGES_DIR)) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const EXPECTED_H1 = {
  "Tất cả dịch vụ": /Khám phá tất cả dịch vụ/,
  "Lập trình & IT": /Khám phá tất cả dịch vụ|Lập trình & IT/,
  "Thiết kế Đồ họa": /Khám phá tất cả dịch vụ|Thiết kế Đồ họa/,
  "Viết lách & Dịch thuật": /Khám phá tất cả dịch vụ|Viết lách & Dịch thuật/,
  "Cách thức đặt dịch vụ": /Cách thức đặt dịch vụ/,
  "Bảo chứng Ký quỹ (Escrow)": /Bảo chứng Ký quỹ \(Escrow\)/,
  "Đăng tin tuyển dụng": /Đăng việc làm/,
  "Chính sách hoàn tiền": /Chính sách hoàn tiền/,
  "Câu hỏi thường gặp (FAQ)": /Câu hỏi thường gặp \(FAQ\)/,
  "Trở thành Chuyên gia": /Trở thành provider/i,
  "Tiêu chuẩn xác thực": /Tiêu chuẩn xác thực/,
  "Quy định gói dịch vụ": /Quy định gói dịch vụ/,
  "Rút tiền & Thanh toán": /Cài đặt rút tiền/,
  "Cộng đồng Freelancer": /Cộng đồng Freelancer WorkGo/,
  "Giới thiệu nền tảng": /Giới thiệu nền tảng/,
  "Cơ hội nghề nghiệp": /Cơ hội nghề nghiệp/,
  "Điều khoản sử dụng": /Điều khoản sử dụng/,
  "Chính sách bảo mật": /Chính sách bảo mật/,
  "Liên hệ & Trợ giúp 24/7": /Liên hệ & Trợ giúp 24\/7/,
};

const REPRESENTATIVE_LABELS = [
  "Tất cả dịch vụ",
  "Cách thức đặt dịch vụ",
  "Bảo chứng Ký quỹ (Escrow)",
  "Đăng tin tuyển dụng",
  "Câu hỏi thường gặp (FAQ)",
  "Trở thành Chuyên gia",
  "Giới thiệu nền tảng",
  "Liên hệ & Trợ giúp 24/7",
];

const DEV_INFRA_NOISE = /ERR_INTERNET_DISCONNECTED|_next\/hmr|hmr-client|Download the React DevTools/i;

async function runSweep() {
  console.log("=== BẮT ĐẦU FOOTER NAVIGATION SWEEP ===");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const allLinks = FOOTER_COLUMNS.flatMap((col) => col.links || []);
  console.log(`Kiểm tra ${allLinks.length} links chân trang trên ${VIEWPORTS.length} viewports...`);

  const report = {
    timestamp: new Date().toISOString(),
    totalLinks: allLinks.length,
    viewportsTested: VIEWPORTS.map((v) => v.name),
    testedItems: [],
    structuralChecks: [],
    apiLeaks: [],
    consoleErrors: [],
    passCount: 0,
    failCount: 0,
  };

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    page.on("console", (msg) => {
      const txt = msg.text();
      if (msg.type() === "error" && !DEV_INFRA_NOISE.test(txt)) {
        report.consoleErrors.push(`[${vp.name}] ${txt}`);
      }
    });

    page.on("pageerror", (err) => {
      if (!DEV_INFRA_NOISE.test(err.message)) {
        report.consoleErrors.push(`[${vp.name}] pageerror: ${err.message}`);
      }
    });

    page.on("request", (req) => {
      const url = req.url();
      if (/:8888|:808[1-4]|\/api\/v1\//.test(url)) {
        report.apiLeaks.push(`[${vp.name}] Leak API: ${url}`);
      }
    });

    try {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(500);

      // 1. Structural Checks
      const footer = page.locator("footer").first();
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Screenshot footer
      await footer.screenshot({
        path: path.join(EVIDENCE_DIR, `footer-${vp.name}.png`),
      });

      // Count buttons in footer
      const navButtonsCount = await footer.locator("ul button").count();
      const deadAnchorsCount = await footer.locator('a[href="#"]').count();
      const logoIsButton = (await footer.locator('button[aria-label="WorkGo — về trang chủ"]').count()) > 0;

      const structInfo = await page.evaluate(() => {
        const grid = document.querySelector("footer [class*='topGrid']");
        const cols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
        const links = Array.from(document.querySelectorAll("footer [class*='footerLink']"));
        const minHeight = links.reduce((min, el) => Math.min(min, el.getBoundingClientRect().height), 999);
        const localeSpans = Array.from(document.querySelectorAll("footer [class*='localeItemStatic']"));
        const localeTags = localeSpans.map((el) => el.tagName);
        const localeCursors = localeSpans.map((el) => window.getComputedStyle(el).cursor);
        return { cols, minHeight, localeTags, localeCursors };
      });

      const isMobile = vp.width <= 540;
      const isTablet = vp.width === 768;
      const isDesktop = vp.width >= 1280;

      let colsValid = true;
      if (isMobile) colsValid = structInfo.cols === 1;
      else if (isTablet) colsValid = structInfo.cols === 2;
      else if (isDesktop) colsValid = structInfo.cols === 5;

      const buttonHeightValid = isMobile ? structInfo.minHeight >= 43.5 : true;
      const localeValid = structInfo.localeTags.every((t) => t === "SPAN") && structInfo.localeCursors.every((c) => c !== "pointer");

      const structPass = navButtonsCount === 19 && deadAnchorsCount === 0 && logoIsButton && colsValid && buttonHeightValid && localeValid;

      report.structuralChecks.push({
        viewport: vp.name,
        navButtonsCount,
        deadAnchorsCount,
        logoIsButton,
        cols: structInfo.cols,
        colsValid,
        minButtonHeight: structInfo.minHeight,
        buttonHeightValid,
        localeValid,
        pass: structPass,
      });

      if (!structPass) {
        report.failCount++;
        console.error(`Structural check failed on ${vp.name}:`, report.structuralChecks.at(-1));
      } else {
        report.passCount++;
      }

      // 2. Navigation tests
      const linksToRun = vp.width >= 1280
        ? allLinks
        : allLinks.filter((l) => REPRESENTATIVE_LABELS.includes(l.label));

      for (const link of linksToRun) {
        await footer.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);

        const btn = footer.locator(`button:has-text("${link.label}")`).first();
        if (!(await btn.isVisible())) {
          report.failCount++;
          report.testedItems.push({
            viewport: vp.name,
            label: link.label,
            targetPage: link.page,
            pass: false,
            fails: ["Button not visible in footer"],
          });
          continue;
        }

        await btn.click();

        // Sample scrollY immediately (<50ms) to ensure instantaneous scroll
        const immediateScrollY = await page.evaluate(() => window.scrollY);
        const immediateScrollPass = immediateScrollY <= 2;

        // 1. Wait for H1 to match expected regex
        const expectedRegex = EXPECTED_H1[link.label] || new RegExp(link.label);
        const patternStr = expectedRegex.source;
        try {
          await page.waitForFunction(
            (pattern) => {
              const h1 = document.querySelector("h1");
              return h1 && new RegExp(pattern, "i").test(h1.innerText.trim());
            },
            patternStr,
            { timeout: 5000 }
          );
        } catch {
          // timeout, will be captured in fails
        }

        // 2. Wait for scroll to reach top (scrollY <= 2)
        try {
          await page.waitForFunction(() => window.scrollY <= 2, { timeout: 5000 });
        } catch {
          // timeout, will be captured in fails
        }

        // Allow React render loop to settle content
        await page.waitForTimeout(350);

        // 3. Measure
        const scrollY = await page.evaluate(() => window.scrollY);
        const scrollPass = scrollY <= 2;

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth - document.documentElement.clientWidth;
        });
        const overflowPass = overflow <= 1;

        const h1Text = await page.evaluate(() => {
          const h1 = document.querySelector("h1");
          return h1 ? h1.innerText.trim() : "";
        });
        const h1Pass = expectedRegex.test(h1Text);

        const mainLength = await page.evaluate(() => {
          const m = document.querySelector("main") || document.querySelector("[class*='trungPage']");
          return m ? m.innerText.trim().length : 0;
        });
        const lengthPass = mainLength >= 50;

        const fails = [];
        if (!immediateScrollPass) fails.push(`immediateScrollY=${immediateScrollY} > 2`);
        if (!scrollPass) fails.push(`scrollY=${scrollY} > 2`);
        if (!overflowPass) fails.push(`overflow=${overflow}px`);
        if (!h1Pass) fails.push(`H1 "${h1Text}" does not match ${expectedRegex}`);
        if (!lengthPass) fails.push(`Content length ${mainLength} < 50`);

        const itemPass = fails.length === 0;
        if (itemPass) report.passCount++;
        else report.failCount++;

        report.testedItems.push({
          viewport: vp.name,
          label: link.label,
          targetPage: link.page,
          expectedH1: expectedRegex.toString(),
          actualH1: h1Text,
          immediateScrollY,
          scrollY,
          overflow,
          contentLength: mainLength,
          pass: itemPass,
          fails,
        });

        // Screenshot on 1440 and 390 for evidence
        if ((vp.name === "1440" || vp.name === "390") && link.page) {
          const shotName = `${link.page}-${vp.name}.png`;
          const shotPath = path.join(PAGES_DIR, shotName);
          if (!fs.existsSync(shotPath)) {
            await page.screenshot({ path: shotPath, fullPage: false });
          }
        }

        // Return Home
        const homeBtn = footer.locator('button[aria-label="WorkGo — về trang chủ"]').first();
        if (await homeBtn.isVisible()) {
          await homeBtn.click();
          try {
            await page.waitForFunction(() => document.querySelector("main") !== null, { timeout: 5000 });
          } catch {
            await page.waitForTimeout(400);
          }
        } else {
          await page.goto(BASE, { waitUntil: "networkidle" });
        }
      }
    } catch (err) {
      console.error(`Lỗi trên viewport ${vp.name}:`, err);
      report.failCount++;
    } finally {
      await page.close();
    }
  }

  // Standalone NotFoundPage test
  console.log("\n--- Testing NotFoundPage fallback ---");
  const testPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await testPage.goto(BASE, { waitUntil: "networkidle" });
    // Navigate to unknown key via custom event
    await testPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent("workgo-navigate", { detail: { page: "unknown-test-route" } }));
    });
    await testPage.waitForTimeout(400);
    const notFoundH1 = await testPage.evaluate(() => document.querySelector("h1")?.innerText.trim() || "");
    if (!/Không tìm thấy trang/i.test(notFoundH1)) {
      report.failCount++;
      console.error("NotFoundPage fallback failed, h1 was:", notFoundH1);
    }
    // Directly capture NotFoundPage rendering
    await testPage.screenshot({ path: path.join(PAGES_DIR, "not-found-1440.png") });
  } finally {
    await testPage.close();
  }

  await browser.close();

  const reportPath = path.join(EVIDENCE_DIR, "footer-sweep.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\n=== TỔNG KẾT SWEEP ===");
  console.log(`Pass: ${report.passCount}, Fail: ${report.failCount}`);
  console.log(`Console Errors: ${report.consoleErrors.length}`);
  console.log(`API Leaks: ${report.apiLeaks.length}`);
  console.log(`Báo cáo JSON: ${reportPath}`);

  if (report.failCount > 0 || report.consoleErrors.length > 0 || report.apiLeaks.length > 0) {
    process.exit(1);
  }
}

runSweep().catch((err) => {
  console.error("FATAL ERROR IN SWEEP:", err);
  process.exit(1);
});
