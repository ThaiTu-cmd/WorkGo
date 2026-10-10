import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// 1. MATHEMATICAL & ALGORITHMIC UNIT TESTS: SCROLL CHOREOGRAPHY & PHYSICS
// =========================================================================

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function hexToRgbNormalized(hex) {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: Number((((num >> 16) & 255) / 255).toFixed(4)),
    g: Number((((num >> 8) & 255) / 255).toFixed(4)),
    b: Number(((num & 255) / 255).toFixed(4)),
  };
}

function sample(stops, p) {
  p = clamp(p, 0, 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (p >= s0.p && p <= s1.p) {
      const t = (p - s0.p) / (s1.p - s0.p);
      const st = t * t * (3 - 2 * t); // Hermite smoothstep
      return lerp(s0.v, s1.v, st);
    }
  }
  return stops[stops.length - 1].v;
}

test("Math & Choreography - lerp accurately calculates intermediate and boundary values", () => {
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp(-5, 5, 0.5), 0);
  assert.equal(lerp(-10, -20, 0.25), -12.5);
  // Edge: extrapolation beyond [0, 1]
  assert.equal(lerp(0, 10, 1.5), 15);
  assert.equal(lerp(0, 10, -0.5), -5);
});

test("Math & Choreography - clamp constrains values strictly within [lo, hi]", () => {
  // Normal in-range
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);

  // Out of bounds
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-999.9, -1, 1), -1);
  assert.equal(clamp(999.9, -1, 1), 1);

  // Degenerate bounds
  assert.equal(clamp(5, 5, 5), 5);
  assert.equal(clamp(2, 5, 5), 5);
});

test("Math & Choreography - sample smoothstep interpolation handles STOPS_X, Y, S and edge progress", () => {
  const STOPS_X = [
    { p: 0, v: 0 },
    { p: 0.32, v: -3.1 },
    { p: 0.64, v: 3.2 },
    { p: 1, v: 0 },
  ];
  const STOPS_Y = [
    { p: 0, v: -4.5 },
    { p: 0.32, v: 0.55 },
    { p: 0.64, v: 0.45 },
    { p: 1, v: 0.15 },
  ];
  const STOPS_S = [
    { p: 0, v: 2.15 },
    { p: 0.32, v: 1.0 },
    { p: 0.64, v: 0.92 },
    { p: 1, v: 1.12 },
  ];

  // Exact keyframe boundaries (accounting for IEEE-754 floating point precision)
  const assertClose = (actual, expected) => {
    assert.ok(Math.abs(actual - expected) < 1e-5, `Expected ${actual} to be close to ${expected}`);
  };

  assertClose(sample(STOPS_X, 0), 0);
  assertClose(sample(STOPS_X, 0.32), -3.1);
  assertClose(sample(STOPS_X, 0.64), 3.2);
  assertClose(sample(STOPS_X, 1), 0);

  assertClose(sample(STOPS_Y, 0), -4.5);
  assertClose(sample(STOPS_Y, 0.32), 0.55);
  assertClose(sample(STOPS_Y, 0.64), 0.45);
  assertClose(sample(STOPS_Y, 1), 0.15);

  assertClose(sample(STOPS_S, 0), 2.15);
  assertClose(sample(STOPS_S, 0.32), 1.0);
  assertClose(sample(STOPS_S, 0.64), 0.92);
  assertClose(sample(STOPS_S, 1), 1.12);

  // Intermediate values - must be continuous and strictly between keyframe values
  const midX = sample(STOPS_X, 0.16);
  assert.ok(midX < 0 && midX > -3.1, `midX should be between 0 and -3.1, got ${midX}`);

  const midS = sample(STOPS_S, 0.16);
  assert.ok(midS < 2.15 && midS > 1.0, `midS should be between 2.15 and 1.0, got ${midS}`);

  // Edge & Corner cases: Underflow & Overflow clamped safely
  assertClose(sample(STOPS_X, -0.5), 0);
  assertClose(sample(STOPS_X, 1.8), 0);
  assertClose(sample(STOPS_Y, -100), -4.5);
  assertClose(sample(STOPS_Y, 100), 0.15);
});

