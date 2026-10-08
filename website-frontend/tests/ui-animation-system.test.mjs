import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("UI Animation System - next.config.ts has devIndicators: false configured", () => {
  const configPath = path.resolve(__dirname, "../next.config.ts");
  assert.ok(fs.existsSync(configPath), "next.config.ts must exist");
  const content = fs.readFileSync(configPath, "utf-8");

  assert.match(
    content,
    /devIndicators:\s*false/,
    "next.config.ts must specify devIndicators: false to disable bottom-left indicator"
  );
});

test("UI Animation System - globals.css contains Next.js dev indicator portal suppression", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  assert.ok(fs.existsSync(cssPath), "globals.css must exist");
  const content = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    content,
    /nextjs-portal/,
    "globals.css must suppress nextjs-portal element"
  );
  assert.match(
    content,
    /\[data-nextjs-dev-indicator\]/,
    "globals.css must suppress data-nextjs-dev-indicator"
  );
  assert.match(
    content,
    /display:\s*none\s*!important/,
    "globals.css must set display: none !important for dev indicators"
  );
});

test("UI Animation System - globals.css defines complete keyframes suite", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  const requiredKeyframes = [
    "fadeIn",
    "fadeOut",
    "fadeUp",
    "scaleIn",
    "slideInFromRight",
    "slideInFromLeft",
    "slideInFromBottom",
    "shimmer",
    "pulseGlow",
    "float",
    "toastCountdown",
  ];

  for (const kf of requiredKeyframes) {
    assert.match(
      content,
      new RegExp(`@keyframes\\s+${kf}`),
      `globals.css must define @keyframes ${kf}`
    );
  }
});

test("UI Animation System - globals.css contains Radix data-state transitions & utility classes", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    content,
    /\[data-state="open"\]\.animate-in/,
    "globals.css must support [data-state='open'].animate-in"
  );
  assert.match(
    content,
    /\.animate-shimmer/,
    "globals.css must provide .animate-shimmer utility"
  );
  assert.match(
    content,
    /\.animate-fade-up/,
    "globals.css must provide .animate-fade-up utility"
  );
  assert.match(
    content,
    /prefers-reduced-motion/,
    "globals.css must handle prefers-reduced-motion"
  );
});

test("UI Animation System - UI core atoms have micro-interactions", () => {
  const skeletonPath = path.resolve(__dirname, "../src/components/ui/skeleton.tsx");
  const buttonPath = path.resolve(__dirname, "../src/components/ui/button.tsx");
  const cardPath = path.resolve(__dirname, "../src/components/ui/card.tsx");
  const toastPath = path.resolve(__dirname, "../src/components/ui/toast.tsx");

  const skeletonContent = fs.readFileSync(skeletonPath, "utf-8");
  assert.match(
    skeletonContent,
    /animate-shimmer/,
    "Skeleton component must use animate-shimmer"
  );

  const buttonContent = fs.readFileSync(buttonPath, "utf-8");
  assert.match(
    buttonContent,
    /active:scale-\[0\.98\]/,
    "Button component must include active:scale-[0.98] interaction"
  );

  const cardContent = fs.readFileSync(cardPath, "utf-8");
  assert.match(
    cardContent,
    /-translate-y-1/,
    "Card component must include -translate-y-1 hover elevation"
  );

  const toastContent = fs.readFileSync(toastPath, "utf-8");
  assert.match(
    toastContent,
    /toastCountdown/,
    "Toast component must include toastCountdown animation"
  );
});
