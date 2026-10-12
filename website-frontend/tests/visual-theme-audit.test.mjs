import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const FONT_BLACK_TARGET_FILES = [
  "src/components/domain/wallet-summary.tsx",
  "src/components/shell/app-header.tsx",
  "src/components/shell/public-header.tsx",
  "src/components/shell/auth-shell.tsx",
  "src/components/shell/app-shell-client.tsx",
  "src/components/landing/workgo-navbar.tsx",
  "src/components/landing/workgo-landing-sections.tsx",
  "src/components/landing/fiverr/fiverr-header.tsx",
  "src/components/landing/fiverr/fiverr-footer.tsx",
];

test("VIS-W01 (Font weights): No font-black (900) in specified UI files since Be Vietnam Pro only loads up to 800", () => {
  for (const relativePath of FONT_BLACK_TARGET_FILES) {
    const fullPath = path.join(ROOT, relativePath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relativePath}`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.doesNotMatch(
      content,
      /\bfont-black\b/,
      `File ${relativePath} should not use font-black (900 weight not loaded, use font-extrabold)`
    );
  }
});

test("VIS-W02 (Anchor offset): globals.css must define scroll-margin-top on [id] to prevent sticky header clipping", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");
  assert.match(
    content,
    /\[id\]\s*\{[^}]*scroll-margin-top:\s*88px/,
    "globals.css must specify [id] { scroll-margin-top: 88px; }"
  );
});

test("VIS-W03 (Noscript reveal fallback): layout.tsx must include noscript style for .reveal when JS is disabled", () => {
  const layoutPath = path.join(ROOT, "src/app/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");
  assert.match(
    content,
    /<noscript>[\s\S]*?\.reveal[\s\S]*?opacity:\s*1\s*!important[\s\S]*?<\/noscript>/,
    "layout.tsx must contain noscript fallback ensuring .reveal elements are visible without JS"
  );
});