test("Math & Colors - hexToRgbNormalized converts hex palette tokens to accurate unit vectors", () => {
  // Deep space background #04060f
  const bg = hexToRgbNormalized("#04060f");
  assert.equal(bg.r, Number((4 / 255).toFixed(4)));
  assert.equal(bg.g, Number((6 / 255).toFixed(4)));
  assert.equal(bg.b, Number((15 / 255).toFixed(4)));

  // Mint accent #5df0a8
  const mint = hexToRgbNormalized("#5df0a8");
  assert.equal(mint.r, Number((93 / 255).toFixed(4)));
  assert.equal(mint.g, Number((240 / 255).toFixed(4)));
  assert.equal(mint.b, Number((168 / 255).toFixed(4)));

  // Extremes: Pure White #ffffff and Pure Black #000000
  const white = hexToRgbNormalized("#ffffff");
  assert.equal(white.r, 1);
  assert.equal(white.g, 1);
  assert.equal(white.b, 1);

  const black = hexToRgbNormalized("#000000");
  assert.equal(black.r, 0);
  assert.equal(black.g, 0);
  assert.equal(black.b, 0);
});

// =========================================================================
// 2. PARTICLE OCEAN PHYSICS & RESILIENCE LOGIC
// =========================================================================

function simulateParticlePhysics(particle, mouseX, mouseY, mouseInfluence, speed, dt) {
  // Physics step
  let { x, y, vx, vy, phase } = particle;
  x += vx * speed * 60 * dt;
  y += (vy * speed + Math.sin(phase) * 0.15) * 60 * dt;

  // Mouse repulsion
  if (mouseX > 0 && mouseY > 0) {
    const dx = x - mouseX;
    const dy = y - mouseY;
    const dist = Math.hypot(dx, dy);
    if (dist < mouseInfluence && dist > 0) {
      const force = (1 - dist / mouseInfluence) * 2;
      x += (dx / dist) * force;
      y += (dy / dist) * force;
    }
  }

  // Wrap around boundaries
  const width = 800;
  const height = 600;
  if (x < -10) x = width + 10;
  else if (x > width + 10) x = -10;

  if (y < -10) y = height + 10;
  else if (y > height + 10) y = -10;

  return { x, y };
}

test("Particle Ocean Physics - Mouse repulsion pushes particles gently away without NaN or divide-by-zero", () => {
  const p = { x: 100, y: 100, vx: 0, vy: 0, phase: 0 };
  const mouseInfluence = 80;

  // Case 1: Mouse directly nearby at (90, 100) -> distance = 10, particle should be pushed to the right
  const result1 = simulateParticlePhysics(p, 90, 100, mouseInfluence, 0.3, 0.016);
  assert.ok(result1.x > 100, `Particle should be pushed rightwards, got x=${result1.x}`);
  assert.equal(Number.isNaN(result1.x), false);

  // Case 2: Mouse exactly on top of particle (distance = 0) -> division by zero guard prevents NaN
  const result2 = simulateParticlePhysics(p, 100, 100, mouseInfluence, 0.3, 0.016);
  assert.equal(Number.isNaN(result2.x), false);
  assert.equal(Number.isNaN(result2.y), false);

  // Case 3: Mouse outside influence radius (distance = 150 > 80) -> no mouse force applied
  const result3 = simulateParticlePhysics(p, 250, 100, mouseInfluence, 0.3, 0.016);
  assert.equal(result3.x, 100);
});

test("Particle Ocean Physics - Alpha connection calculation conforms to inverse linear distance decay", () => {
  const maxConnectionDist = 120;
  const calculateAlpha = (dist) => {
    if (dist >= maxConnectionDist) return 0;
    return (1 - dist / maxConnectionDist) * 0.6;
  };

  assert.equal(calculateAlpha(0), 0.6); // Closest proximity
  assert.equal(Number(calculateAlpha(60).toFixed(2)), 0.3); // Midpoint
  assert.equal(calculateAlpha(120), 0); // Boundary
  assert.equal(calculateAlpha(150), 0); // Out of reach
});

test("Particle Ocean Physics - Screen boundary wrap prevents particles from escaping canvas", () => {
  // Particle moving left past -10
  const pLeft = { x: -11, y: 300, vx: -1, vy: 0, phase: 0 };
  const wrappedLeft = simulateParticlePhysics(pLeft, -9999, -9999, 80, 0.3, 0.016);
  assert.equal(wrappedLeft.x, 810);

  // Particle moving right past 810
  const pRight = { x: 811, y: 300, vx: 1, vy: 0, phase: 0 };
  const wrappedRight = simulateParticlePhysics(pRight, -9999, -9999, 80, 0.3, 0.016);
  assert.equal(wrappedRight.x, -10);
});

