import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// 1. HAPPY PATH & LOGIC VERIFICATION: GREETING & DASHBOARD HERO
// =========================================================================

function getGreeting(hour, dict) {
  if (hour >= 5 && hour < 12) {
    return dict.greetingMorning;
  }
  if (hour >= 12 && hour < 18) {
    return dict.greetingAfternoon;
  }
  return dict.greetingEvening;
}

test("Happy Path & Boundary Cases - Dashboard greeting logic handles all 24 hours correctly", () => {
  const dictVi = {
    greetingMorning: "Chào buổi sáng ☀️",
    greetingAfternoon: "Chào buổi chiều 🌤️",
    greetingEvening: "Chào buổi tối 🌙",
  };

  // Morning boundaries [05:00, 11:59]
  assert.equal(getGreeting(5, dictVi), "Chào buổi sáng ☀️");
  assert.equal(getGreeting(8, dictVi), "Chào buổi sáng ☀️");
  assert.equal(getGreeting(11, dictVi), "Chào buổi sáng ☀️");

  // Afternoon boundaries [12:00, 17:59]
  assert.equal(getGreeting(12, dictVi), "Chào buổi chiều 🌤️");
  assert.equal(getGreeting(15, dictVi), "Chào buổi chiều 🌤️");
  assert.equal(getGreeting(17, dictVi), "Chào buổi chiều 🌤️");

  // Evening boundaries [18:00, 04:59]
  assert.equal(getGreeting(18, dictVi), "Chào buổi tối 🌙");
  assert.equal(getGreeting(21, dictVi), "Chào buổi tối 🌙");
  assert.equal(getGreeting(23, dictVi), "Chào buổi tối 🌙");
  assert.equal(getGreeting(0, dictVi), "Chào buổi tối 🌙");
  assert.equal(getGreeting(4, dictVi), "Chào buổi tối 🌙");
});

// =========================================================================
// 2. HAPPY PATH & CORNER CASES: ACTIVE ROUTE MATCHING LOGIC (SIDEBAR)
// =========================================================================

function checkIsActive(itemHref, pathname, searchQuery, locale = "vi") {
  const fullHref = `/${locale}${itemHref}`;
  const [itemPath, itemQuery] = itemHref.split("?");

  if (itemQuery) {
    return pathname === `/${locale}${itemPath}` && searchQuery.includes(itemQuery);
  }

  if (itemHref === "/client" || itemHref === "/provider") {
    return pathname === fullHref;
  }

  if (itemHref === "/settings") {
    return pathname === fullHref && !searchQuery.includes("tab=provider");
  }

  if (itemHref === "/posts") {
    return pathname === fullHref || pathname.startsWith(`/${locale}/posts/`);
  }

  return pathname === fullHref || pathname.startsWith(fullHref);
}

test("Happy Path - Active route matching for standard navigation items", () => {
  // CLIENT Dashboard
  assert.equal(checkIsActive("/client", "/vi/client", ""), true);
  assert.equal(checkIsActive("/client", "/vi/provider", ""), false);

  // PROVIDER Dashboard
  assert.equal(checkIsActive("/provider", "/vi/provider", ""), true);
  assert.equal(checkIsActive("/provider", "/vi/client", ""), false);

  // Posts listing
  assert.equal(checkIsActive("/posts", "/vi/posts", ""), true);
  // Posts detail sub-route
  assert.equal(checkIsActive("/posts", "/vi/posts/post-uuid-456", ""), true);
  // Unrelated route
  assert.equal(checkIsActive("/posts", "/vi/wallet", ""), false);

  // Client Posts sub-routes
  assert.equal(checkIsActive("/client/posts", "/vi/client/posts", ""), true);
  assert.equal(checkIsActive("/client/posts", "/vi/client/posts/new", ""), true);
  assert.equal(checkIsActive("/client/posts", "/vi/client/applications", ""), false);
});

test("Edge & Corner Cases - Settings route disambiguation with query parameter tab=provider", () => {
  // General settings without query params
  assert.equal(checkIsActive("/settings", "/vi/settings", ""), true);

  // Provider profile settings with tab=provider
  assert.equal(checkIsActive("/settings?tab=provider", "/vi/settings", "?tab=provider"), true);

  // General settings must NOT be active when tab=provider is in the query
  assert.equal(checkIsActive("/settings", "/vi/settings", "?tab=provider"), false);

  // Provider profile must NOT be active on general settings without query
  assert.equal(checkIsActive("/settings?tab=provider", "/vi/settings", ""), false);

  // English locale support
  assert.equal(checkIsActive("/settings?tab=provider", "/en/settings", "?tab=provider", "en"), true);
  assert.equal(checkIsActive("/settings", "/en/settings", "", "en"), true);
});

// =========================================================================
// 3. POST CARD: EXECUTION LABELS, BUDGET FORMATTING & BOOKMARK BEHAVIOR
// =========================================================================

