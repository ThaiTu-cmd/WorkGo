import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

test("VIS-O01 (Z-index scale): globals.css must define standard ascending stacking scale", () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  const zHeaderMatch = content.match(/--z-header:\s*(\d+);/);
  const zDropdownMatch = content.match(/--z-dropdown:\s*(\d+);/);
  const zDrawerMatch = content.match(/--z-drawer:\s*(\d+);/);
  const zModalMatch = content.match(/--z-modal:\s*(\d+);/);
  const zToastMatch = content.match(/--z-toast:\s*(\d+);/);
  const zTooltipMatch = content.match(/--z-tooltip:\s*(\d+);/);

  assert.ok(zHeaderMatch, "Must define --z-header");
  assert.ok(zDropdownMatch, "Must define --z-dropdown");
  assert.ok(zDrawerMatch, "Must define --z-drawer");
  assert.ok(zModalMatch, "Must define --z-modal");
  assert.ok(zToastMatch, "Must define --z-toast");
  assert.ok(zTooltipMatch, "Must define --z-tooltip");

  const zHeader = Number(zHeaderMatch[1]);
  const zDropdown = Number(zDropdownMatch[1]);
  const zDrawer = Number(zDrawerMatch[1]);
  const zModal = Number(zModalMatch[1]);
  const zToast = Number(zToastMatch[1]);
  const zTooltip = Number(zTooltipMatch[1]);

  assert.ok(zHeader < zDropdown, "--z-header must be < --z-dropdown");
  assert.ok(zDropdown < zDrawer, "--z-dropdown must be < --z-drawer");
  assert.ok(zDrawer < zModal, "--z-drawer must be < --z-modal");
  assert.ok(zModal < zToast, "--z-modal must be < --z-toast");
  assert.ok(zToast < zTooltip, "--z-toast must be < --z-tooltip");
});

test("VIS-O02 (Décor pointer events): Background decorative layers must not block interaction", () => {
  const heroPath = path.join(ROOT, "src/components/landing/fiverr/fiverr-hero.tsx");
  const heroContent = fs.readFileSync(heroPath, "utf-8");

  assert.match(
    heroContent,
    /pointer-events-none[\s\S]*?Fiverr3dAccent/,
    "3D accent container in hero must have pointer-events-none"
  );
  assert.match(
    heroContent,
    /bg-black\/45[\s\S]*?pointer-events-none/,
    "Hero scrim must have pointer-events-none to prevent intercepting clicks"
  );
});

test("VIS-O03 (Modal/Dialog Portal containment): Dialog and Drawer primitives use Radix Portal", () => {
  const dialogPath = path.join(ROOT, "src/components/ui/dialog.tsx");
  if (fs.existsSync(dialogPath)) {
    const dialogContent = fs.readFileSync(dialogPath, "utf-8");
    assert.match(dialogContent, /DialogPrimitive\.Portal/, "Dialog must mount through Radix Portal");
  }

  const drawerPath = path.join(ROOT, "src/components/ui/drawer.tsx");
  if (fs.existsSync(drawerPath)) {
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");
    assert.match(
      drawerContent,
      /(?:DrawerPrimitive|DialogPrimitive)\.Portal|DrawerPortal/,
      "Drawer must mount through Portal"
    );
  }
});
