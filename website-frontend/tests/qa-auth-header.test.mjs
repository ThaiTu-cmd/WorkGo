import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const SRC = path.join(REPO, "web-app", "src");
const MIRROR = path.join(REPO, "website-frontend", "src", "_webapp-mirror");
const WEBSITE = path.join(REPO, "website-frontend", "src");
const TRUNG = path.join(WEBSITE, "components", "trung-pages");

const read = (p) => fs.readFileSync(p, "utf-8");
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

const HEADER = "components/common/Header/Header.jsx";
const HEADER_CSS = "components/common/Header/Header.module.css";
const AUTH_MODAL = "components/common/AuthModal/AuthModal.jsx";

const STORE = path.join(TRUNG, "_stores", "auth.ts");
const SHELL = path.join(WEBSITE, "components", "webapp-bridge", "webapp-shell.tsx");
const LOGIN = path.join(TRUNG, "auth", "LoginPage.tsx");
const REGISTER = path.join(TRUNG, "auth", "RegisterPage.tsx");
const SUBNAV = path.join(TRUNG, "_ui", "TrungSubNav.tsx");

// ---------------------------------------------------------------------------
// AH-01 — one mock auth flow: the header modal must not hit the real API
// ---------------------------------------------------------------------------
test("AH-01: AuthModal (src + mirror) is mock-only — no /identity/auth/token call", () => {
  for (const base of [SRC, MIRROR]) {
    const jsx = read(path.join(base, AUTH_MODAL));
    assert.ok(
      !jsx.includes("identity/auth/token"),
      `AuthModal under ${path.relative(REPO, base)} still calls the live auth endpoint`
    );
    assert.ok(!jsx.includes("axiosClient"), "AuthModal must not import axiosClient (mock flow)");
    assert.ok(jsx.includes("accessToken"), "AuthModal must persist the auth token");
    assert.ok(
      jsx.includes("workgo_auth_user"),
      "AuthModal must persist the auth user so the header can greet them"
    );
  }
});

test("AH-01b: AuthModal / Header JSX + Header CSS are byte-identical in _webapp-mirror", () => {
  for (const rel of [AUTH_MODAL, HEADER, HEADER_CSS]) {
    assert.equal(
      sha256(path.join(MIRROR, rel)),
      sha256(path.join(SRC, rel)),
      `mirror mismatch: ${rel}`
    );
  }
});