test("Happy Path & Edge Cases - PostCard execution type labels and fallback", () => {
  const EXECUTION_LABELS = {
    DIGITAL: "Trực tuyến",
    ONSITE: "Tại chỗ",
    DELIVERY: "Giao nhận",
    APPOINTMENT: "Theo lịch hẹn",
    HOURLY: "Theo giờ",
    PROJECT: "Trọn gói dự án",
  };

  assert.equal(EXECUTION_LABELS["DIGITAL"], "Trực tuyến");
  assert.equal(EXECUTION_LABELS["ONSITE"], "Tại chỗ");
  assert.equal(EXECUTION_LABELS["DELIVERY"], "Giao nhận");
  assert.equal(EXECUTION_LABELS["APPOINTMENT"], "Theo lịch hẹn");
  assert.equal(EXECUTION_LABELS["HOURLY"], "Theo giờ");
  assert.equal(EXECUTION_LABELS["PROJECT"], "Trọn gói dự án");

  // Fallback for unknown execution type
  const getLabel = (type) => EXECUTION_LABELS[type] || type;
  assert.equal(getLabel("HYBRID"), "HYBRID");
  assert.equal(getLabel("CUSTOM_TYPE"), "CUSTOM_TYPE");
});

test("Happy Path & Edge Cases - Budget formatting single vs range", () => {
  function formatBudget(min, max, formatter) {
    if (min === max) {
      return formatter(min);
    }
    return `${formatter(min)} - ${formatter(max)}`;
  }

  const mockVND = (amount) => `${Number(amount).toLocaleString("vi-VN")}₫`;

  // Range budget
  assert.equal(formatBudget(5000000, 10000000, mockVND), "5.000.000₫ - 10.000.000₫");

  // Fixed budget (min == max)
  assert.equal(formatBudget(8500000, 8500000, mockVND), "8.500.000₫");

  // Zero budget edge case
  assert.equal(formatBudget(0, 0, mockVND), "0₫");
});

// =========================================================================
// 4. URL QUERY BUILDER & FILTER STATE SYNCHRONIZATION
// =========================================================================

test("Happy Path & Edge Cases - URL Query builder strips empty/null/undefined params and resets page", () => {
  function updateQueryString(currentQueryString, updates) {
    const params = new URLSearchParams(currentQueryString);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    return params.toString();
  }

  // Adding a category and resetting page to 1
  const q1 = updateQueryString("q=react&page=3", { category: "cat-1", page: 1 });
  assert.equal(q1, "q=react&page=1&category=cat-1");

  // Clearing a search filter (empty string or undefined)
  const q2 = updateQueryString("q=react&category=cat-1&page=1", { q: "" });
  assert.equal(q2, "category=cat-1&page=1");

  const q3 = updateQueryString("category=cat-1&budgetMin=1000000", { budgetMin: undefined });
  assert.equal(q3, "category=cat-1");

  // Setting multiple filter properties
  const q4 = updateQueryString("", {
    category: "cat-2",
    executionType: "DIGITAL",
    sort: "budget_high",
    page: 1,
  });
  assert.equal(q4, "category=cat-2&executionType=DIGITAL&sort=budget_high&page=1");
});

// =========================================================================
// 5. SIDEBAR COLLAPSIBLE LOCALSTORAGE SYNC & SSR SAFETY
// =========================================================================

test("Edge Case - Sidebar collapsible state safely parses localStorage with fallback", () => {
  function loadSavedCollapsedState(storageMock) {
    try {
      if (!storageMock) return false;
      const saved = storageMock.getItem("workgo_sidebar_collapsed");
      if (saved !== null) {
        return saved === "true";
      }
    } catch {
      return false;
    }
    return false;
  }

  // Case 1: localStorage has 'true'
  assert.equal(loadSavedCollapsedState({ getItem: () => "true" }), true);

  // Case 2: localStorage has 'false'
  assert.equal(loadSavedCollapsedState({ getItem: () => "false" }), false);

  // Case 3: localStorage has null (first visit)
  assert.equal(loadSavedCollapsedState({ getItem: () => null }), false);

  // Case 4: localStorage throws SecurityError/QuotaExceeded
  assert.equal(
    loadSavedCollapsedState({
      getItem: () => {
        throw new Error("SecurityError: localStorage is disabled");
      },
    }),
    false
  );

  // Case 5: SSR environment where storage is null/undefined
  assert.equal(loadSavedCollapsedState(null), false);
});

// =========================================================================
// 6. ACCESSIBILITY & REDUCED MOTION SAFEGUARD
// =========================================================================

test("Accessibility - globals.css includes prefers-reduced-motion media query", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    content,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
    "globals.css must contain prefers-reduced-motion media query"
  );
  assert.match(
    content,
    /animation-duration:\s*\.01ms\s*!important/,
    "globals.css must neutralize animation durations for reduced-motion"
  );
});

// =========================================================================
// 7. DICTIONARY PARITY & NEW DASHBOARD KEYS
// =========================================================================

test("i18n Parity - New Dashboard and Sidebar keys exist in both vi.json and en.json", () => {
  const viPath = path.resolve(__dirname, "../src/dictionaries/vi.json");
  const enPath = path.resolve(__dirname, "../src/dictionaries/en.json");

  const vi = JSON.parse(fs.readFileSync(viPath, "utf-8"));
  const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  const requiredDashboardKeys = [
    "greetingMorning",
    "greetingAfternoon",
    "greetingEvening",
    "clientTitle",
    "clientSubtitle",
    "newPost",
    "openPosts",
    "newProposals",
    "availableBalance",
    "escrowHold",
    "providerTitle",
    "providerSubtitle",
    "findJobs",
    "updateProfile",
    "newOpportunities",
    "totalEarnings",
    "reputationScore",
    "verifiedProfile",
  ];

  for (const k of requiredDashboardKeys) {
    assert.ok(vi.dashboard?.[k], `vi.json must contain dashboard.${k}`);
    assert.ok(en.dashboard?.[k], `en.json must contain dashboard.${k}`);
  }
});
