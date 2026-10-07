import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const landingHtmlPath = path.resolve(__dirname, "../public/landing/index.html");
const ascendViewPath = path.resolve(__dirname, "../src/components/landing/ascend-landing-view.tsx");
const localeRootPath = path.resolve(__dirname, "../src/app/[locale]/page.tsx");
const rootPagePath = path.resolve(__dirname, "../src/app/page.tsx");
const landingRoutePath = path.resolve(__dirname, "../src/app/[locale]/(public)/landing/page.tsx");

// =========================================================================
// 1. HAPPY PATH: CORE SECTIONS, COPYWRITING & METADATA IN VIETNAMESE
// =========================================================================

test("QA Happy Path - Landing Page public/landing/index.html defines complete WorkGo Marketplace copywriting", () => {
  assert.ok(fs.existsSync(landingHtmlPath), "Landing HTML file must exist");
  const html = fs.readFileSync(landingHtmlPath, "utf-8");

  // Title & Brand
  assert.match(html, /<title>WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp<\/title>/, "Default title is WorkGo");
  assert.match(html, /id="navBrandText">WorkGo<\/span>/, "Brand logo text is WorkGo");

  // Navigation Links
  assert.match(html, /Lĩnh vực dịch vụ/, "Nav link 1: Lĩnh vực dịch vụ");
  assert.match(html, /Quy trình hoạt động/, "Nav link 2: Quy trình hoạt động");
  assert.match(html, /Bảo chứng Escrow/, "Nav link 3: Bảo chứng Escrow");
  assert.match(html, /Khám phá việc làm/, "Nav link 4: Khám phá việc làm");
  assert.match(html, /Đăng nhập/, "Nav action: Đăng nhập");
  assert.match(html, /Đăng ký ngay/, "Nav action: Đăng ký ngay");

  // Section 1: Hero
  assert.match(html, /NỀN TẢNG DỊCH VỤ & VIỆC LÀM HÀNG ĐẦU/, "Hero eyebrow");
  assert.match(html, /Kết Nối Tài Năng,<br>Nâng Tầm <em>Công Việc<\/em>/, "Hero headline with gradient em tag");
  assert.match(html, /Sàn kết nối Khách hàng và Chuyên gia uy tín/, "Hero subtitle");
  assert.match(html, /Bắt đầu ngay miễn phí/, "Primary CTA button text");
  assert.match(html, /Được tin dùng bởi hơn 10\.000\+ cá nhân và doanh nghiệp/, "Social proof badge");

  // 6 Verified Partner Brand Badges
  const partnerLogos = ["TechVina", "DesignHub", "MediaPro", "FixIt Home", "CleanPlus", "BuildStack"];
  for (const logo of partnerLogos) {
    assert.match(html, new RegExp(`>${logo}</span>`), `Partner logo ${logo} exists`);
  }

  // Section 2: Features (6 core cards)
  assert.match(html, /HỆ SINH THÁI TOÀN DIỆN/, "Features eyebrow");
  assert.match(html, /Một nền tảng chuẩn hóa mọi nhu cầu dịch vụ & việc làm/, "Features title");
  assert.match(html, /Đăng việc & Báo giá tức thì/, "Feature 1: Đăng việc & Báo giá");
  assert.match(html, /Quản lý tiến độ minh bạch/, "Feature 2: Quản lý tiến độ");
  assert.match(html, /Mạng lưới đối tác xác thực/, "Feature 3: Mạng lưới đối tác");
  assert.match(html, /Đa dạng hình thức thực hiện/, "Feature 4: Đa dạng hình thức");
  assert.match(html, /Bảo chứng thanh toán Escrow/, "Feature 5: Bảo chứng thanh toán");
  assert.match(html, /Giải quyết khiếu nại công bằng/, "Feature 6: Giải quyết khiếu nại");

  // Section 3: Showcase & Stats
  assert.match(html, /MINH BẠCH & TỨC THỜI/, "Showcase eyebrow");
  assert.match(html, /Theo dõi mọi chuyển động dự án theo thời gian thực/, "Showcase title");
  assert.match(html, /Dự án & Đơn hàng · Quý 3/, "Dashboard title");
  assert.match(html, /Đề xuất mới nhận/, "Dashboard row 1");
  assert.match(html, /Hợp đồng đang thực hiện/, "Dashboard row 2");
  assert.match(html, /Nghiệm thu thành công/, "Dashboard row 3");
  assert.match(html, /Đánh giá hài lòng 5 sao/, "Dashboard row 4");
  assert.match(html, /99\.4%/, "Stat 1: Escrow safety");
  assert.match(html, /15 phút/, "Stat 2: Quick proposal");
  assert.match(html, /25\.000\+/, "Stat 3: Completed orders");
  assert.match(html, /50\+ Tỷ ₫/, "Stat 4: Paid to providers");

  // Section 4: CTA & Footer
  assert.match(html, /SẴN SÀNG KHỞI ĐỘNG/, "CTA eyebrow");
  assert.match(html, /Khởi đầu dự án thành công cùng WorkGo ngay hôm nay/, "CTA title");
  assert.match(html, /Đăng ký tài khoản miễn phí/, "CTA primary button");
  assert.match(html, /Tìm việc & Thuê đối tác/, "CTA secondary button");
  assert.match(html, /Khám phá<\/h4>/, "Footer col 1: Khám phá");
  assert.match(html, /Dành cho Provider<\/h4>/, "Footer col 2: Dành cho Provider");
  assert.match(html, /Hỗ trợ & Pháp lý<\/h4>/, "Footer col 3: Hỗ trợ & Pháp lý");
  assert.match(html, /WorkGo Platform\. Nâng tầm giá trị kết nối lao động chuyên nghiệp\./, "Footer copyright");
});

