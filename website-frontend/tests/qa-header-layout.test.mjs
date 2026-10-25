import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");

const SRC_CSS = path.join(REPO, "web-app/src/components/common/Header/Header.module.css");
const MIRROR_CSS = path.join(REPO, "website-frontend/src/_webapp-mirror/components/common/Header/Header.module.css");
const SRC_JSX = path.join(REPO, "web-app/src/components/common/Header/Header.jsx");
const MIRROR_JSX = path.join(REPO, "website-frontend/src/_webapp-mirror/components/common/Header/Header.jsx");

const read = (p) => fs.readFileSync(p, "utf-8");
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

// HL-01: Byte parity Header.module.css source <-> mirror
test("HL-01: Byte parity Header.module.css source <-> mirror", () => {
  const hashSrc = sha256(SRC_CSS);
  const hashMirror = sha256(MIRROR_CSS);
  assert.equal(hashSrc, hashMirror, "Source and mirror Header.module.css must be byte-identical");
});

// HL-02: Band @media (min-width:1441px) exists with compact rules
test("HL-02: Band @media (min-width:1441px) exists and contains 6 compact rules", () => {
  const css = read(SRC_CSS);
  assert.match(css, /@media\s*\(\s*min-width:\s*1441px\s*\)/);
  const blockMatch = css.match(/@media\s*\(\s*min-width:\s*1441px\s*\)\s*\{([\s\S]*?\n\})/);
  assert.ok(blockMatch, "Media block 1441px must exist");
  const block = blockMatch[1];
  assert.match(block, /\.desktopNav\s*\{[^}]*gap:\s*16px/);
  assert.match(block, /\.navLink\s*\{[^}]*font-size:\s*0\.9rem/);
  assert.match(block, /\.navSearch\s*\{[^}]*width:\s*240px/);
  assert.match(block, /\.desktopNav\s+\.navIconButton\s*\{[^}]*height:\s*38px/);
  assert.match(block, /\.desktopNav\s+\.navIconButton\s*\{[^}]*padding:\s*0\s+6px/);
  assert.match(block, /\.desktopNav\s+\.navIconButton\s*\{[^}]*gap:\s*5px/);
  assert.match(block, /\.desktopNav\s+\.navLabel\s*\{[^}]*font-size:\s*0\.81rem/);
  assert.match(block, /\.actionButtons\s*\{[^}]*gap:\s*8px/);
});

// HL-03: Band 1100-1440px remains intact
test("HL-03: Band 1100-1440px remains intact", () => {
  const css = read(SRC_CSS);
  const blockMatch = css.match(/@media\s*\(\s*min-width:\s*1100px\s*\)\s*and\s*\(\s*max-width:\s*1440px\s*\)\s*\{([\s\S]*?\n\})/);
  assert.ok(blockMatch, "Media block 1100-1440px must exist");
  const block = blockMatch[1];
  assert.match(block, /\.desktopNav\s*\{[^}]*gap:\s*16px/);
  assert.match(block, /\.navSearch\s*\{[^}]*width:\s*240px/);
  assert.match(block, /\.navLink\s*\{[^}]*font-size:\s*0\.9rem/);
});

// HL-04: .leftSection
test("HL-04: .leftSection has min-width:0, flex-shrink:1, gap:12px", () => {
  const css = read(SRC_CSS);
  const match = css.match(/\.leftSection\s*\{([^}]+)\}/);
  assert.ok(match, ".leftSection base block must exist");
  const block = match[1];
  assert.match(block, /min-width:\s*0/);
  assert.match(block, /flex-shrink:\s*1/);
  assert.match(block, /gap:\s*12px/);
});

// HL-05: .navSearch
test("HL-05: .navSearch base min-width:0, flex-shrink:1; >=1280px min-width:200px", () => {
  const css = read(SRC_CSS);
  const baseMatch = css.match(/\.navSearch\s*\{([^}]+)\}/);
  assert.ok(baseMatch, ".navSearch base block must exist");
  assert.match(baseMatch[1], /min-width:\s*0/);
  assert.match(baseMatch[1], /flex-shrink:\s*1/);

  const mediaMatches = [...css.matchAll(/@media\s*\(\s*min-width:\s*1280px\s*\)\s*\{([\s\S]*?\n\})/g)];
  assert.ok(mediaMatches.length > 0, "@media (min-width: 1280px) must exist");
  const combinedMedia = mediaMatches.map((m) => m[1]).join("\n");
  assert.match(combinedMedia, /\.navSearch\s*\{[^}]*min-width:\s*200px/);
});

