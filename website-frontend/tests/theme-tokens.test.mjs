import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");

test("Task 1 - WORKGO_APP_TOKENS exists with Trust Blue colors and execution badges", async () => {
  const tokensModule = await import("../src/lib/design-tokens.ts");
  assert.ok(tokensModule.WORKGO_APP_TOKENS, "WORKGO_APP_TOKENS must be exported");

  const tokens = tokensModule.WORKGO_APP_TOKENS;
  assert.equal(tokens.primary, "#2563EB", "primary should be #2563EB");
  assert.equal(tokens.primaryHover, "#1D4ED8", "primaryHover should be #1D4ED8");
  assert.equal(tokens.primaryActive, "#1E40AF", "primaryActive should be #1E40AF");
  assert.equal(tokens.primarySubtle, "#EFF6FF", "primarySubtle should be #EFF6FF");
  assert.equal(tokens.bgApp, "#F8FAFC", "bgApp should be #F8FAFC");
  assert.equal(tokens.bgSurface, "#FFFFFF", "bgSurface should be #FFFFFF");
  assert.equal(tokens.textPrimary, "#0F172A", "textPrimary should be #0F172A");

  // Execution type badge tokens
  assert.equal(tokens.execDigitalBg, "#E0F2FE");
  assert.equal(tokens.execDigitalFg, "#0369A1");
  assert.equal(tokens.execOnsiteBg, "#FEF3C7");
  assert.equal(tokens.execOnsiteFg, "#B45309");
  assert.equal(tokens.execDeliveryBg, "#DCFCE7");
  assert.equal(tokens.execDeliveryFg, "#15803D");
  assert.equal(tokens.execAppointmentBg, "#F3E8FF");
  assert.equal(tokens.execAppointmentFg, "#7C3AED");
});

test("Task 1 - Button primary supports Trust Blue #2563EB", () => {
  const btnContent = fs.readFileSync(path.join(ROOT, "src/components/ui/button.tsx"), "utf-8");
  assert.match(btnContent, /#2563EB/, "Button component must reference Trust Blue #2563EB");
});

test("Task 1 - Badge and StatusBadge support execution types (DIGITAL, ONSITE, DELIVERY, APPOINTMENT)", () => {
  const badgeContent = fs.readFileSync(path.join(ROOT, "src/components/ui/badge.tsx"), "utf-8");
  assert.match(badgeContent, /execDigital|#E0F2FE/, "badge.tsx must support execDigital");
  assert.match(badgeContent, /execOnsite|#FEF3C7/, "badge.tsx must support execOnsite");
  assert.match(badgeContent, /execDelivery|#DCFCE7/, "badge.tsx must support execDelivery");
  assert.match(badgeContent, /execAppointment|#F3E8FF/, "badge.tsx must support execAppointment");

  const statusBadgeContent = fs.readFileSync(path.join(ROOT, "src/components/ui/status-badge.tsx"), "utf-8");
  assert.match(statusBadgeContent, /DIGITAL/, "status-badge.tsx must support DIGITAL");
  assert.match(statusBadgeContent, /ONSITE/, "status-badge.tsx must support ONSITE");
  assert.match(statusBadgeContent, /DELIVERY/, "status-badge.tsx must support DELIVERY");
  assert.match(statusBadgeContent, /APPOINTMENT/, "status-badge.tsx must support APPOINTMENT");
});

test("Task 1 - Android theme.ts fixes Spacing six/seven inversion and adds Elevation", () => {
  const themeContent = fs.readFileSync(path.join(ANDROID_ROOT, "src/constants/theme.ts"), "utf-8");
  assert.match(themeContent, /six:\s*48/, "Spacing.six must be 48");
  assert.match(themeContent, /seven:\s*64/, "Spacing.seven must be 64");
  assert.match(themeContent, /Elevation/, "Elevation token must be defined in theme.ts");
});
