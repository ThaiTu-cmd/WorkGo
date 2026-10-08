import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Resilience - Login route includes Local Demo accounts for offline dev bypass", () => {
  const loginRoutePath = path.resolve(__dirname, "../src/app/api/auth/login/route.ts");
  assert.ok(fs.existsSync(loginRoutePath), "login/route.ts must exist");

  const content = fs.readFileSync(loginRoutePath, "utf-8");
  assert.match(content, /demouser1/, "Must support demouser1 account");
  assert.match(content, /provider1/, "Must support provider1 account");
  assert.match(content, /Demo@12345/, "Must support demo password");
  assert.match(content, /Local Demo/, "Must provide Local Demo fallback message");
});

test("Resilience - Refresh route returns HTTP 401 and does not delete cookies on unsupported refresh", () => {
  const refreshRoutePath = path.resolve(__dirname, "../src/app/api/auth/refresh/route.ts");
  assert.ok(fs.existsSync(refreshRoutePath), "refresh/route.ts must exist");

  const content = fs.readFileSync(refreshRoutePath, "utf-8");
  assert.match(content, /REFRESH_UNSUPPORTED/, "Must return REFRESH_UNSUPPORTED code");
  assert.match(content, /status:\s*401/, "Must return HTTP 401 to prevent fake success");
  assert.doesNotMatch(content, /cookies\.delete/, "Must not prematurely delete session cookies");
});

test("Resilience - ApiClient handles 401 gracefully and stops infinite refresh loops", () => {
  const apiClientPath = path.resolve(__dirname, "../src/lib/api-client.ts");
  const content = fs.readFileSync(apiClientPath, "utf-8");

  assert.match(content, /REFRESH_UNSUPPORTED/, "Must check for REFRESH_UNSUPPORTED to prevent loop");
  assert.match(content, /\/api\/proxy\//, "Must rewrite client requests to BFF proxy");
  assert.match(content, /same-origin/, "Must pass same-origin credentials for local proxy requests");
});

test("Resilience - Settings Page has null-safety check for user object before saving", () => {
  const settingsPath = path.resolve(__dirname, "../src/app/[locale]/(app)/settings/page.tsx");
  const content = fs.readFileSync(settingsPath, "utf-8");

  assert.match(
    content,
    /if\s*\(!user\s*\|\|\s*!user\.userId\)/,
    "Must guard against null user and null user.userId"
  );
});

test("Resilience - Proxy middleware preserves locale prefix in nextUrl parameter", () => {
  const proxyPath = path.resolve(__dirname, "../src/proxy.ts");
  const content = fs.readFileSync(proxyPath, "utf-8");

  assert.match(
    content,
    /nextUrl\.searchParams\.set\(["']next["'],\s*`\/\$\{locale\}\$\{pathWithoutLocale\}`\)/,
    "Auth guard must preserve locale prefix in nextUrl"
  );
});

test("Resilience - React 19 Compiler compliance: all 8 forms use useWatch", () => {
  const formFiles = [
    "../src/app/[locale]/(app)/reviews/new/page.tsx",
    "../src/app/[locale]/(app)/settings/page.tsx",
    "../src/app/[locale]/(auth)/login/page.tsx",
    "../src/app/[locale]/(auth)/register/page.tsx",
    "../src/components/composed/post-form.tsx",
    "../src/components/domain/payment-panel.tsx",
    "../src/components/domain/payout-form.tsx",
    "../src/components/domain/review-modal.tsx",
  ];

  for (const relPath of formFiles) {
    const fullPath = path.resolve(__dirname, relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.match(
      content,
      /useWatch/,
      `${relPath} must use useWatch to comply with React 19 Compiler`
    );
  }
});