// ---------------------------------------------------------------------------
// AH-02 — a single auth store is the one source of truth
// ---------------------------------------------------------------------------
test("AH-02: auth store exposes the shared contract and all three entries use it", () => {
  const store = read(STORE);
  for (const symbol of [
    "AUTH_EVENT",
    "saveAuth",
    "clearAuth",
    "readAuthUser",
    "readAuthToken",
    "subscribeAuth",
  ]) {
    assert.match(store, new RegExp(`export (function|const) ${symbol}`), `auth.ts missing ${symbol}`);
  }
  assert.match(store, /KEYS\.authToken/, "auth.ts must reuse KEYS.authToken (pinned storage key)");
  assert.match(store, /workgo_auth_user/, "auth.ts must persist the auth user under workgo_auth_user");
  assert.ok(!store.includes("_webapp-mirror"), "auth.ts must not import the mirror");

  for (const [name, file] of [
    ["LoginPage", LOGIN],
    ["RegisterPage", REGISTER],
  ]) {
    const code = read(file);
    assert.match(code, /from "\.\.\/_stores\/auth"/, `${name} must import the shared auth store`);
    assert.match(code, /saveAuth\(/, `${name} must call saveAuth`);
  }
  assert.match(read(SHELL), /from "\.\.\/trung-pages\/_stores\/auth"/, "shell must import the auth store");
});

test("AH-02b: every entry writes/dispatches the same workgo-auth-changed event", () => {
  assert.match(read(STORE), /"workgo-auth-changed"/);
  // AuthModal writes the same contract inline so it can stay byte-identical in
  // both web-app/src and _webapp-mirror (it cannot import trung-pages).
  const modal = read(path.join(SRC, AUTH_MODAL));
  assert.match(modal, /workgo-auth-changed/, "AuthModal must dispatch workgo-auth-changed");
});

// ---------------------------------------------------------------------------
// AH-03 / AH-04 — the header reflects auth state before AND after login
// ---------------------------------------------------------------------------
test("AH-03: the shell feeds currentUser / onLogout / extraLinks into Header", () => {
  const shell = read(SHELL);
  assert.match(shell, /currentUser=\{authUser\}/, "Header must receive currentUser");
  assert.match(shell, /onLogout=\{handleLogout\}/, "Header must receive onLogout");
  assert.match(shell, /extraLinks=\{/, "Header must receive the website-only extraLinks");
  assert.match(shell, /isAuthenticated=\{/, "TrungSubNav must receive isAuthenticated");
  assert.match(shell, /onSuccess=\{/, "AuthModal must receive onSuccess");
});

test("AH-04: mount reads the stored user, subscribes to changes, and logout clears it", () => {
  const shell = read(SHELL);
  assert.match(shell, /readAuthUser\(\)/, "shell must hydrate auth state on mount");
  assert.match(shell, /subscribeAuth\(/, "shell must subscribe to workgo-auth-changed");
  assert.match(shell, /const handleLogout =/, "shell must define handleLogout");
  const logout = shell.slice(shell.indexOf("const handleLogout"));
  assert.match(logout.slice(0, 500), /clearAuth\(\)/, "handleLogout must call clearAuth()");
  assert.match(logout.slice(0, 500), /Đăng xuất/, "handleLogout must confirm with a toast");
});

// ---------------------------------------------------------------------------
// AH-05 / AH-06 — one dropdown, always mounted, two non-overlapping triggers
// ---------------------------------------------------------------------------
test("AH-05: Header collapses the action row to a single dropdown pair", () => {
  const jsx = read(path.join(SRC, HEADER));
  const css = read(path.join(SRC, HEADER_CSS));
  assert.match(jsx, /styles\.menuTrigger/, "Header needs a desktop dropdown trigger");
  assert.match(jsx, /styles\.menuToggle/, "Header keeps the mobile trigger");
  assert.match(css, /\.menuTrigger\s*\{/, "CSS must declare .menuTrigger");
  assert.match(
    css,
    /@media\s*\(min-width:\s*1100px\)\s*\{[\s\S]{0,120}?\.menuTrigger\s*\{[^}]*display:\s*inline-flex/,
    "menuTrigger must appear on desktop"
  );
  assert.match(
    css,
    /\.menuTrigger\s*\{[^}]*display:\s*none/,
    "menuTrigger must be hidden below the desktop breakpoint"
  );
});

test("AH-06: the dropdown panel is always mounted (display:none when closed)", () => {
  const jsx = read(path.join(SRC, HEADER));
  const css = read(path.join(SRC, HEADER_CSS));
  assert.match(jsx, /styles\.mobileDrawer/, "panel must reuse the mobileDrawer shell");
  assert.match(jsx, /styles\.menuPanel/, "panel must carry the menuPanel class");
  assert.match(jsx, /aria-expanded=\{mobileMenuOpen\}/, "trigger must expose aria-expanded");
  assert.match(jsx, /aria-controls=/, "trigger must expose aria-controls");
  assert.ok(
    !/\{\s*mobileMenuOpen\s*&&/.test(jsx),
    "panel must NOT be conditionally rendered — keep it in the DOM for keyboard/script access"
  );
  assert.match(css, /\.menuPanel\s*\{[^}]*display:\s*none/, ".menuPanel must be display:none when closed");
  assert.match(css, /\.menuPanelOpen\s*\{[^}]*display:\s*block/, ".menuPanelOpen must reveal the panel");
  // Panel items must not use the navLink class (the 1100px sweep caps navLink height at 36px).
  assert.match(jsx, /styles\.menuItem/, "panel items must use the menuItem class");
});

// ---------------------------------------------------------------------------
// AH-07 — SubNav hides the auth entries only when signed in
// ---------------------------------------------------------------------------
test("AH-07: TrungSubNav gains isAuthenticated while LINKS keeps all 15 entries", () => {
  const tsx = read(SUBNAV);
  assert.match(tsx, /isAuthenticated/, "TrungSubNav must accept isAuthenticated");
  const links = tsx.slice(tsx.indexOf("const LINKS"), tsx.indexOf("const LINKS") + 2000);
  const keys = [...links.matchAll(/\{\s*key:\s*"/g)].length;
  assert.equal(keys, 15, `LINKS must keep 15 entries (found ${keys})`);
  assert.match(tsx, /AUTH_LINK_KEYS/, "TrungSubNav needs the set of auth-only link keys to filter");
  assert.match(tsx, /filter\(/, "TrungSubNav must filter the auth links when authenticated");
});

// ---------------------------------------------------------------------------
// AH-08 / AH-09 — inline validation and register-then-signed-in
// ---------------------------------------------------------------------------
test("AH-08: LoginPage / RegisterPage validate on blur and describe their errors", () => {
  for (const [name, file] of [
    ["LoginPage", LOGIN],
    ["RegisterPage", REGISTER],
  ]) {
    const code = read(file);
    assert.match(code, /onBlur=/, `${name} must re-validate on blur`);
    assert.match(code, /aria-describedby=/, `${name} must link inputs to their error text`);
    // The invariant is "the error text carries a stable id that the input points
    // at through aria-describedby". Both idiomatic JSX spellings are accepted:
    // id="login-email-error" and id={`login-email-error`}.
    assert.match(
      code,
      /id=(?:"[a-z0-9-]*-error"|\{`[a-z0-9-]*-error`\})/,
      `${name} error nodes need an id for aria-describedby`
    );
    assert.match(code, /errors\.\w+ \?/, `${name} must clear/refresh errors as the user types`);
  }
});

test("AH-09: RegisterPage signs the user in straight after a mock registration", () => {
  const code = read(REGISTER);
  const submit = code.slice(code.indexOf("const submit"));
  assert.match(submit.slice(0, 900), /saveAuth\(/, "register must persist the session immediately");
  assert.match(submit.slice(0, 900), /onNavigate\("home"\)/, "register must land on home signed in");
});

// ---------------------------------------------------------------------------
// AH-10 — a11y + hygiene invariants survive the refactor
// ---------------------------------------------------------------------------
test("AH-10: dialog/escape/focus-trap invariants survive and no console noise is added", () => {
  const header = read(path.join(SRC, HEADER));
  const modal = read(path.join(SRC, AUTH_MODAL));
  assert.match(header, /useFocusTrap\(/, "Header must keep the focus trap");
  assert.match(header, /'Escape'/, "Header must keep the Escape handler");
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /useFocusTrap\(/, "AuthModal must keep the focus trap");

  for (const file of [STORE, SHELL, LOGIN, REGISTER, SUBNAV, path.join(SRC, HEADER), path.join(SRC, AUTH_MODAL)]) {
    const code = read(file);
    assert.ok(
      !/console\.(log|warn|error|info|debug)\(/.test(code),
      `${path.basename(file)} contains a console statement`
    );
  }
});