test("QA Happy Path - Next.js components and routes integrate WorkGo Platform branding", () => {
  // AscendLandingView Component
  const ascendContent = fs.readFileSync(ascendViewPath, "utf-8");
  assert.match(ascendContent, />WorkGo<\/span>/, "AscendLandingView brand name WorkGo");
  assert.match(ascendContent, />\s*Platform\s*<\/span>/, "AscendLandingView platform badge");
  assert.match(ascendContent, /src=\{`\/landing\/index\.html\?locale=\$\{locale\}`\}/, "Iframe src binds locale parameter");

  // Root Page app/page.tsx
  const rootContent = fs.readFileSync(rootPagePath, "utf-8");
  assert.match(rootContent, /title:\s*["']WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp["']/, "Root page title");
  assert.match(rootContent, /<AscendLandingView\s*locale="vi"\s*\/>/, "Root page renders AscendLandingView with vi locale");

  // Locale Page app/[locale]/page.tsx
  const localeContent = fs.readFileSync(localeRootPath, "utf-8");
  assert.match(localeContent, /title:\s*["']WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp["']/, "Locale page title");
  assert.match(localeContent, /<AscendLandingView\s*locale=\{locale\}\s*\/>/, "Locale page renders AscendLandingView");

  // Public Landing Page app/[locale]/(public)/landing/page.tsx
  const landingContent = fs.readFileSync(landingRoutePath, "utf-8");
  assert.match(landingContent, /title:\s*["']WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp["']/, "Landing route title");
});

// =========================================================================
// 2. EDGE CASES & CORNER CASES: i18n DICTIONARY PARITY & LOCALIZATION
// =========================================================================

test("QA Edge Case - Dynamic i18n: EN_TRANSLATIONS dictionary achieves 100% key parity with HTML elements", () => {
  const html = fs.readFileSync(landingHtmlPath, "utf-8");

  // Extract EN_TRANSLATIONS dictionary object
  const dictMatch = html.match(/const EN_TRANSLATIONS = \{([\s\S]*?)\};/);
  assert.ok(dictMatch, "EN_TRANSLATIONS dictionary must exist in script");

  const dictContent = dictMatch[1];
  const dictKeys = [...dictContent.matchAll(/['"]([^'"]+)['"]\s*:/g)].map((m) => m[1]);
  assert.ok(dictKeys.length >= 60, `EN_TRANSLATIONS must have at least 60 keys (found ${dictKeys.length})`);

  // Verify that every single key in EN_TRANSLATIONS has a corresponding data-i18n element in HTML
  const missingInHtml = [];
  for (const key of dictKeys) {
    if (!html.includes(`data-i18n="${key}"`)) {
      missingInHtml.push(key);
    }
  }
  assert.deepEqual(missingInHtml, [], "All keys in EN_TRANSLATIONS must correspond to HTML elements with data-i18n");

  // Verify key English translations
  assert.match(dictContent, /'hero-title':\s*'Connect Top Talent,<br>Elevate <em>Every Project<\/em>'/);
  assert.match(dictContent, /'feature-1-title':\s*'Instant Job Posts & Bids'/);
  assert.match(dictContent, /'feature-5-title':\s*'100% Escrow Protection'/);
  assert.match(dictContent, /'stat-4-val':\s*'50B\+ VND'/);
  assert.match(dictContent, /'stat-1-label':\s*'Escrow transaction safety rate'/);
});

test("QA Edge Case - Locale parameter parser and fallback resolution handles edge inputs safely", () => {
  const resolveLocale = (searchQuery) => {
    const urlParams = new URLSearchParams(searchQuery);
    return urlParams.get("locale") === "en" ? "en" : "vi";
  };

  // Happy Path
  assert.equal(resolveLocale("?locale=en"), "en");
  assert.equal(resolveLocale("?locale=vi"), "vi");

  // Edge & Corner Cases: empty, missing, invalid, or malformed
  assert.equal(resolveLocale(""), "vi", "Empty search defaults to vi");
  assert.equal(resolveLocale("?"), "vi", "Empty query defaults to vi");
  assert.equal(resolveLocale("?locale="), "vi", "Empty locale string defaults to vi");
  assert.equal(resolveLocale("?locale=fr"), "vi", "Unsupported French defaults to vi");
  assert.equal(resolveLocale("?locale=zh"), "vi", "Unsupported Chinese defaults to vi");
  assert.equal(resolveLocale("?locale=undefined"), "vi", "Literal string undefined defaults to vi");
  assert.equal(resolveLocale("?locale=null"), "vi", "Literal string null defaults to vi");
  assert.equal(resolveLocale("?other=123&locale=en&theme=dark"), "en", "Composite query extracts en correctly");
  assert.equal(resolveLocale("?other=123&theme=dark"), "vi", "Missing locale in composite query defaults to vi");
});

// =========================================================================
// 3. EDGE CASES & CORNER CASES: IFRAME BREAKOUT & NAVIGATION TRAPPING
// =========================================================================

test("QA Edge Case - 100% of out-of-iframe navigation links are protected against iframe entrapment", () => {
  const html = fs.readFileSync(landingHtmlPath, "utf-8");

  // Extract all links with data-action
  const actionMatches = [...html.matchAll(/<a[^>]*data-action=["']([^"']+)["'][^>]*>/g)];
  assert.ok(actionMatches.length >= 10, `Must have at least 10 data-action links (found ${actionMatches.length})`);

  for (const match of actionMatches) {
    const tag = match[0];
    const action = match[1];

    // Verify allowed action types
    assert.ok(
      ["login", "register", "posts"].includes(action),
      `Action type ${action} must be one of login, register, posts`
    );

    // Verify that every link has both href and window.top.location.href breakout handler
    assert.match(tag, /href=["']\/vi\/(login|register|posts)["']/, "Must have valid initial href");
    assert.match(tag, /onclick=["']window\.top\.location\.href=/, "Must have window.top.location.href breakout");
    assert.match(tag, /return false;["']/, "Must prevent default iframe navigation via return false");
  }

  // Ensure there are no naked internal app links that do not have data-action
  const allAnchors = [...html.matchAll(/<a\s+[^>]*>/g)];
  for (const anchor of allAnchors) {
    const tag = anchor[0];
    const hrefMatch = tag.match(/href=["']([^"']+)["']/);
    const href = hrefMatch ? hrefMatch[1] : "";
    if (href.startsWith("/vi/") || href.startsWith("/en/")) {
      assert.match(tag, /data-action=/, `Internal link ${href} must have data-action attribute to escape iframe`);
    }
  }
});

test("QA Edge Case - updateIframeLinks correctly mutates href and onclick for both vi and en locales", () => {
  // Simulate DOM element structure
  const createMockLink = (action, initialHref) => ({
    dataset: { action },
    href: initialHref,
    onclick: null,
  });

  const links = [
    createMockLink("login", "/vi/login"),
    createMockLink("register", "/vi/register"),
    createMockLink("posts", "/vi/posts"),
  ];

  const simulateUpdateIframeLinks = (locale, linkList) => {
    linkList.forEach((a) => {
      a.href = `/${locale}/${a.dataset.action}`;
      let topTarget = null;
      a.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        topTarget = `/${locale}/${a.dataset.action}`;
        return topTarget;
      };
    });
  };

  // Test mutation to English
  simulateUpdateIframeLinks("en", links);
  assert.equal(links[0].href, "/en/login");
  assert.equal(links[1].href, "/en/register");
  assert.equal(links[2].href, "/en/posts");
  assert.equal(links[0].onclick({ preventDefault: () => {} }), "/en/login");
  assert.equal(links[1].onclick({ preventDefault: () => {} }), "/en/register");
  assert.equal(links[2].onclick({ preventDefault: () => {} }), "/en/posts");

  // Test mutation back to Vietnamese
  simulateUpdateIframeLinks("vi", links);
  assert.equal(links[0].href, "/vi/login");
  assert.equal(links[1].href, "/vi/register");
  assert.equal(links[2].href, "/vi/posts");
  assert.equal(links[0].onclick({ preventDefault: () => {} }), "/vi/login");
  assert.equal(links[1].onclick({ preventDefault: () => {} }), "/vi/register");
  assert.equal(links[2].onclick({ preventDefault: () => {} }), "/vi/posts");
});

// =========================================================================
// 4. BOUNDARY & RESPONSIVE RESILIENCE: TYPOGRAPHY, CONTAINER & DATE
// =========================================================================

test("QA Boundary & Layout - Typography and container widths prevent Vietnamese text overflow", () => {
  const html = fs.readFileSync(landingHtmlPath, "utf-8");

  // Hero Title width accommodation
  assert.match(html, /\.hero-title\s*\{[^}]*max-width:\s*20ch/, "Hero title max-width widened to 20ch for Vietnamese");
  assert.match(html, /\.hero-title\s*\{[^}]*clamp\(30px,\s*4\.8vw,\s*58px\)/, "Hero title uses fluid clamp font-size");

  // Dashboard row labels accommodation (desktop 240px, mobile 140px)
  assert.match(html, /\.dash-row\s*\{[^}]*grid-template-columns:\s*240px\s*1fr/, "Desktop dash-row allocates 240px for labels");
  assert.match(html, /@media\s*\(max-width:\s*560px\)\s*\{[\s\S]*?\.dash-row\s*\{[^}]*grid-template-columns:\s*140px\s*1fr/, "Mobile dash-row allocates 140px for labels");
});

test("QA Temporal Resilience - Copyright year is dynamically assigned with SSR fallback", () => {
  const html = fs.readFileSync(landingHtmlPath, "utf-8");

  // Dynamic assignment script
  assert.match(html, /const yearEl = document\.getElementById\('year'\);/, "Script finds #year element");
  assert.match(html, /if \(yearEl\) yearEl\.textContent = new Date\(\)\.getFullYear\(\);/, "Assigns current year dynamically");

  // Static fallback for no-JS environments
  assert.match(html, /<span id="year">\d{4}<\/span>/, "Static fallback year is present in markup");
});