// =========================================================================
// 3. LANDING PAGE ASCEND (NATIVE REACT) ARCHITECTURE & CODE INTEGRITY
// =========================================================================

test("Landing Page Ascend - WorkgoLandingPage and LandingStaticBackground exist and integrate cleanly", () => {
  const landingPath = path.resolve(__dirname, "../src/components/landing/workgo-landing-page.tsx");
  assert.ok(fs.existsSync(landingPath), "workgo-landing-page.tsx must exist");
  const content = fs.readFileSync(landingPath, "utf-8");
  assert.match(content, /<LandingStaticBackground\s*\/>/);
  assert.match(content, /<WorkgoNavbar/);
  assert.match(content, /<ParticleOceanHero/);
  assert.match(content, /<WorkgoLandingSections/);
});

test("Landing Page Ascend - Head defines required tokens and theme-aware classes", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");
  assert.match(content, /--primary:\s*#1677FF/);
  assert.match(content, /\.landing-static-cone/);
});

test("Landing Page Ascend - Contains all 4 core sections according to specification", () => {
  const secPath = path.resolve(__dirname, "../src/components/landing/workgo-landing-sections.tsx");
  const content = fs.readFileSync(secPath, "utf-8");
  assert.match(content, /id="features"/);
  assert.match(content, /id="showcase"/);
  assert.match(content, /id="pricing"/);
});

test("Landing Page Ascend - Native Landing incorporates Static Background and Resiliency", () => {
  const bgPath = path.resolve(__dirname, "../src/components/landing/landing-static-background.tsx");
  assert.ok(fs.existsSync(bgPath), "landing-static-background.tsx exists");
  const content = fs.readFileSync(bgPath, "utf-8");
  assert.match(content, /aria-hidden="true"/);
  assert.match(content, /pointer-events-none/);
});

// =========================================================================
// 4. NEXT.JS LANDING PAGE ROUTE & PARTICLE OCEAN COMPONENT
// =========================================================================

test("Next.js Landing Route - Page file exports metadata and embeds landing iframe cleanly", () => {
  const pagePath = path.resolve(__dirname, "../src/app/[locale]/(public)/landing/page.tsx");
  assert.ok(fs.existsSync(pagePath), "src/app/[locale]/(public)/landing/page.tsx must exist");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.match(content, /export const metadata:\s*Metadata/, "Metadata must be exported");
  assert.match(content, /WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp/, "Title must match WorkGo branding");
  assert.match(content, /<WorkgoLandingPage/, "Landing page renders WorkgoLandingPage");
});

test("Atmosphere Component - Implements complete CSS gradient atmosphere with zero canvas", () => {
  const componentPath = path.resolve(__dirname, "../src/components/effects/auth-atmosphere.tsx");
  assert.ok(fs.existsSync(componentPath), "auth-atmosphere.tsx must exist");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.match(content, /"use client"/, "Must be client component");
  assert.match(content, /export function AuthAtmosphere/, "Must export AuthAtmosphere component");
  assert.ok(!content.includes("ParticleOcean"), "Must not import or render ParticleOcean");
  assert.match(content, /color-mix/, "Must use theme-aware color-mix");
});

// =========================================================================
// 5. ASCEND DESIGN SYSTEM & UI REDESIGN INTEGRITY
// =========================================================================

