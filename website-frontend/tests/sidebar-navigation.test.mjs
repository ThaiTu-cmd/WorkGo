import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Sidebar Navigation - nav-config.ts defines complete items for CLIENT and PROVIDER", async () => {
  const navConfigPath = path.resolve(__dirname, "../src/components/shell/nav-config.ts");
  assert.ok(fs.existsSync(navConfigPath), "nav-config.ts must exist");

  const configModule = await import("../src/components/shell/nav-config.ts");
  assert.ok(Array.isArray(configModule.CLIENT_NAV_ITEMS), "CLIENT_NAV_ITEMS must be an array");
  assert.ok(Array.isArray(configModule.PROVIDER_NAV_ITEMS), "PROVIDER_NAV_ITEMS must be an array");

  const clientHrefs = configModule.CLIENT_NAV_ITEMS.map((item) => item.href);
  assert.ok(clientHrefs.includes("/client"), "CLIENT must have /client");
  assert.ok(clientHrefs.includes("/posts"), "CLIENT must have /posts");
  assert.ok(clientHrefs.includes("/client/posts"), "CLIENT must have /client/posts");
  assert.ok(clientHrefs.includes("/client/applications"), "CLIENT must have /client/applications");
  assert.ok(clientHrefs.includes("/wallet"), "CLIENT must have /wallet");
  assert.ok(clientHrefs.includes("/settings"), "CLIENT must have /settings");

  const providerHrefs = configModule.PROVIDER_NAV_ITEMS.map((item) => item.href);
  assert.ok(providerHrefs.includes("/provider"), "PROVIDER must have /provider");
  assert.ok(providerHrefs.includes("/posts"), "PROVIDER must have /posts");
  assert.ok(providerHrefs.includes("/settings?tab=provider"), "PROVIDER must have /settings?tab=provider");
  assert.ok(providerHrefs.includes("/wallet"), "PROVIDER must have /wallet");
  assert.ok(providerHrefs.includes("/settings"), "PROVIDER must have /settings");
});

test("Sidebar Navigation - sidebar.tsx supports collapsible mode, active indicator, and network widget", () => {
  const sidebarPath = path.resolve(__dirname, "../src/components/shell/sidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "sidebar.tsx must exist");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Collapsible support
  assert.match(content, /isCollapsed/, "sidebar.tsx must support isCollapsed property");
  assert.match(content, /workgo_sidebar_collapsed/, "sidebar.tsx must persist collapsed state in localStorage");
  assert.match(content, /ChevronLeft/, "sidebar.tsx must import ChevronLeft toggle icon");
  assert.match(content, /ChevronRight/, "sidebar.tsx must import ChevronRight toggle icon");

  // Active indicator line
  assert.match(
    content,
    /bg-primary/,
    "sidebar.tsx must render active indicator with brand primary color"
  );
  assert.match(
    content,
    /w-1\s+h-6\s+rounded-r\s+bg-primary/,
    "sidebar.tsx must render active indicator bar"
  );

  // Micro-bounce
  assert.match(
    content,
    /group-hover:scale-110/,
    "sidebar.tsx must include micro-bounce hover effect on icons"
  );

  // Network Status
  assert.match(
    content,
    /WorkGo Network/,
    "sidebar.tsx must include WorkGo Network status widget"
  );
});

test("Sidebar Navigation - AppShellClient integrates Header, Sidebar, MobileNav, and Drawer", () => {
  const shellPath = path.resolve(__dirname, "../src/components/shell/app-shell-client.tsx");
  assert.ok(fs.existsSync(shellPath), "app-shell-client.tsx must exist");
  const content = fs.readFileSync(shellPath, "utf-8");

  assert.match(content, /AppHeader/, "AppShellClient must render AppHeader");
  assert.match(content, /Sidebar/, "AppShellClient must render Sidebar");
  assert.match(content, /MobileNav/, "AppShellClient must render MobileNav");
  assert.match(content, /Drawer/, "AppShellClient must render Drawer for mobile menu");
  assert.match(content, /onOpenMobileMenu/, "AppShellClient must connect onOpenMobileMenu");
});

test("Sidebar Navigation - (public)/layout.tsx preserves Sidebar for authenticated users", () => {
  const publicLayoutPath = path.resolve(__dirname, "../src/app/[locale]/(public)/layout.tsx");
  const content = fs.readFileSync(publicLayoutPath, "utf-8");

  assert.match(
    content,
    /AppShellClient/,
    "(public)/layout.tsx must use AppShellClient for authenticated sessions"
  );
  assert.match(
    content,
    /session\.isAuthenticated/,
    "(public)/layout.tsx must check session.isAuthenticated"
  );
});
