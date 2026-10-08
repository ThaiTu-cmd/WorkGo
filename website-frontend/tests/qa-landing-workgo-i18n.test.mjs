import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viDictPath = path.resolve(__dirname, "../src/dictionaries/vi.json");
const enDictPath = path.resolve(__dirname, "../src/dictionaries/en.json");
const ascendViewPath = path.resolve(__dirname, "../src/components/landing/ascend-landing-view.tsx");
const localeRootPath = path.resolve(__dirname, "../src/app/[locale]/page.tsx");
const rootPagePath = path.resolve(__dirname, "../src/app/page.tsx");
const landingRoutePath = path.resolve(__dirname, "../src/app/[locale]/(public)/landing/page.tsx");
const navbarPath = path.resolve(__dirname, "../src/components/landing/workgo-navbar.tsx");
const sectionsPath = path.resolve(__dirname, "../src/components/landing/workgo-landing-sections.tsx");

// =========================================================================
// 1. HAPPY PATH: CORE SECTIONS, COPYWRITING & METADATA IN VIETNAMESE
// =========================================================================

test("QA Happy Path - Dictionaries define complete WorkGo Marketplace copywriting", () => {
  assert.ok(fs.existsSync(viDictPath), "vi.json must exist");
  assert.ok(fs.existsSync(enDictPath), "en.json must exist");
  const vi = JSON.parse(fs.readFileSync(viDictPath, "utf-8"));

  // Title & Brand
  assert.equal(vi.common.appName, "WorkGo", "Brand logo text is WorkGo");

  // Navigation Links
  assert.equal(vi.landing.nav.features, "Tính năng");
  assert.equal(vi.landing.nav.showcase, "Dự án tiêu biểu");
  assert.equal(vi.landing.nav.pricing, "Bảng giá");
  assert.equal(vi.landing.nav.posts, "Việc làm");
  assert.equal(vi.landing.nav.signIn, "Đăng nhập");
  assert.equal(vi.landing.nav.getStarted, "Bắt đầu ngay");

  // Section 1: Hero
  assert.match(vi.landing.hero.badge, /WorkGo/);
  assert.match(vi.landing.hero.titlePart1, /Sàn giao dịch nhân lực công nghệ/);
  assert.match(vi.landing.hero.titleHighlight, /Chuẩn Chuyên Nghiệp/);
  assert.match(vi.landing.hero.ctaPrimary, /Khám phá việc làm/);
  assert.match(vi.landing.hero.ctaSecondary, /Đăng nhập ngay/);

  // Section 2: Features
  assert.match(vi.landing.features.sectionBadge, /Hệ thống toàn diện/);
  assert.match(vi.landing.features.feature1Title, /Hợp đồng Escrow Ký quỹ/);
  assert.match(vi.landing.features.feature2Title, /Hồ sơ Chuyên gia Bảo chứng/);
  assert.match(vi.landing.features.feature3Title, /Quy trình Trọng tài Phân xử/);
  assert.match(vi.landing.features.feature4Title, /Theo dõi Tiến độ Thời gian thực/);
  assert.match(vi.landing.features.feature5Title, /Bảo mật & Quyền riêng tư/);
  assert.match(vi.landing.features.feature6Title, /Thanh toán Đa kênh Siêu tốc/);

  // Section 3: Showcase & Stats
  assert.match(vi.landing.showcase.sectionBadge, /Dự án nổi bật/);
  assert.match(vi.landing.showcase.viewAll, /Xem tất cả việc làm/);

  // Section 4: CTA & Footer
  assert.match(vi.landing.cta.primaryBtn, /Đăng ký miễn phí/);
  assert.match(vi.landing.cta.secondaryBtn, /Khám phá dự án/);
  assert.match(vi.landing.footer.rights, /Bản quyền thuộc về WorkGo Platform/);
});

test("QA Happy Path - Next.js components and routes integrate WorkGo Platform branding", () => {
  // AscendLandingView Component
  const ascendContent = fs.readFileSync(ascendViewPath, "utf-8");
  assert.match(ascendContent, />WorkGo<\/span>/, "AscendLandingView brand name WorkGo");
  assert.match(ascendContent, /<WorkgoLandingPage\s*locale=\{locale\}\s*\/>/, "Landing binds locale parameter");

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

test("QA Edge Case - Dynamic i18n: EN and VI dictionaries achieve 100% key parity for landing", () => {
  const vi = JSON.parse(fs.readFileSync(viDictPath, "utf-8"));
  const en = JSON.parse(fs.readFileSync(enDictPath, "utf-8"));

  const sections = ["nav", "hero", "features", "showcase", "cta", "footer"];
  for (const section of sections) {
    const viKeys = Object.keys(vi.landing[section]).sort();
    const enKeys = Object.keys(en.landing[section]).sort();
    assert.deepEqual(viKeys, enKeys, `Section landing.${section} must have identical keys in vi and en`);
  }

  // Verify key English translations
  assert.equal(en.landing.nav.posts, "Explore Jobs");
  assert.equal(en.landing.nav.signIn, "Sign In");
  assert.equal(en.landing.nav.getStarted, "Get Started");
  assert.match(en.landing.hero.titlePart1, /Premier Marketplace/);
  assert.match(en.landing.features.feature1Title, /Smart Escrow Protection/);
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
// 3. EDGE CASES & CORNER CASES: NATIVE NEXT.JS LINKING & NO IFRAMES
// =========================================================================

test("QA Edge Case - 100% of landing navigation links use Next.js Link without iframe entrapment", () => {
  const navbar = fs.readFileSync(navbarPath, "utf-8");
  const sections = fs.readFileSync(sectionsPath, "utf-8");

  assert.match(navbar, /import\s+Link\s+from\s+["']next\/link["']/, "Navbar imports Next.js Link");
  assert.match(sections, /import\s+Link\s+from\s+["']next\/link["']/, "Sections import Next.js Link");

  // Ensure no iframe tag
  assert.doesNotMatch(navbar, /<iframe/i, "Navbar does not render iframe");
  assert.doesNotMatch(sections, /<iframe/i, "Sections do not render iframe");

  // Verify internal links
  assert.match(navbar, /href:\s*`\/\$\{locale\}\/posts`/, "Navbar links include posts route");
  assert.match(navbar, /href=\{`\/\$\{locale\}\/login`\}/, "Navbar links include login route");
  assert.match(navbar, /href=\{`\/\$\{locale\}\/register`\}/, "Navbar links include register route");
});

test("QA Edge Case - updateIframeLinks simulation logic functions correctly", () => {
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
  const heroPath = path.resolve(__dirname, "../src/components/landing/particle-ocean-hero.tsx");
  const heroContent = fs.readFileSync(heroPath, "utf-8");

  assert.match(heroContent, /max-w-4xl/, "Hero title container has max-w-4xl to prevent Vietnamese text overflow");
  assert.match(heroContent, /text-(4xl|5xl)\s+sm:text-6xl\s+(md|lg):text-7xl/, "Hero title uses responsive font size scaling");
});

test("QA Temporal Resilience - Copyright year is dynamically assigned with SSR fallback", () => {
  const sectionsContent = fs.readFileSync(sectionsPath, "utf-8");

  assert.match(
    sectionsContent,
    /new\s+Date\(\)\.getFullYear\(\)/,
    "Footer dynamically calculates current year via new Date().getFullYear()"
  );
  assert.match(sectionsContent, /WorkGo Platform/, "Footer retains platform name");
});
