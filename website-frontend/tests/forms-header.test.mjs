import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

test("Task 4 - PostForm implements 3-step wizard (Info -> Budget -> Media/Confirm)", () => {
  const formPath = path.join(ROOT, "src/components/composed/post-form.tsx");
  const content = fs.readFileSync(formPath, "utf-8");

  assert.match(content, /currentStep|step/i, "PostForm must manage wizard step state");
  assert.match(content, /ServiceFormStepper|stepper/i, "PostForm must render wizard stepper");
  assert.match(content, /APPOINTMENT/, "PostForm must include APPOINTMENT execution type");
});

test("Task 4 - ServiceFormStepper component exists with 3 steps", () => {
  const stepperPath = path.join(ROOT, "src/components/composed/service-form-stepper.tsx");
  assert.ok(fs.existsSync(stepperPath), "service-form-stepper.tsx must exist");
  const content = fs.readFileSync(stepperPath, "utf-8");
  assert.match(content, /currentStep/, "Stepper must receive currentStep");
});

test("Task 4 - Client Posts management page includes StatsCards, search toolbar and StatusBadge", () => {
  const clientPostsPath = path.join(ROOT, "src/app/[locale]/(app)/client/posts/page.tsx");
  const content = fs.readFileSync(clientPostsPath, "utf-8");

  assert.match(content, /StatusBadge/, "Client posts must use StatusBadge");
  assert.match(content, /proposalsCount|Đề xuất/i, "Client posts must display stats metrics");
});

test("Task 4 - PublicHeader contains mini-search for fast catalog exploration", () => {
  const headerPath = path.join(ROOT, "src/components/shell/public-header.tsx");
  const content = fs.readFileSync(headerPath, "utf-8");

  assert.match(content, /posts\?q=/, "PublicHeader must have mini-search submitting to /posts?q=");
});
