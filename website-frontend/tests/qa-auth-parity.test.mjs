// Cycle 4 (Phase 3) — F-16: writer-parity gate (G-AUTH-PARITY).
//
// The auth contract (`.team/roles/03-software-architect.md` §2.1/§2.4/§2.6, §11)
// has exactly TWO writers for the mock session:
//
//   W1  website-frontend/src/components/trung-pages/_stores/auth.ts   (saveAuth)
//       storage key  : KEYS.authToken === "accessToken"
//       storage key  : AUTH_USER_KEY   === "workgo_auth_user"
//       event        : AUTH_EVENT      === "workgo-auth-changed"
//
//   W2  components/common/AuthModal/AuthModal.jsx (inline fallback, 2 trees)
//       storage key  : AUTH_TOKEN_KEY  === "accessToken"
//       storage key  : AUTH_USER_KEY   === "workgo_auth_user"
//       event        : AUTH_EVENT      === "workgo-auth-changed"
//
// W2 cannot import W1 (the file must stay byte-identical in web-app/src and
// _webapp-mirror, and mirror code must not import trung-pages). Parity is
// therefore enforced here instead of shared at runtime: if one writer drifts,
// a session created by it becomes invisible to the other (RA-02) — the header
// stays signed-out while a token exists, or vice-versa.
//
// It also guards F-17 (debt D4 / RA-05): the modal must not fail silently when
// localStorage is blocked — both writers must report the failure to the user.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const WEBSITE = path.join(REPO, "website-frontend", "src");
const SRC = path.join(REPO, "web-app", "src");
const MIRROR = path.join(WEBSITE, "_webapp-mirror");
const TRUNG = path.join(WEBSITE, "components", "trung-pages");

const read = (p) => fs.readFileSync(p, "utf-8");
const at = (base, rel) => path.join(base, rel);

const AUTH_MODAL = "components/common/AuthModal/AuthModal.jsx";
const AXIOS = "api/axiosClient.js";

const STORE = path.join(TRUNG, "_stores", "auth.ts");
const KEYS = path.join(TRUNG, "_stores", "keys.ts");
const LOGIN = path.join(TRUNG, "auth", "LoginPage.tsx");
const REGISTER = path.join(TRUNG, "auth", "RegisterPage.tsx");
const SHELL = path.join(WEBSITE, "components", "webapp-bridge", "webapp-shell.tsx");

