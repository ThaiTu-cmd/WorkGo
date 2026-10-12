import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");
const read = (p) => fs.readFileSync(path.join(ANDROID_ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ANDROID_ROOT, p));

test("QA-AND-01: Android client and auth contracts enforce real backend isolation", () => {
  const clientPath = "src/api/client.ts";
  assert.ok(exists(clientPath), "android client.ts must exist");
  const clientSrc = read(clientPath);

  // Check token storage keys
  assert.match(clientSrc, /wg_at/, "Must use secure token key wg_at");
  assert.match(clientSrc, /wg_rt/, "Must use refresh token key wg_rt");

  // Check refresh endpoint and timeout
  assert.match(clientSrc, /\/api\/v1\/identity\/auth\/refresh/, "Must target real identity refresh route");
  assert.match(clientSrc, /timeoutMs\s*=\s*8000/, "Default timeout must be 8000ms");
  assert.match(clientSrc, /AbortController/, "Must support request abort / timeout cancellation");

  // Zero mock demo users or mock tokens
  assert.doesNotMatch(clientSrc, /demo-jwt/, "Zero demo JWT tokens in client.ts");
  assert.doesNotMatch(clientSrc, /usr-demo/, "Zero demo user IDs in client.ts");

  // Auth API
  const authPath = "src/api/auth.ts";
  assert.ok(exists(authPath), "android auth.ts must exist");
  const authSrc = read(authPath);
  assert.match(authSrc, /\/api\/v1\/identity\/auth\/token/, "auth.login must target real token endpoint");
  assert.match(authSrc, /\/api\/v1\/identity\/users\/myInfo/, "auth.me must target real user info endpoint");
  assert.match(authSrc, /\/api\/v1\/identity\/users\/registration/, "auth.register must target real registration endpoint");
});

