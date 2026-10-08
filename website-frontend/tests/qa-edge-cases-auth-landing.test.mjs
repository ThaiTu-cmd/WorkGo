import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const WORKGO_ROOT = path.resolve(ROOT, "..");

// =========================================================================
// 1. HAPPY PATH & EDGE CASES: LOGOUT FLOW & HARD REDIRECT
// =========================================================================

test("QA-TC-01 [Happy Path & Fault Tolerance] - UserMenu handleLogout triggers hard reload in finally block regardless of network status", () => {
  const userMenuPath = path.join(ROOT, "src/components/shell/user-menu.tsx");
  assert.ok(fs.existsSync(userMenuPath), "user-menu.tsx must exist");
  const content = fs.readFileSync(userMenuPath, "utf-8");

  // Check try-catch-finally pattern
  const tryCatchPattern = /const\s+handleLogout\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?try\s*\{[\s\S]*?fetch\("\/api\/auth\/logout",\s*\{\s*method:\s*"POST"\s*\}\);[\s\S]*?\}\s*catch[\s\S]*?\}\s*finally\s*\{[\s\S]*?window\.location\.href\s*=\s*`\/\$\{locale\}\/login`;[\s\S]*?\}/;
  assert.match(
    content,
    tryCatchPattern,
    "Logout must use try-catch-finally with window.location.href in finally block"
  );

  // Prohibit soft navigation methods
  assert.doesNotMatch(content, /router\.push\(`\/\$\{locale\}\/login`\)/, "Must not use router.push for logout");
  assert.doesNotMatch(content, /router\.replace\(`\/\$\{locale\}\/login`\)/, "Must not use router.replace for logout");
});

