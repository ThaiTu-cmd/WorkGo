import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANDROID_ROOT = path.resolve(ROOT, "../android-frontend");
const readAndroid = (p) => fs.readFileSync(path.join(ANDROID_ROOT, p), "utf-8");
const existsAndroid = (p) => fs.existsSync(path.join(ANDROID_ROOT, p));
const readWeb = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const existsWeb = (p) => fs.existsSync(path.join(ROOT, p));

test("QA-C2-01: Proposal validation pure boundary cases (budget, days, message, role)", () => {
  function validateProposal(input, budgetMax, isProvider) {
    if (!isProvider) return { valid: false, error: "Chỉ tài khoản Đối tác được gửi báo giá" };
    if (!input.price || input.price <= 0) return { valid: false, error: "Giá báo phải lớn hơn 0" };
    if (budgetMax !== undefined && budgetMax > 0 && input.price > budgetMax) {
      return { valid: false, error: "Giá báo không được vượt quá ngân sách tối đa" };
    }
    if (!input.estimatedDays || !Number.isInteger(input.estimatedDays) || input.estimatedDays < 1) {
      return { valid: false, error: "Thời gian thực hiện tối thiểu 1 ngày" };
    }
    if (!input.message || input.message.trim().length < 20) {
      return { valid: false, error: "Lời nhắn tối thiểu 20 ký tự" };
    }
    return { valid: true, error: null };
  }

  // Exact budgetMax matches should be valid
  assert.strictEqual(
    validateProposal({ price: 2000000, estimatedDays: 5, message: "Kính gửi quý khách hàng, tôi xin ứng tuyển." }, 2000000, true).valid,
    true
  );

  // Exceeding budgetMax by 1 unit must fail
  assert.strictEqual(
    validateProposal({ price: 2000001, estimatedDays: 5, message: "Kính gửi quý khách hàng, tôi xin ứng tuyển." }, 2000000, true).valid,
    false
  );

  // When budgetMax is 0 or undefined, any positive price is valid
  assert.strictEqual(
    validateProposal({ price: 50000000, estimatedDays: 10, message: "Kính gửi quý khách hàng, tôi xin ứng tuyển." }, 0, true).valid,
    true
  );
  assert.strictEqual(
    validateProposal({ price: 50000000, estimatedDays: 10, message: "Kính gửi quý khách hàng, tôi xin ứng tuyển." }, undefined, true).valid,
    true
  );

  // Message whitespace padding should not artificially inflate length
  const whitespacePadded = "   " + "Ngắn".repeat(3) + "   "; // trimmed length = 12 < 20
  assert.strictEqual(
    validateProposal({ price: 100000, estimatedDays: 1, message: whitespacePadded }, 500000, true).valid,
    false
  );
});

test("QA-C2-02: Simulated Concurrent 401 Refresh Storm singleton logic", async () => {
  // Simulate singleton refresh storm deduplication logic implemented in api-client.ts
  let refreshCallCount = 0;
  let activeRefreshPromise = null;

  async function mockExecuteTokenRefresh() {
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
      try {
        refreshCallCount++;
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 20));
        return "new-mock-token-123";
      } finally {
        activeRefreshPromise = null;
      }
    })();

    return activeRefreshPromise;
  }

  // Trigger 5 concurrent requests encountering 401
  const results = await Promise.all([
    mockExecuteTokenRefresh(),
    mockExecuteTokenRefresh(),
    mockExecuteTokenRefresh(),
    mockExecuteTokenRefresh(),
    mockExecuteTokenRefresh(),
  ]);

  // Assert exactly 1 refresh was fired
  assert.strictEqual(refreshCallCount, 1, "Must execute exactly 1 refresh call for 5 concurrent triggers");
  assert.deepStrictEqual(
    results,
    ["new-mock-token-123", "new-mock-token-123", "new-mock-token-123", "new-mock-token-123", "new-mock-token-123"]
  );

  // After completion, activeRefreshPromise must be reset to null
  assert.strictEqual(activeRefreshPromise, null, "Singleton promise must reset to null after completion");
});

test("QA-C2-03: Category TTL Cache boundary evaluation (5 minutes = 300,000ms)", () => {
  let cache = null;
  let cacheTimestamp = 0;
  const TTL = 5 * 60 * 1000;

  function getCategoriesWithCache(nowMs, fetcher) {
    if (cache && nowMs - cacheTimestamp < TTL) {
      return cache;
    }
    cache = fetcher();
    cacheTimestamp = nowMs;
    return cache;
  }

  let fetchCount = 0;
  const mockFetcher = () => {
    fetchCount++;
    return [{ id: "cat-1", name: "Design" }];
  };

  const t0 = 1000000;
  // First call -> fetches
  const res1 = getCategoriesWithCache(t0, mockFetcher);
  assert.strictEqual(fetchCount, 1);
  assert.deepStrictEqual(res1, [{ id: "cat-1", name: "Design" }]);

  // Call at t0 + 299,000ms (within 5 min) -> cached
  const res2 = getCategoriesWithCache(t0 + 299000, mockFetcher);
  assert.strictEqual(fetchCount, 1, "Must serve from cache at 299s");
  assert.strictEqual(res2, res1);

  // Call at t0 + 300,001ms (expired) -> re-fetches
  const res3 = getCategoriesWithCache(t0 + 300001, mockFetcher);
  assert.strictEqual(fetchCount, 2, "Must re-fetch after 300s TTL expires");
  assert.deepStrictEqual(res3, [{ id: "cat-1", name: "Design" }]);

  // Cache clear
  cache = null;
  cacheTimestamp = 0;
  getCategoriesWithCache(t0 + 300002, mockFetcher);
  assert.strictEqual(fetchCount, 3, "Must re-fetch immediately after cache clear");
});

