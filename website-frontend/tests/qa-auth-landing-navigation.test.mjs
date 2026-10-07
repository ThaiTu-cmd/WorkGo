import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// =========================================================================
// 1. LOGOUT CLEAN STATE & HARD RELOAD VERIFICATION
// =========================================================================

test("QA Auth Nav - user-menu.tsx executes hard redirect to flush router cache upon logout", () => {
  const userMenuPath = path.join(ROOT, "src/components/shell/user-menu.tsx");
  assert.ok(fs.existsSync(userMenuPath), "user-menu.tsx must exist");
  const content = fs.readFileSync(userMenuPath, "utf-8");

  // Verify handleLogout implementation
  assert.match(
    content,
    /window\.location\.href\s*=\s*`\/\$\{locale\}\/login`/,
    "Must use window.location.href for full page reload and cache flush"
  );
  assert.doesNotMatch(
    content,
    /router\.push\(`\/\$\{locale\}\/login`\);\s*router\.refresh\(\)/,
    "Must not use router.push/refresh soft navigation on logout"
  );
  assert.match(
    content,
    /try\s*\{[\s\S]*fetch\("\/api\/auth\/logout"[\s\S]*\}\s*catch[\s\S]*\}\s*finally\s*\{/,
    "Logout must use try-catch-finally ensuring redirect happens even if network fails"
  );
});

test("QA Auth Nav - logout route.ts strictly expires all auth cookies with path root and maxAge 0", () => {
  const logoutRoutePath = path.join(ROOT, "src/app/api/auth/logout/route.ts");
  assert.ok(fs.existsSync(logoutRoutePath), "logout route.ts must exist");
  const content = fs.readFileSync(logoutRoutePath, "utf-8");

  assert.match(content, /path:\s*["']\/["']/, "Cookie options must specify path '/'");
  assert.match(content, /maxAge:\s*0/, "Cookie options must specify maxAge 0");
  assert.match(content, /response\.cookies\.set\(\{\s*name:\s*COOKIE_ACCESS_TOKEN/, "Access token cookie explicitly cleared");
  assert.match(content, /response\.cookies\.set\(\{\s*name:\s*COOKIE_REFRESH_TOKEN/, "Refresh token cookie explicitly cleared");
  assert.match(content, /response\.cookies\.set\(\{\s*name:\s*COOKIE_USER_ROLE/, "User role cookie explicitly cleared");
});

// =========================================================================
// 2. AUTH SHELL & LOGO NAVIGATION TO LANDING PAGE
// =========================================================================

test("QA Auth Nav - auth-shell.tsx logo links directly to landing page /[locale]", () => {
  const authShellPath = path.join(ROOT, "src/components/shell/auth-shell.tsx");
  assert.ok(fs.existsSync(authShellPath), "auth-shell.tsx must exist");
  const content = fs.readFileSync(authShellPath, "utf-8");

  // Logo Link
  assert.match(
    content,
    /<Link\s+href=\{`\/\$\{locale\}`\}[\s\S]*?>[\s\S]*?WorkGo[\s\S]*?<\/Link>/,
    "WorkGo logo must link to `/${locale}` landing page"
  );
  assert.doesNotMatch(
    content,
    /<Link\s+href=\{`\/\$\{locale\}\/posts`\}[\s\S]*?>[\s\S]*?WorkGo/,
    "WorkGo logo must NOT link to posts page"
  );
});

test("QA Auth Nav - auth-shell.tsx provides explicit back to landing button in top header", () => {
  const authShellPath = path.join(ROOT, "src/components/shell/auth-shell.tsx");
  const content = fs.readFileSync(authShellPath, "utf-8");

  // Header back button
  assert.match(content, /import\s*\{[^}]*ArrowLeft[^}]*\}\s*from\s*["']lucide-react["']/, "Imports ArrowLeft icon");
  assert.match(
    content,
    /<Link\s+href=\{`\/\$\{locale\}`\}[\s\S]*?<ArrowLeft[\s\S]*?locale === "vi"\s*\?\s*"Về trang giới thiệu"/,
    "Header back link points to `/${locale}` with localized label"
  );
  assert.match(content, /<LanguageSwitcher\s*currentLocale=\{locale\}\s*\/>/, "Header preserves LanguageSwitcher");
});

// =========================================================================
// 3. LOGIN & REGISTER FORM FOOTER BACK LINKS
// =========================================================================

test("QA Auth Nav - login page includes back to landing link at form bottom", () => {
  const loginPath = path.join(ROOT, "src/app/[locale]/(auth)/login/page.tsx");
  assert.ok(fs.existsSync(loginPath), "login/page.tsx must exist");
  const content = fs.readFileSync(loginPath, "utf-8");

  assert.match(content, /import\s*\{[^}]*ArrowLeft[^}]*\}\s*from\s*["']lucide-react["']/, "Imports ArrowLeft");
  assert.match(
    content,
    /<Link\s+href=\{`\/\$\{locale\}`\}[\s\S]*?<ArrowLeft[\s\S]*?Quay về trang giới thiệu/,
    "Login form card footer contains back to landing link"
  );
});

test("QA Auth Nav - register page includes back to landing link at form bottom", () => {
  const regPath = path.join(ROOT, "src/app/[locale]/(auth)/register/page.tsx");
  assert.ok(fs.existsSync(regPath), "register/page.tsx must exist");
  const content = fs.readFileSync(regPath, "utf-8");

  assert.match(content, /import\s*\{[^}]*ArrowLeft[^}]*\}\s*from\s*["']lucide-react["']/, "Imports ArrowLeft");
  assert.match(
    content,
    /<Link\s+href=\{`\/\$\{locale\}`\}[\s\S]*?<ArrowLeft[\s\S]*?Quay về trang giới thiệu/,
    "Register form card footer contains back to landing link"
  );
});

// =========================================================================
// 4. DICTIONARY KEY PARITY
// =========================================================================

test("QA Auth Nav - backToLanding key is defined in both vi.json and en.json dictionaries", () => {
  const viPath = path.join(ROOT, "src/dictionaries/vi.json");
  const enPath = path.join(ROOT, "src/dictionaries/en.json");

  const viData = JSON.parse(fs.readFileSync(viPath, "utf-8"));
  const enData = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  assert.ok(viData.common.backToLanding, "vi.json must have common.backToLanding");
  assert.ok(enData.common.backToLanding, "en.json must have common.backToLanding");
  assert.equal(viData.common.backToLanding, "Quay về trang giới thiệu");
  assert.equal(enData.common.backToLanding, "Back to landing page");
});

// =========================================================================
// 5. CLEAN LANDING HEADER (ZERO-OVERLAP ARCHITECTURE)
// =========================================================================

test("QA Clean Header - ascend-landing-view.tsx has zero top header overlay obstructing iframe", () => {
  const landingViewPath = path.join(ROOT, "src/components/landing/ascend-landing-view.tsx");
  const content = fs.readFileSync(landingViewPath, "utf-8");

  // Verify absolute absence of fixed top overlay header
  assert.doesNotMatch(
    content,
    /<header className="fixed top-0/,
    "AscendLandingView must not render any top fixed header overlay"
  );

  // Bottom-right utility dock
  assert.match(
    content,
    /<aside className="fixed bottom-4 right-4 z-40[\s\S]*?<ThemeToggle[\s\S]*?<LanguageSwitcher/,
    "Must position ThemeToggle and LanguageSwitcher in bottom-right utility dock"
  );
});

test("QA Clean Header - public/landing/index.html navbar integrates Việc làm, Đăng nhập, Bắt đầu ngay", () => {
  const indexHtmlPath = path.join(ROOT, "public/landing/index.html");
  assert.ok(fs.existsSync(indexHtmlPath), "index.html must exist");
  const content = fs.readFileSync(indexHtmlPath, "utf-8");

  // Nav Links & Actions
  assert.match(
    content,
    /<a href="\/vi\/posts"\s+data-action="posts"[^>]*data-i18n="nav-link-4">Việc làm<\/a>/,
    "Nav link 4 displays 'Việc làm'"
  );
  assert.match(
    content,
    /<a href="\/vi\/login"\s+data-action="login"[^>]*data-i18n="nav-signin">Đăng nhập<\/a>/,
    "Nav action displays 'Đăng nhập'"
  );
  assert.match(
    content,
    /<a href="\/vi\/register"\s+data-action="register"[^>]*data-i18n="nav-signup"[^>]*>Bắt đầu ngay<\/a>/,
    "Nav action displays 'Bắt đầu ngay'"
  );

  // Iframe breakout onclick safety
  assert.match(content, /window\.top\.location\.href\s*=\s*'\/vi\/posts'/, "Posts link breaks out of iframe");
  assert.match(content, /window\.top\.location\.href\s*=\s*'\/vi\/login'/, "Login link breaks out of iframe");
  assert.match(content, /window\.top\.location\.href\s*=\s*'\/vi\/register'/, "Register link breaks out of iframe");

  // English translations parity
  assert.match(content, /'nav-link-4':\s*'Jobs'/, "English translation for nav-link-4 is 'Jobs'");
  assert.match(content, /'nav-signin':\s*'Sign In'/, "English translation for nav-signin is 'Sign In'");
  assert.match(content, /'nav-signup':\s*'Get Started'/, "English translation for nav-signup is 'Get Started'");
});