// The three literals locked by the contract (matrix rows of §2.6 / GP-1..GP-4).
// Each row pins the exact declaration in BOTH writers — a plain `includes()`
// would happily accept a drifted value like "workgo_auth_userX".
const CONTRACT = [
  {
    literal: "accessToken",
    why: "session token key (BR-3 / PIN-01)",
    storeDecl: /KEYS\.authToken/,
    modalDecl: /const AUTH_TOKEN_KEY\s*=\s*['"]accessToken['"]/,
  },
  {
    literal: "workgo_auth_user",
    why: "AuthUser JSON key (BR-2 / INV-03)",
    storeDecl: /export const AUTH_USER_KEY\s*=\s*"workgo_auth_user"/,
    modalDecl: /const AUTH_USER_KEY\s*=\s*['"]workgo_auth_user['"]/,
  },
  {
    literal: "workgo-auth-changed",
    why: "auth-changed window event (BR-2 / INV-02)",
    storeDecl: /export const AUTH_EVENT\s*=\s*"workgo-auth-changed"/,
    modalDecl: /const AUTH_EVENT\s*=\s*['"]workgo-auth-changed['"]/,
  },
];

const TOKEN_VALUE_RE = /mock-token-\$\{Date\.now\(\)\}/;

const QUOTA_TOAST =
  "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";

const has = (haystack, needle) => haystack.includes(needle);

// ---------------------------------------------------------------------------
// GP-1 — the store (W1) owns all three literals
// ---------------------------------------------------------------------------
test("GP-1 (F-16): auth store exposes the three contract literals", () => {
  const store = read(STORE);
  const keys = read(KEYS);

  assert.ok(
    /authToken:\s*"accessToken"/.test(keys),
    'KEYS.authToken must stay "accessToken" (pinned session token key)'
  );
  for (const { literal, why, storeDecl } of CONTRACT) {
    assert.ok(storeDecl.test(store), `auth.ts no longer owns the declaration of "${literal}" (${why})`);
  }
});

// ---------------------------------------------------------------------------
// GP-2 — the inline writer (W2) declares EXACTLY the same three literals
// ---------------------------------------------------------------------------
test("GP-2 (F-16): AuthModal declares exactly the same three contract literals (both trees)", () => {
  for (const base of [SRC, MIRROR]) {
    const modal = read(at(base, AUTH_MODAL));
    const where = path.relative(REPO, base);

    for (const { literal, why, modalDecl } of CONTRACT) {
      assert.ok(
        modalDecl.test(modal),
        `AuthModal under ${where} no longer declares "${literal}" (${why}) — the two writers drift`
      );
    }

    // ...and no extra auth constant sneaking in: the auth constant group holds
    // exactly the token key, the user key and the event name.
    const constants = [...modal.matchAll(/\bconst AUTH_[A-Z_]+\s*=/g)].map((m) => m[0]);
    assert.equal(
      constants.length,
      3,
      `AuthModal under ${where} declares ${constants.length} AUTH_* constants (expected 3): ${constants.join(", ")}`
    );
  }
});

// ---------------------------------------------------------------------------
// GP-2b — literal-by-literal parity matrix (the core of F-16)
// ---------------------------------------------------------------------------
test("GP-2b (F-16): every contract literal is declared identically in BOTH writers", () => {
  const store = read(STORE) + read(KEYS);
  const modal = read(at(SRC, AUTH_MODAL));

  for (const { literal, why, storeDecl, modalDecl } of CONTRACT) {
    assert.ok(storeDecl.test(store), `W1 (auth.ts/keys.ts) no longer declares "${literal}" (${why})`);
    assert.ok(modalDecl.test(modal), `W2 (AuthModal) no longer declares "${literal}" (${why})`);
  }
});

// ---------------------------------------------------------------------------
// GP-3 — the axios client is a reader/eraser, never a third writer
// ---------------------------------------------------------------------------
test("GP-3 (F-16): axiosClient shares the token + event literals but owns no user key", () => {
  const client = read(at(MIRROR, AXIOS));
  assert.ok(/TOKEN_KEY = 'accessToken'/.test(client), "axiosClient must read the pinned token key");
  assert.ok(has(client, "workgo-auth-changed"), "axiosClient must announce the shared event on 401");
  assert.ok(
    !has(client, "workgo_auth_user"),
    "axiosClient must not write the auth user — that would be a third writer"
  );
});

// ---------------------------------------------------------------------------
// GP-4 — identical mock-token format in both writers
// ---------------------------------------------------------------------------
test("GP-4 (F-16): both writers mint the token with the same format", () => {
  const store = read(STORE);
  const modalSrc = read(at(SRC, AUTH_MODAL));
  const modalMirror = read(at(MIRROR, AUTH_MODAL));

  assert.ok(TOKEN_VALUE_RE.test(store), "auth.ts token format drifted from the contract");
  assert.ok(TOKEN_VALUE_RE.test(modalSrc), "AuthModal token format drifted from the contract");
  assert.equal(modalMirror, modalSrc, "AuthModal copy must be byte-identical before comparing formats");
});

// ---------------------------------------------------------------------------
// GP-5 — the live endpoint stays retired everywhere
// ---------------------------------------------------------------------------
test("GP-5 (F-16): the retired live endpoint appears in neither app source", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name) && has(read(full), "identity/auth/token")) {
        offenders.push(path.relative(REPO, full));
      }
    }
  };
  walk(SRC);
  walk(WEBSITE);
  assert.deepEqual(offenders, [], `live auth endpoint resurfaced in: ${offenders.join(", ")}`);
});

// ---------------------------------------------------------------------------
// GP-6 — the storage-blocked copy is verbatim in the page writers
// ---------------------------------------------------------------------------
test("GP-6 (F-16): the quota copy is verbatim in both page writers", () => {
  for (const [name, file] of [
    ["LoginPage", LOGIN],
    ["RegisterPage", REGISTER],
  ]) {
    assert.ok(
      has(read(file), QUOTA_TOAST),
      `${name} drifted from the pinned quota copy (EC-TRUNG-15 / PIN-11)`
    );
  }
});

// ---------------------------------------------------------------------------
// AH-11 / F-17 (debt D4 / RA-05) — no silent storage failure in the modal
// ---------------------------------------------------------------------------
test("AH-11 (F-17): AuthModal surfaces a blocked localStorage instead of failing silently", () => {
  const modal = read(at(SRC, AUTH_MODAL));

  assert.ok(
    has(modal, QUOTA_TOAST),
    "AuthModal must reuse the pinned quota copy (EC-TRUNG-15) when persistence fails"
  );

  // The host hook decides persistence: `onSuccess` returns a boolean now
  // (false === storage blocked/full), so the modal can react instead of staying silent.
  assert.ok(
    /onSuccess\(user\)[\s\S]{0,60}!==\s*false/.test(modal),
    "AuthModal must treat `onSuccess(user) === false` as a failed persist"
  );

  // The standalone path (no host hook) must flag its own try/catch failure.
  assert.ok(
    /catch\s*\{[\s\S]{0,200}persisted\s*=\s*false/.test(modal),
    "the inline fallback must mark the session as not persisted when storage throws"
  );

  // Failure feedback: error state + early return, so the success banner and the
  // auto-close never run for a session that does not exist.
  assert.ok(
    /if\s*\(!persisted\)\s*\{[\s\S]{0,300}type:\s*'error'[\s\S]{0,300}return;/.test(modal),
    "AuthModal must show an error feedback and stop before the success path"
  );
});

test("AH-12 (F-17): the shell wires onSuccess to the store result", () => {
  const shell = read(SHELL);
  assert.ok(
    /onSuccess=\{saveAuth\}|onSuccess=\{[\s\S]{0,200}return saveAuth\(user\)/.test(shell),
    "the shell must forward saveAuth's boolean so the modal can report a blocked storage"
  );
});