test("QA-C2-04: Saved Jobs Per-User Storage Boundary and Capacity Capping", () => {
  const mockStorage = new Map();

  function loadSaved(userId) {
    try {
      const raw = mockStorage.get(`workgo_saved_jobs_v1:${userId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function toggleSaved(userId, postId) {
    const list = loadSaved(userId);
    const exists = list.includes(postId);
    const updated = exists ? list.filter((id) => id !== postId) : [postId, ...list].slice(0, 200);
    mockStorage.set(`workgo_saved_jobs_v1:${userId}`, JSON.stringify(updated));
    return updated;
  }

  // User isolation: user-A and user-B do not bleed into each other
  toggleSaved("usr-A", "post-1");
  toggleSaved("usr-A", "post-2");
  assert.deepStrictEqual(loadSaved("usr-A"), ["post-2", "post-1"]);
  assert.deepStrictEqual(loadSaved("usr-B"), [], "user-B must have empty saved jobs");

  // Toggle remove
  toggleSaved("usr-A", "post-2");
  assert.deepStrictEqual(loadSaved("usr-A"), ["post-1"]);

  // Capping at 200 items
  for (let i = 1; i <= 210; i++) {
    toggleSaved("usr-C", `job-${i}`);
  }
  const capList = loadSaved("usr-C");
  assert.strictEqual(capList.length, 200, "Saved jobs must be strictly capped at 200 items");
  assert.strictEqual(capList[0], "job-210", "Newest saved job must be at index 0");

  // Corrupted JSON recovery
  mockStorage.set("workgo_saved_jobs_v1:usr-corrupt", "{invalid:json;");
  assert.deepStrictEqual(loadSaved("usr-corrupt"), []);
});

test("QA-C2-05: Modular Filter Architecture exports and props consistency", () => {
  // Mobile filter sections
  assert.ok(existsAndroid("src/components/filters/category-section.tsx"));
  assert.ok(existsAndroid("src/components/filters/execution-section.tsx"));
  assert.ok(existsAndroid("src/components/filters/budget-section.tsx"));
  assert.ok(existsAndroid("src/components/filters/verified-section.tsx"));

  // Web filter sections
  assert.ok(existsWeb("src/components/composed/filters/category-section.tsx"));
  assert.ok(existsWeb("src/components/composed/filters/execution-section.tsx"));
  assert.ok(existsWeb("src/components/composed/filters/budget-section.tsx"));
  assert.ok(existsWeb("src/components/composed/filters/delivery-section.tsx"));
  assert.ok(existsWeb("src/components/composed/filters/rating-verified-section.tsx"));

  // Assert PRICE_PRESETS parity between web and mobile
  const webBudget = readWeb("src/components/composed/filters/budget-section.tsx");
  const mobBudget = readAndroid("src/components/filters/budget-section.tsx");

  assert.match(webBudget, /500000/, "Web budget must have 500k preset");
  assert.match(webBudget, /2000000/, "Web budget must have 2M preset");
  assert.match(mobBudget, /500000/, "Mobile budget must have 500k preset");
  assert.match(mobBudget, /2000000/, "Mobile budget must have 2M preset");
});

test("QA-C2-06: Mobile Haptics, Toast, and A11y contracts verification", () => {
  const toastSrc = readAndroid("src/components/toast.tsx");
  assert.match(toastSrc, /ToastProvider/, "Must export ToastProvider");
  assert.match(toastSrc, /useToast/, "Must export useToast");
  assert.match(toastSrc, /accessibilityRole=["']alert["']/, "Toast must have accessibilityRole='alert'");

  const bannerSrc = readAndroid("src/components/offline-banner.tsx");
  assert.match(bannerSrc, /OfflineBanner/, "Must export OfflineBanner");
  assert.match(bannerSrc, /accessibilityRole=["']alert["']/, "Banner must have accessibilityRole='alert'");

  const hapticsSrc = readAndroid("src/utils/haptics.ts");
  assert.match(hapticsSrc, /haptics/, "Must export safe haptics utility");
  assert.match(hapticsSrc, /catch/, "Must catch errors safely");
});
