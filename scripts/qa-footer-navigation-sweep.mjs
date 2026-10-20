import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { FOOTER_COLUMNS } from "../web-app/src/components/common/Footer/footerLinks.js";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Tran Huu Trung/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");

const CHROME_PATH = "C:/Users/Tran Huu Trung/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = "http://localhost:3000/vi";
const EVIDENCE_DIR = path.resolve(".team/evidence/footer-pages");
const SCREENSHOT_DIR = path.resolve(".team/evidence/footer-pages/sweep-screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];

const DEV_INFRA_NOISE = /ERR_INTERNET_DISCONNECTED|_next\/hmr|hmr-client/;

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
    apiLeaks: [],
    consoleErrors: [],
    passCount: 0,
    failCount: 0,
  };

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    page.on("console", (msg) => {
      if (msg.type() === "error" && !DEV_INFRA_NOISE.test(msg.text())) {
        report.consoleErrors.push(`[${vp.name}] ${msg.text()}`);
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
      await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      // Chụp ảnh chân trang tại viewport hiện tại
      const footerEl = await page.$("footer");
      if (footerEl) {
        await footerEl.screenshot({
          path: path.join(SCREENSHOT_DIR, `footer-${vp.name}.png`),
          caret: "initial",
        });
      }

      // Duyệt qua từng link
      for (const link of allLinks) {
        // Cuộn xuống footer để bấm link
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);

        // Tìm link có text tương ứng
        const linkSelector = `footer a:has-text("${link.label}")`;
        const linkHandle = await page.$(linkSelector);

        if (!linkHandle) {
          report.failCount++;
          report.testedItems.push({
            viewport: vp.name,
            label: link.label,
            targetPage: link.page,
            status: "FAIL",
            reason: `Không tìm thấy link: ${linkSelector}`,
          });
          continue;
        }

        // Bấm link
        await linkHandle.click();
        await page.waitForTimeout(800);

        // Kiểm tra scrollY <= 2
        const scrollY = await page.evaluate(() => window.scrollY);
        const hasScrollTop = scrollY <= 2;

        // Kiểm tra nội dung trang có render H1
        const h1Text = await page.evaluate(() => {
          const h = document.querySelector("h1");
          return h ? h.innerText.trim() : "";
        });

        const isSuccess = hasScrollTop && h1Text.length > 0;
        if (isSuccess) {
          report.passCount++;
        } else {
          report.failCount++;
        }

        report.testedItems.push({
          viewport: vp.name,
          label: link.label,
          targetPage: link.page,
          scrollY,
          h1Text,
          status: isSuccess ? "PASS" : "FAIL",
        });

        // Quay về home trước link kế tiếp theo PLAN.md §5.2 line 650
        await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(400);
      }
    } catch (err) {
      console.error(`Lỗi chạy trên viewport ${vp.name}:`, err);
      report.failCount++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const reportPath = path.join(EVIDENCE_DIR, "footer-sweep.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`=== HOÀN TẤT FOOTER SWEEP ===`);
  console.log(`Pass: ${report.passCount}, Fail: ${report.failCount}, Console Errors: ${report.consoleErrors.length}, API Leaks: ${report.apiLeaks.length}`);
  console.log(`Báo cáo lưu tại: ${reportPath}`);

  if (report.failCount > 0 || report.apiLeaks.length > 0) {
    process.exit(1);
  }
}

runSweep().catch((err) => {
  console.error("FATAL ERROR IN SWEEP:", err);
  process.exit(1);
});
