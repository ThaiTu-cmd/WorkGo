import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("BFF Proxy - Route Handler file exists and exports required HTTP handlers", () => {
  const routePath = path.resolve(__dirname, "../src/app/api/proxy/[...path]/route.ts");
  assert.ok(fs.existsSync(routePath), "BFF proxy route.ts must exist");

  const content = fs.readFileSync(routePath, "utf-8");
  assert.match(content, /export const GET = handleProxy/, "Must export GET handler");
  assert.match(content, /export const POST = handleProxy/, "Must export POST handler");
  assert.match(content, /export const PUT = handleProxy/, "Must export PUT handler");
  assert.match(content, /export const DELETE = handleProxy/, "Must export DELETE handler");
  assert.match(content, /export const PATCH = handleProxy/, "Must export PATCH handler");
});

test("BFF Proxy - Routing paths correctly differentiate between Catalog and Gateway", () => {
  const routePath = path.resolve(__dirname, "../src/app/api/proxy/[...path]/route.ts");
  const content = fs.readFileSync(routePath, "utf-8");

  assert.match(content, /targetPath\.startsWith\(["']catalog\/["']\)/, "Must handle catalog path routing");
  assert.match(content, /COOKIE_ACCESS_TOKEN/, "Must read COOKIE_ACCESS_TOKEN");
  assert.match(content, /Bearer \$\{token\}/, "Must attach Bearer token to forwarded request");
});

test("BFF Proxy - Header sanitation and security rules", () => {
  const routePath = path.resolve(__dirname, "../src/app/api/proxy/[...path]/route.ts");
  const content = fs.readFileSync(routePath, "utf-8");

  assert.match(content, /forwardHeaders\.delete\(["']host["']\)/, "Must delete incoming host header");
  assert.match(content, /forwardHeaders\.delete\(["']cookie["']\)/, "Must delete raw cookie header");
});

test("BFF Proxy - Offline resilience and 503 fallback", () => {
  const routePath = path.resolve(__dirname, "../src/app/api/proxy/[...path]/route.ts");
  const content = fs.readFileSync(routePath, "utf-8");

  assert.match(content, /BACKEND_OFFLINE/, "Must return BACKEND_OFFLINE error code when fetch fails");
  assert.match(content, /status:\s*503/, "Must return HTTP 503 on backend outage");
});

test("BFF Proxy - Client Adapter does not hardcode cross-origin port 8082", () => {
  const catalogAdapterPath = path.resolve(__dirname, "../src/lib/adapters/catalog.ts");
  const content = fs.readFileSync(catalogAdapterPath, "utf-8");

  assert.doesNotMatch(content, /baseUrl:\s*["']http:\/\/localhost:8082["']/, "Must not hardcode port 8082");
  assert.match(content, /\/api\/proxy\/catalog\/categories\/roots/, "Must route through BFF proxy");
});
