import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Routing Config - routing.ts exports locales and defaultLocale correctly", async () => {
  const routingFilePath = path.resolve(__dirname, "../src/i18n/routing.ts");
  assert.ok(fs.existsSync(routingFilePath), "routing.ts must exist");

  const routingModule = await import("../src/i18n/routing.ts");
  assert.ok(routingModule.routing, "routing must be exported");
  assert.deepEqual(routingModule.routing.locales, ["vi", "en"]);
  assert.equal(routingModule.routing.defaultLocale, "vi");
});

test("Routing Config - Root page redirects to default locale /vi/posts", () => {
  const pageFilePath = path.resolve(__dirname, "../src/app/page.tsx");
  assert.ok(fs.existsSync(pageFilePath), "src/app/page.tsx must exist");

  const pageContent = fs.readFileSync(pageFilePath, "utf-8");
  assert.match(
    pageContent,
    /redirect\(\s*["']\/vi\/posts["']\s*\)/,
    "Root page.tsx must redirect to /vi/posts"
  );
});

test("Routing Config - Next.js config includes next-intl plugin and strictMode", () => {
  const configPath = path.resolve(__dirname, "../next.config.ts");
  assert.ok(fs.existsSync(configPath), "next.config.ts must exist");

  const configContent = fs.readFileSync(configPath, "utf-8");
  assert.match(configContent, /createNextIntlPlugin/, "next.config.ts must import createNextIntlPlugin");
  assert.match(configContent, /reactStrictMode:\s*true/, "next.config.ts must enable reactStrictMode");
});