test("Design System - globals.css defines Ascend color tokens, keyframes, and glass utilities", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  // Ascend / WorkGo Tokens
  assert.match(content, /--accent-mint:\s*(#1677FF|#5df0a8)/i, "Must define --accent-mint token");
  assert.match(content, /--accent-mint-hover:\s*(#2EA8FF|#2fd38a)/i, "Must define --accent-mint-hover token");
  assert.match(content, /--bg-deep-space:\s*(#030B1C|#04060f)/i, "Must define --bg-deep-space token");
  assert.match(content, /--glass-border:\s*rgba\((148,\s*184,\s*255,\s*0\.14|150,\s*175,\s*230,\s*0\.15)\)/, "Must define --glass-border token");

  // Ascend Keyframes
  assert.match(content, /@keyframes gradientShift/, "Must define @keyframes gradientShift");
  assert.match(content, /@keyframes subtleGlow/, "Must define @keyframes subtleGlow");
  assert.match(content, /@keyframes hoverLift/, "Must define @keyframes hoverLift");

  // Ascend Glass Utilities
  assert.match(content, /\.glass\s*\{/, "Must define .glass utility");
  assert.match(content, /\.glass-dark\s*\{/, "Must define .glass-dark utility");
  assert.match(content, /\.glass-card\s*\{/, "Must define .glass-card utility");
  assert.match(content, /\.glow-mint\s*\{/, "Must define .glow-mint utility");
  assert.match(content, /\.glow-primary\s*\{/, "Must define .glow-primary utility");
});

test("UI Components - Button incorporates Ascend primary gradient while preserving micro-interactions", () => {
  const btnPath = path.resolve(__dirname, "../src/components/ui/button.tsx");
  const content = fs.readFileSync(btnPath, "utf-8");

  assert.match(content, /bg-gradient-to-b (from-\[#1677FF\] to-\[#0B4DBB\]|from-primary to-primary-hover)/, "Primary button has gradient styling");
  assert.match(content, /(active:scale-\[0\.94\]|active:scale-\[0\.98\])/, "Active micro-interaction preserved");
  assert.match(content, /backdrop-blur-sm/, "Outline button has backdrop-blur-sm");
  assert.match(content, /bg-surface\/90/, "Outline button has bg-surface/90");
});

test("UI Components - Card supports glass prop and refined hover lift transitions", () => {
  const cardPath = path.resolve(__dirname, "../src/components/ui/card.tsx");
  const content = fs.readFileSync(cardPath, "utf-8");

  assert.match(content, /glass\?:\s*boolean/, "CardProps declares glass prop");
  assert.match(content, /backdrop-blur-md border-border\/80/, "Card glass mode applies backdrop-blur-md");
  assert.match(content, /hover:-translate-y-1 hover:shadow-lg/, "Hoverable mode lifts card smoothly");
});

test("UI Components - Input features updated focus ring, transitions, and offset", () => {
  const inputPath = path.resolve(__dirname, "../src/components/ui/input.tsx");
  const content = fs.readFileSync(inputPath, "utf-8");

  assert.match(content, /focus-visible:ring-offset-2/, "Input has focus ring offset");
  assert.match(content, /focus-visible:ring-primary\/70/, "Input has refined focus ring opacity");
  assert.match(content, /transition-all duration-200/, "Input transitions are smooth");
});

test("UI Components - Dialog, Drawer, Tabs, Toast, and EmptyState reflect Ascend refinement", () => {
  const dialogPath = path.resolve(__dirname, "../src/components/ui/dialog.tsx");
  const drawerPath = path.resolve(__dirname, "../src/components/ui/drawer.tsx");
  const tabsPath = path.resolve(__dirname, "../src/components/ui/tabs.tsx");
  const toastPath = path.resolve(__dirname, "../src/components/ui/toast.tsx");
  const emptyPath = path.resolve(__dirname, "../src/components/ui/empty-state.tsx");

  const dialogContent = fs.readFileSync(dialogPath, "utf-8");
  assert.match(dialogContent, /bg-black\/60/, "DialogOverlay has bg-black/60");
  assert.match(dialogContent, /backdrop-blur-md/, "DialogOverlay has backdrop-blur-md");
  assert.match(dialogContent, /backdrop-blur-xl/, "DialogContent enhanced to backdrop-blur-xl");
  assert.match(dialogContent, /shadow-2xl/, "DialogContent enhanced to shadow-2xl");

  const drawerContent = fs.readFileSync(drawerPath, "utf-8");
  assert.match(drawerContent, /bg-black\/50/, "DrawerOverlay has bg-black/50");
  assert.match(drawerContent, /backdrop-blur-md/, "DrawerOverlay has backdrop-blur-md");
  assert.match(drawerContent, /shadow-2xl/, "DrawerContent has shadow-2xl");
  assert.match(drawerContent, /duration-300/, "DrawerContent has duration-300 transition");

  const tabsContent = fs.readFileSync(tabsPath, "utf-8");
  assert.match(tabsContent, /data-\[state=active\]:bg-primary-subtle\/50/, "Tabs active indicator highlighted");

  const toastContent = fs.readFileSync(toastPath, "utf-8");
  assert.match(toastContent, /backdrop-blur-md/, "Toast has backdrop-blur-md");
  assert.match(toastContent, /bg-surface\/90/, "Toast has bg-surface/90");
  assert.match(toastContent, /shadow-lg/, "Toast has shadow-lg");

  const emptyContent = fs.readFileSync(emptyPath, "utf-8");
  assert.match(emptyContent, /backdrop-blur-xs/, "EmptyState icon box has backdrop-blur-xs");
  assert.match(emptyContent, /shadow-xs/, "EmptyState icon box has shadow-xs");
  assert.match(emptyContent, /border-border\/60/, "EmptyState icon box has border-border/60");
});

// =========================================================================
// 6. SHELL & AUTH FLOW INTEGRATION
// =========================================================================

test("Shell Integration - AuthShell integrates ParticleOcean with proper z-indexing", () => {
  const authShellPath = path.resolve(__dirname, "../src/components/shell/auth-shell.tsx");
  const content = fs.readFileSync(authShellPath, "utf-8");

  assert.match(content, /(<AuthAtmosphere intensity="subtle" \/>|<ParticleOcean className="fixed inset-0 z-0 pointer-events-none opacity-40" \/>)/, "AuthShell renders background");
  assert.match(content, /header className="relative z-10/, "Header positioned above particle ocean at z-10");
  assert.match(content, /main className="relative z-10/, "Main card positioned above particle ocean at z-10");
});

test("Shell Integration - PublicHeader and AppHeader display glassmorphism navbar", () => {
  const pubHeaderPath = path.resolve(__dirname, "../src/components/shell/public-header.tsx");
  const appHeaderPath = path.resolve(__dirname, "../src/components/shell/app-header.tsx");

  const pubContent = fs.readFileSync(pubHeaderPath, "utf-8");
  assert.match(pubContent, /bg-surface\/85/, "PublicHeader has bg-surface/85");
  assert.match(pubContent, /backdrop-blur-md/, "PublicHeader has backdrop-blur-md");
  assert.match(pubContent, /shadow-sm/, "PublicHeader has shadow-sm");

  const appContent = fs.readFileSync(appHeaderPath, "utf-8");
  assert.match(appContent, /bg-surface\/85/, "AppHeader has bg-surface/85");
  assert.match(appContent, /backdrop-blur-md/, "AppHeader has backdrop-blur-md");
  assert.match(appContent, /shadow-sm/, "AppHeader has shadow-sm");
});

test("Shell Integration - Sidebar and MobileNav feature refined active states and backdrop blur", () => {
  const sidebarPath = path.resolve(__dirname, "../src/components/shell/sidebar.tsx");
  const mobileNavPath = path.resolve(__dirname, "../src/components/shell/mobile-nav.tsx");

  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
  assert.match(sidebarContent, /bg-surface\/95 backdrop-blur-md/, "Sidebar has backdrop-blur-md");
  assert.match(sidebarContent, /shadow-xs shadow-primary\/20/, "Sidebar active item glow effect");

  const mobileNavContent = fs.readFileSync(mobileNavPath, "utf-8");
  assert.match(mobileNavContent, /bg-surface\/85 backdrop-blur-md/, "MobileNav has backdrop-blur-md");
  assert.match(mobileNavContent, /shadow-\[0_-4px_20px_rgba\(0,0,0,0\.06\)\]/, "MobileNav has glassmorphism and top shadow");
});

test("Pages - Login and Register forms render inside glass Card components", () => {
  const loginPath = path.resolve(__dirname, "../src/app/[locale]/(auth)/login/page.tsx");
  const registerPath = path.resolve(__dirname, "../src/app/[locale]/(auth)/register/page.tsx");

  const loginContent = fs.readFileSync(loginPath, "utf-8");
  assert.match(loginContent, /<Card glass className="w-full shadow-xl border-border\/80 backdrop-blur-xl">/, "Login form card uses glass prop");

  const registerContent = fs.readFileSync(registerPath, "utf-8");
  assert.match(registerContent, /<Card glass className="w-full shadow-xl border-border\/80 backdrop-blur-xl my-4">/, "Register form card uses glass prop");
});
