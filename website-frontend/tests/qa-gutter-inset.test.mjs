import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const SRC = path.join(REPO, "website-frontend", "src", "_webapp-mirror");

const read = (p) => fs.readFileSync(p, "utf-8");

// ---------- M1: page container gutter +8/+4 ----------
test("gutter: .container is 32px desktop / 20px mobile", () => {
  const css = read(path.join(SRC, "styles/reset.css"));
  assert.match(css, /\.container\s*\{[^}]*padding-left:\s*32px/);
  assert.match(css, /\.container\s*\{[^}]*padding-right:\s*32px/);
  assert.match(css, /@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\.container\s*\{[\s\S]*?padding-left:\s*20px/);
});

// ---------- M2: header gutter 16 -> 24, scoped to beat .container order ----------
test("gutter: .headerContainer is 24px both sides", () => {
  const css = read(path.join(SRC, "components/common/Header/Header.module.css"));
  assert.match(css, /\.header\s+\.headerContainer\s*\{[^}]*padding-left:\s*24px/);
  assert.match(css, /\.header\s+\.headerContainer\s*\{[^}]*padding-right:\s*24px/);
});

// ---------- M3/M4: content wrappers 0 24 -> 0 32, mobile 0 16 -> 0 20 ----------
for (const file of [
  "pages/MyServices/MyServicesPage.module.css",
  "pages/ServiceDetail/ServiceDetailPage.module.css",
]) {
  test(`gutter: ${file} contentWrapper is 0 32px / mobile 0 20px`, () => {
    const css = read(path.join(SRC, file));
    assert.match(css, /\.contentWrapper\s*\{[^}]*padding:\s*0\s+32px/);
    assert.match(css, /\.contentWrapper\s*\{[^}]*padding:\s*0\s+20px/);
  });
}

// ---------- M5: service-form page gutters 1.5rem -> 2rem ----------
test("gutter: service-form page containers are 0 2rem", () => {
  const css = read(path.join(SRC, "pages/ServiceForm/ServiceFormPage.module.css"));
  for (const cls of ["topBarContainer", "contentContainer", "actionBarContainer"]) {
    assert.match(css, new RegExp(`\\.${cls}\\s*\\{[^}]*padding:\\s*0\\s+2rem`));
  }
});

// ---------- brand guard: no token drift ----------
test("gutter: brand tokens untouched", () => {
  const vars = read(path.join(SRC, "styles/variables.css"));
  assert.match(vars, /--wg-primary:\s*#1dbf73/);
});