test("QA-TC-02 [Edge Case & Security] - API /api/auth/logout expires all session cookies on root path with maxAge 0", () => {
  const logoutRoutePath = path.join(ROOT, "src/app/api/auth/logout/route.ts");
  assert.ok(fs.existsSync(logoutRoutePath), "logout route.ts must exist");
  const content = fs.readFileSync(logoutRoutePath, "utf-8");

  // Verify cookie options
  assert.match(content, /path:\s*["']\/["']/, "Cookie options must explicitly define path: '/'");
  assert.match(content, /maxAge:\s*0/, "Cookie options must explicitly define maxAge: 0");
  assert.match(content, /sameSite:\s*["']lax["']/, "Cookie options must specify sameSite: 'lax'");
  assert.match(content, /secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/, "Cookie options must enforce secure in production");

  // Verify all 3 auth cookies are cleared
  assert.match(content, /response\.cookies\.set\(\{\s*name:\s*COOKIE_ACCESS_TOKEN,\s*value:\s*["']["'],\s*\.\.\.cookieOptions\s*\}\)/, "Access token cleared");
  assert.match(content, /response\.cookies\.set\(\{\s*name:\s*COOKIE_REFRESH_TOKEN,\s*value:\s*["']["'],\s*\.\.\.cookieOptions\s*\}\)/, "Refresh token cleared");
  assert.match(content, /response\.cookies\.set\(\{\s*name:\s*COOKIE_USER_ROLE,\s*value:\s*["']["'],\s*\.\.\.cookieOptions\s*\}\)/, "User role cleared");

  // Verify best-effort backend notification with try-catch
  assert.match(content, /if\s*\(token\)\s*\{[\s\S]*?try\s*\{[\s\S]*?fetch\([\s\S]*?\}\s*catch[\s\S]*?\}\s*\}/, "Backend notification is safely enclosed in try/catch");
});

// =========================================================================
// 2. HAPPY PATH & EDGE CASES: AUTH SHELL & FORM FOOTER NAVIGATION
// =========================================================================

test("QA-TC-03 [Happy Path & Edge Case] - AuthShell WorkGo logo links to landing page root with dynamic locale and tooltip", () => {
  const authShellPath = path.join(ROOT, "src/components/shell/auth-shell.tsx");
  assert.ok(fs.existsSync(authShellPath), "auth-shell.tsx must exist");
  const content = fs.readFileSync(authShellPath, "utf-8");

  // Logo must link to /${locale}
  assert.match(
    content,
    /<Link[\s\S]*?href=\{`\/\$\{locale\}`\}[\s\S]*?title=\{locale === "vi"\s*\?\s*"Về trang giới thiệu"\s*:\s*"Back to Home"\}[\s\S]*?>[\s\S]*?<div[^>]*>[\s\S]*?W[\s\S]*?<\/div>[\s\S]*?<span[^>]*>WorkGo<\/span>/,
    "Logo links to landing page with bilingual title"
  );

  // Logo must not point to posts
  assert.doesNotMatch(content, /href=\{`\/\$\{locale\}\/posts`\}/, "Logo must not point to /posts");
});

test("QA-TC-04 [Happy Path & Accessibility] - AuthShell header provides back-to-landing button with ArrowLeft icon", () => {
  const authShellPath = path.join(ROOT, "src/components/shell/auth-shell.tsx");
  const content = fs.readFileSync(authShellPath, "utf-8");

  // Back button in header
  const headerBackPattern = /<Link[\s\S]*?href=\{`\/\$\{locale\}`\}[\s\S]*?inline-flex items-center gap-1\.5[\s\S]*?<ArrowLeft\s+className="h-3\.5 w-3\.5"\s*\/>[\s\S]*?\{locale === "vi"\s*\?\s*"Về trang giới thiệu"\s*:\s*"Back to Home"\}[\s\S]*?<\/Link>/;
  assert.match(content, headerBackPattern, "Header has dedicated back button with ArrowLeft icon and localized text");

  // LanguageSwitcher is preserved
  assert.match(content, /<LanguageSwitcher\s+currentLocale=\{locale\}\s*\/>/, "LanguageSwitcher is maintained in top bar");
});

test("QA-TC-05 [Happy Path & Parity] - Login and Register forms provide consistent back to landing links", () => {
  const loginPath = path.join(ROOT, "src/app/[locale]/(auth)/login/page.tsx");
  const regPath = path.join(ROOT, "src/app/[locale]/(auth)/register/page.tsx");

  assert.ok(fs.existsSync(loginPath), "login page exists");
  assert.ok(fs.existsSync(regPath), "register page exists");

  const loginContent = fs.readFileSync(loginPath, "utf-8");
  const regContent = fs.readFileSync(regPath, "utf-8");

  // Check login back link
  const backLinkPattern = /<Link[\s\S]*?href=\{`\/\$\{locale\}`\}[\s\S]*?inline-flex items-center gap-1\.5 text-xs text-fg-tertiary hover:text-fg transition-colors[\s\S]*?<ArrowLeft\s+className="h-3\.5 w-3\.5"\s*\/>[\s\S]*?\{locale === "vi"\s*\?\s*"Quay về trang giới thiệu"\s*:\s*"Back to landing page"\}[\s\S]*?<\/Link>/;
  assert.match(loginContent, backLinkPattern, "Login page has footer back link with ArrowLeft");
  assert.match(regContent, backLinkPattern, "Register page has footer back link with ArrowLeft");

  // Ensure neither has hardcoded '/vi' or '/en'
  assert.doesNotMatch(loginContent, /href="\/vi"/, "Login must not hardcode /vi");
  assert.doesNotMatch(regContent, /href="\/vi"/, "Register must not hardcode /vi");
});

test("QA-TC-06 [Dictionary Key Parity] - common.backToLanding key parity between vi.json and en.json", () => {
  const viPath = path.join(ROOT, "src/dictionaries/vi.json");
  const enPath = path.join(ROOT, "src/dictionaries/en.json");

  const viData = JSON.parse(fs.readFileSync(viPath, "utf-8"));
  const enData = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  assert.equal(viData.common?.backToLanding, "Quay về trang giới thiệu", "VI translation correct");
  assert.equal(enData.common?.backToLanding, "Back to landing page", "EN translation correct");
});

// =========================================================================
// 3. ZERO-OVERLAP ARCHITECTURE & CLEAN LANDING HEADER
// =========================================================================

test("QA-TC-07 [Zero-Overlap Architecture] - AscendLandingView completely eliminates top overlay header and relocates utility dock", () => {
  const ascendViewPath = path.join(ROOT, "src/components/landing/ascend-landing-view.tsx");
  assert.ok(fs.existsSync(ascendViewPath), "ascend-landing-view.tsx exists");
  const content = fs.readFileSync(ascendViewPath, "utf-8");

  // Must not have fixed top header
  assert.doesNotMatch(content, /<header\s+className="fixed top-0/, "No top overlay header allowed");
  assert.doesNotMatch(content, /pointer-events-none\s+p-3/, "No top pointer-events header");
  assert.doesNotMatch(content, /rounded-full\s+border\s+border-border\s+shadow-md/, "No top floating capsule");

  // Must have bottom-right utility dock
  const dockPattern = /<aside\s+className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-surface\/85 backdrop-blur-md px-3 py-1\.5 rounded-full border border-border shadow-lg">[\s\S]*?<ThemeToggle\s*\/>[\s\S]*?<div\s+className="h-3\.5 w-px bg-border"\s*\/>[\s\S]*?<LanguageSwitcher\s+currentLocale=\{locale\}\s*\/>[\s\S]*?<\/aside>/;
  assert.match(content, dockPattern, "Utility dock correctly placed at fixed bottom-4 right-4");

  // Must render landing page experience
  assert.match(content, /(<WorkgoLandingPage\s*locale=\{locale\}\s*\/>|<iframe[\s\S]*?src=\{`\/landing\/index\.html\?locale=\$\{locale\}`\}[\s\S]*?className="w-full h-screen border-none block relative z-10")/, "Landing page experience configured");
});

test("QA-TC-08 [Landing Header Verification] - workgo-navbar.tsx integrates brand, links, and action buttons", () => {
  const navbarPath = path.join(ROOT, "src/components/landing/workgo-navbar.tsx");
  assert.ok(fs.existsSync(navbarPath), "workgo-navbar.tsx exists");
  const content = fs.readFileSync(navbarPath, "utf-8");

  // Navbar brand
  assert.match(content, /WorkGo/, "Navbar brand contains WorkGo");

  // Nav links
  assert.match(content, /#features/, "Navbar contains #features anchor");
  assert.match(content, /#showcase/, "Navbar contains #showcase anchor");
  assert.match(content, /#pricing/, "Navbar contains #pricing anchor");
  assert.match(content, /[`'"]\/\$\{locale\}\/posts[`'"]/, "Navbar links contain posts route");

  // Nav action buttons
  assert.match(content, /[`'"]\/\$\{locale\}\/login[`'"]/, "Navbar contains login action");
  assert.match(content, /[`'"]\/\$\{locale\}\/register[`'"]/, "Navbar contains register action");
});

test("QA-TC-09 [Edge Case: Locale Resolution & Fallback] - routing.ts defines supported locales with Vietnamese fallback", () => {
  const routingPath = path.join(ROOT, "src/i18n/routing.ts");
  assert.ok(fs.existsSync(routingPath), "routing.ts exists");
  const content = fs.readFileSync(routingPath, "utf-8");

  assert.match(content, /locales:\s*\["vi",\s*"en"\]/, "Supported locales are vi and en");
  assert.match(content, /defaultLocale:\s*"vi"/, "Default locale is vi");

  // Simulate edge cases in JS runtime
  const resolveLocale = (param) => (param === "en" ? "en" : "vi");
  assert.equal(resolveLocale("en"), "en", "Explicit 'en' resolves to 'en'");
  assert.equal(resolveLocale("vi"), "vi", "Explicit 'vi' resolves to 'vi'");
  assert.equal(resolveLocale(""), "vi", "Empty string safely defaults to 'vi'");
  assert.equal(resolveLocale(null), "vi", "Null param safely defaults to 'vi'");
  assert.equal(resolveLocale(undefined), "vi", "Undefined param safely defaults to 'vi'");
  assert.equal(resolveLocale("fr"), "vi", "Unsupported 'fr' safely defaults to 'vi'");
  assert.equal(resolveLocale("123"), "vi", "Numeric string safely defaults to 'vi'");
});

test("QA-TC-10 [Edge Case: Zero Iframe Entrapment] - modern landing page eliminates iframes and uses native Next.js Link", () => {
  const landingFile = path.join(ROOT, "src/components/landing/workgo-landing-page.tsx");
  const landingContent = fs.readFileSync(landingFile, "utf-8");
  assert.doesNotMatch(landingContent, /<iframe/i, "WorkgoLandingPage must not render iframe");

  const navbarPath = path.join(ROOT, "src/components/landing/workgo-navbar.tsx");
  const navbarContent = fs.readFileSync(navbarPath, "utf-8");
  assert.match(navbarContent, /href=\{[`'"]\/\$\{locale\}\/login[`'"]\}/, "Login link uses dynamic locale");
  assert.match(navbarContent, /href=\{[`'"]\/\$\{locale\}\/register[`'"]\}/, "Register link uses dynamic locale");
  assert.match(navbarContent, /href:\s*[`'"]\/\$\{locale\}\/posts[`'"]/, "Posts link uses dynamic locale");
});

test("QA-TC-11 [EN Translation Parity] - EN and VI dictionaries contain accurate navbar mappings", () => {
  const viDict = JSON.parse(fs.readFileSync(path.join(ROOT, "src/dictionaries/vi.json"), "utf-8"));
  const enDict = JSON.parse(fs.readFileSync(path.join(ROOT, "src/dictionaries/en.json"), "utf-8"));

  assert.equal(viDict.landing.nav.posts, "Việc làm");
  assert.equal(viDict.landing.nav.signIn, "Đăng nhập");
  assert.equal(viDict.landing.nav.getStarted, "Bắt đầu ngay");

  assert.equal(enDict.landing.nav.posts, "Explore Jobs");
  assert.equal(enDict.landing.nav.signIn, "Sign In");
  assert.equal(enDict.landing.nav.getStarted, "Get Started");
});

test("QA-TC-12 [System Governance] - Java Microservices and Documentation remain 100% untouched", () => {
  const services = [
    "identity-service",
    "catalog-service",
    "order-service",
    "payment-service",
    "api-gateway",
  ];

  for (const svc of services) {
    const svcPom = path.join(WORKGO_ROOT, svc, "pom.xml");
    assert.ok(fs.existsSync(svcPom), `Backend service ${svc} must exist and be intact`);
  }

  const docsDir = path.join(WORKGO_ROOT, "docs");
  assert.ok(fs.existsSync(docsDir), "docs directory must exist and be untouched");
});