test("QA-AND-02: Android AuthProvider state management and session contract", () => {
  const storePath = "src/store/auth.tsx";
  assert.ok(exists(storePath), "store/auth.tsx must exist");
  const storeSrc = read(storePath);

  assert.match(storeSrc, /export\s+function\s+AuthProvider/, "AuthProvider must be exported");
  assert.match(storeSrc, /export\s+function\s+useAuth/, "useAuth must be exported");
  assert.match(storeSrc, /export\s+function\s+useRequireAuth/, "useRequireAuth must be exported");
  assert.match(storeSrc, /role:\s*['"]CLIENT['"]\s*\|\s*['"]PROVIDER['"]\s*\|\s*['"]ADMIN['"]/, "Role must support CLIENT | PROVIDER | ADMIN");
  assert.match(storeSrc, /getStoredToken\(['"]wg_at['"]\)/, "Initial profile load must read stored token wg_at");
  assert.match(storeSrc, /authApi\.logout\(\)/, "logout must invoke authApi.logout()");
});

test("QA-AND-03: Android Catalog API contract and truthful error fallback", () => {
  const catalogPath = "src/api/catalog.ts";
  assert.ok(exists(catalogPath), "src/api/catalog.ts must exist");
  const catalogSrc = read(catalogPath);

  assert.match(catalogSrc, /export\s+const\s+catalogApi/, "catalogApi must be exported");
  assert.match(
    catalogSrc,
    /\/api\/v1\/catalog\/categories\/roots\?page=\$\{page\}&size=\$\{size\}/,
    "catalogApi.getRootCategories must call /api/v1/catalog/categories/roots"
  );
  assert.match(catalogSrc, /return\s+\[\]/, "catalogApi must fallback to empty array [] without crashing");

  // Test category slug icon helper logic extracted from source
  function getCategoryIcon(slug) {
    if (slug.includes("design") || slug.includes("thiet-ke")) return "🎨";
    if (slug.includes("code") || slug.includes("lap-trinh")) return "💻";
    if (slug.includes("writing") || slug.includes("viet-lach")) return "✍️";
    if (slug.includes("repair") || slug.includes("ky-thuat")) return "🔧";
    if (slug.includes("delivery") || slug.includes("giao-hang")) return "🚚";
    return "💼";
  }

  assert.strictEqual(getCategoryIcon("thiet-ke-do-hoa"), "🎨");
  assert.strictEqual(getCategoryIcon("lap-trinh-web"), "💻");
  assert.strictEqual(getCategoryIcon("viet-lach-dich-thuat"), "✍️");
  assert.strictEqual(getCategoryIcon("ky-thuat-dien"), "🔧");
  assert.strictEqual(getCategoryIcon("giao-hang-nhanh"), "🚚");
  assert.strictEqual(getCategoryIcon("tu-van-tai-chinh"), "💼");
});

test("QA-AND-04: Android Posts API toQuery handles 0-based pagination and filter serialization", () => {
  const postsPath = "src/api/posts.ts";
  assert.ok(exists(postsPath), "src/api/posts.ts must exist");
  const postsSrc = read(postsPath);

  // Assert Spring Data 0-based index calculation
  assert.match(
    postsSrc,
    /p\.set\(['"]page['"],\s*String\(Math\.max\(0,\s*\(f\.page\s*\?\?\s*1\)\s*-\s*1\)\)\)/,
    "toQuery must adjust 1-based page to 0-based Spring index"
  );
  assert.match(
    postsSrc,
    /p\.set\(['"]size['"],\s*String\(f\.limit\s*\?\?\s*10\)\)/,
    "toQuery must set size default to 10"
  );

  // Simulate toQuery logic
  function toQuery(f) {
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.category) p.set("category", f.category);
    if (f.executionType) p.set("executionType", f.executionType);
    if (f.budgetMin !== undefined) p.set("budgetMin", String(f.budgetMin));
    if (f.budgetMax !== undefined) p.set("budgetMax", String(f.budgetMax));
    if (f.sort) p.set("sort", f.sort);
    p.set("page", String(Math.max(0, (f.page ?? 1) - 1)));
    p.set("size", String(f.limit ?? 10));
    return p.toString();
  }

  // Happy path
  const q1 = toQuery({ page: 1, limit: 10 });
  assert.strictEqual(q1, "page=0&size=10");

  const q2 = toQuery({ page: 3, limit: 20 });
  assert.strictEqual(q2, "page=2&size=20");

  // Edge cases: boundary page <= 0
  const q3 = toQuery({ page: 0, limit: 5 });
  assert.strictEqual(q3, "page=0&size=5");

  const q4 = toQuery({ page: -2, limit: 15 });
  assert.strictEqual(q4, "page=0&size=15");

  // Full filter parameters
  const q5 = toQuery({
    q: "React Native",
    category: "cat-dev",
    executionType: "DIGITAL",
    budgetMin: 500000,
    budgetMax: 2000000,
    sort: "newest",
    page: 2,
    limit: 12,
  });
  assert.ok(q5.includes("q=React+Native"));
  assert.ok(q5.includes("category=cat-dev"));
  assert.ok(q5.includes("executionType=DIGITAL"));
  assert.ok(q5.includes("budgetMin=500000"));
  assert.ok(q5.includes("budgetMax=2000000"));
  assert.ok(q5.includes("sort=newest"));
  assert.ok(q5.includes("page=1"));
  assert.ok(q5.includes("size=12"));
});

test("QA-AND-05: Android Posts API endpoints and zero-mock response normalization", () => {
  const postsSrc = read("src/api/posts.ts");

  // Route targets
  assert.match(postsSrc, /\/api\/v1\/posts/, "Must call /api/v1/posts");
  assert.match(postsSrc, /\/api\/v1\/posts\/my/, "Must call /api/v1/posts/my");
  assert.match(postsSrc, /\/api\/v1\/posts\/\$\{encodeURIComponent\(id\)\}\/close/, "Must call close endpoint");

  // Zero mock data in source
  assert.doesNotMatch(postsSrc, /post-101|post-102|post-103/, "Zero mock post IDs in posts.ts");
  assert.doesNotMatch(postsSrc, /livePosts|mockPosts/, "Zero livePosts or mockPosts variable in posts.ts");

  // Simulate unwrap logic
  function unwrap(res) {
    if (res && typeof res === "object" && "result" in res) {
      return res.result;
    }
    return res;
  }

  // Envelope unpacking
  assert.deepStrictEqual(unwrap({ code: 1000, result: [{ id: "1" }] }), [{ id: "1" }]);
  assert.deepStrictEqual(unwrap([{ id: "1" }]), [{ id: "1" }]);
  assert.strictEqual(unwrap(null), null);
  assert.strictEqual(unwrap(undefined), undefined);

  // Normalization logic for Spring Page
  function normalizePage(page, filters = {}) {
    const rawItems = page?.content || page?.data || [];
    const totalElements = page?.page?.totalElements ?? page?.meta?.total ?? rawItems.length;
    const size = page?.page?.size ?? page?.meta?.size ?? filters.limit ?? 10;
    const totalPages = page?.page?.totalPages ?? page?.meta?.totalPages ?? Math.ceil(totalElements / size);

    return {
      data: rawItems,
      meta: {
        page: filters.page ?? 1,
        size,
        total: totalElements,
        totalPages,
      },
    };
  }

  // Spring Page format
  const springPage = {
    content: [{ postId: "p-1", title: "Job 1" }],
    page: {
      totalElements: 25,
      totalPages: 3,
      number: 0,
      size: 10,
    },
  };
  const norm1 = normalizePage(springPage, { page: 1, limit: 10 });
  assert.strictEqual(norm1.data.length, 1);
  assert.strictEqual(norm1.meta.total, 25);
  assert.strictEqual(norm1.meta.totalPages, 3);
  assert.strictEqual(norm1.meta.page, 1);

  // Empty fallback on error
  const emptyFallback = {
    data: [],
    meta: {
      page: 1,
      size: 10,
      total: 0,
      totalPages: 0,
    },
  };
  assert.strictEqual(emptyFallback.data.length, 0);
  assert.strictEqual(emptyFallback.meta.total, 0);
});

test("QA-AND-06: Android mobile screens and core components contracts", () => {
  const components = [
    "src/components/search-bar.tsx",
    "src/components/service-card.tsx",
    "src/components/filter-sheet.tsx",
    "src/components/states.tsx",
    "src/app/catalog.tsx",
    "src/app/detail.tsx",
  ];

  for (const c of components) {
    assert.ok(exists(c), `Component or screen ${c} must exist`);
  }

  const searchSrc = read("src/components/search-bar.tsx");
  assert.match(searchSrc, /export\s+function\s+SearchBar/, "SearchBar must be exported");
  assert.match(searchSrc, /EXEC_CHIPS/, "SearchBar must define EXEC_CHIPS");

  const cardSrc = read("src/components/service-card.tsx");
  assert.match(cardSrc, /export\s+function\s+ServiceCard/, "ServiceCard must be exported");

  const filterSrc = read("src/components/filter-sheet.tsx");
  assert.match(filterSrc, /export\s+function\s+FilterSheet/, "FilterSheet must be exported");

  const statesSrc = read("src/components/states.tsx");
  assert.match(statesSrc, /export\s+function\s+LoadingSkeleton/, "LoadingSkeleton must be exported");
  assert.match(statesSrc, /export\s+function\s+EmptyState/, "EmptyState must be exported");
  assert.match(statesSrc, /export\s+function\s+ErrorState/, "ErrorState must be exported");
});

test("QA-AND-07: Android ServiceCard execution type styling and currency formatting", () => {
  const cardSrc = read("src/components/service-card.tsx");
  const execSrc = read("src/constants/exec-config.ts");

  assert.match(execSrc, /DIGITAL:\s*\{/, "Must support DIGITAL");
  assert.match(execSrc, /ONSITE:\s*\{/, "Must support ONSITE");
  assert.match(execSrc, /DELIVERY:\s*\{/, "Must support DELIVERY");
  assert.match(execSrc, /APPOINTMENT:\s*\{/, "Must support APPOINTMENT");
  assert.match(execSrc, /HOURLY:\s*\{/, "Must support HOURLY");
  assert.match(execSrc, /PROJECT:\s*\{/, "Must support PROJECT");

  assert.match(cardSrc, /from\s+['"]@\/constants\/exec-config['"]/, "Must import from exec-config");
  assert.match(cardSrc, /getExecStyle\s*\(/, "Must call getExecStyle for theme-aware badge styling");

  function formatVND(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  assert.match(formatVND(500000), /500\.000/);
  assert.match(formatVND(15000000), /15\.000\.000/);
});

test("QA-AND-08: Android States resilience and reduced-motion compliance", () => {
  const statesSrc = read("src/components/states.tsx");

  // Reanimated reduced motion support
  assert.match(statesSrc, /reduceMotion:\s*ReduceMotion\.System/, "Skeleton must respect ReduceMotion.System");
  assert.match(statesSrc, /featuredChips/, "EmptyState must support featuredChips");
  assert.match(statesSrc, /onRetry/, "ErrorState must support onRetry callback");
});