// HL-06: .navSearchBtn::after
test("HL-06: .navSearchBtn::after has inset:-8px", () => {
  const css = read(SRC_CSS);
  const match = css.match(/\.navSearchBtn::after\s*\{([^}]+)\}/);
  assert.ok(match, ".navSearchBtn::after must exist");
  assert.match(match[1], /inset:\s*-8px/);
});

// HL-07: .userBadge
test("HL-07: .userBadge has max-width:120px", () => {
  const css = read(SRC_CSS);
  const match = css.match(/\.userBadge\s*\{([^}]+)\}/);
  assert.ok(match, ".userBadge must exist");
  assert.match(match[1], /max-width:\s*120px/);
});

// HL-08: Gutter
test("HL-08: Gutter token --header-gutter:24px base, 16px from 1280px with container override", () => {
  const css = read(SRC_CSS);
  const headerMatch = css.match(/\.header\s*\{([^}]+)\}/);
  assert.ok(headerMatch, ".header base block must exist");
  assert.match(headerMatch[1], /--header-gutter:\s*24px/);

  const containerMatch = css.match(/\.header\s+\.headerContainer\s*\{([^}]+)\}/);
  assert.ok(containerMatch, ".header .headerContainer base must exist");
  assert.match(containerMatch[1], /padding-left:\s*24px/);
  assert.match(containerMatch[1], /padding-right:\s*24px/);

  const mediaMatches = [...css.matchAll(/@media\s*\(\s*min-width:\s*1280px\s*\)\s*\{([\s\S]*?\n\})/g)];
  const combinedMedia = mediaMatches.map((m) => m[1]).join("\n");
  assert.match(combinedMedia, /--header-gutter:\s*16px/);
  assert.match(combinedMedia, /\.header\s+\.headerContainer\s*\{[^}]*padding-left:\s*16px/);
  assert.match(combinedMedia, /\.header\s+\.headerContainer\s*\{[^}]*padding-right:\s*16px/);
});

// HL-09: Panel anchor
test("HL-09: Panel anchor in desktop media uses right: max(...) and no raw right:24px in desktop menuPanel", () => {
  const css = read(SRC_CSS);
  const mediaMatches = [...css.matchAll(/@media\s*\(\s*min-width:\s*1100px\s*\)\s*\{([\s\S]*?\n\})/g)];
  const desktopBlock = mediaMatches.map((m) => m[1]).join("\n");
  const panelMatch = desktopBlock.match(/\.menuPanel\s*\{([^}]+)\}/);
  assert.ok(panelMatch, ".menuPanel must exist in desktop media");
  const panelRule = panelMatch[1];
  assert.match(panelRule, /right:\s*max\s*\(/);
  assert.match(panelRule, /--container-max/);
  assert.match(panelRule, /--header-gutter/);
  assert.doesNotMatch(panelRule, /right:\s*24px/);
});

// HL-10: Panel scoping
test("HL-10: Panel scoping to 1100px media, mobileDrawer maintains left:0, right:0", () => {
  const css = read(SRC_CSS);
  const drawerMatch = css.match(/\.mobileDrawer\s*\{([^}]+)\}/);
  assert.ok(drawerMatch, ".mobileDrawer must exist");
  assert.match(drawerMatch[1], /left:\s*0/);
  assert.match(drawerMatch[1], /right:\s*0/);

  const nonMediaCss = css.replace(/@media[^{]+\{([\s\S]*?\n\})/g, "");
  assert.doesNotMatch(nonMediaCss, /right:\s*max\s*\(/);
});

// HL-11: Không đổi JSX
test("HL-11: Header.jsx source <-> mirror parity and matches baseline", () => {
  const BASELINE_JSX_SHA = "36f6d2468413a77d692125befb10af44ac67264266971e628994f0a8f9da1a47";
  const hashSrc = sha256(SRC_JSX);
  const hashMirror = sha256(MIRROR_JSX);
  assert.equal(hashSrc, hashMirror, "Header.jsx source and mirror must match");
  assert.equal(hashSrc, BASELINE_JSX_SHA, "Header.jsx must remain untouched from baseline");
});

// HL-12: Không đổi token container
test("HL-12: Container max tokens remain untouched", () => {
  const webappShellCss = read(path.join(REPO, "website-frontend/src/components/webapp-bridge/webapp-shell.module.css"));
  assert.match(webappShellCss, /--container-max:\s*1240px;/);

  const variablesCss = read(path.join(REPO, "web-app/src/styles/variables.css"));
  assert.match(variablesCss, /--container-max:\s*1320px;/);
});
