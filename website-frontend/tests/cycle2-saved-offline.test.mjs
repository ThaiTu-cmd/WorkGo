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

// ==========================================
// C2-9: SAVED JOBS STORE & SCREENS
// ==========================================

test("C2-9 / SAVED-01: Web saved-store.ts exports loadSaved, toggleSaved, isSaved with per-user key", async () => {
  assert.ok(existsWeb("src/lib/saved-store.ts"), "saved-store.ts must exist");
  const { SAVED_KEY_PREFIX, loadSaved, toggleSaved, isSaved } = await import("../src/lib/saved-store.ts");

  assert.strictEqual(SAVED_KEY_PREFIX, "workgo_saved_jobs_v1:");
  assert.strictEqual(typeof loadSaved, "function");
  assert.strictEqual(typeof toggleSaved, "function");
  assert.strictEqual(typeof isSaved, "function");

  // In Node environment (no window), safely returns empty / false
  assert.deepStrictEqual(loadSaved("user-1"), []);
  assert.strictEqual(isSaved("user-1", "post-100"), false);
});

test("C2-9 / SAVED-02: Web saved-store.ts logic handles corrupt JSON and capping", () => {
  const src = readWeb("src/lib/saved-store.ts");
  assert.match(src, /JSON\.parse/, "Must parse JSON from storage");
  assert.match(src, /catch/, "Must catch corrupted JSON without crashing");
  assert.match(src, /200/, "Must cap saved items at 200");
  assert.match(src, /filter/, "Must support un-saving via filter");
});

test("C2-9 / SAVED-03: Mobile store/saved.tsx exists and uses AsyncStorage with per-user key", () => {
  assert.ok(existsAndroid("src/store/saved.tsx"), "src/store/saved.tsx must exist");
  const src = readAndroid("src/store/saved.tsx");
  assert.match(src, /export\s+const\s+SAVED_KEY_PREFIX\s*=\s*['"]workgo_saved_jobs_v1:['"]/, "Must define SAVED_KEY_PREFIX");
  assert.match(src, /AsyncStorage/, "Must use AsyncStorage");
  assert.match(src, /export\s+function\s+SavedJobsProvider/, "Must export SavedJobsProvider");
  assert.match(src, /export\s+function\s+useSavedJobs/, "Must export useSavedJobs");
});

test("C2-9 / SAVED-04: Mobile (tabs)/saved.tsx renders EmptyState with 'Chưa lưu việc nào'", () => {
  assert.ok(existsAndroid("src/app/(tabs)/saved.tsx"), "src/app/(tabs)/saved.tsx must exist");
  const src = readAndroid("src/app/(tabs)/saved.tsx");
  assert.match(src, /Chưa lưu việc nào/, "Must show empty state message");
  assert.match(src, /useSavedJobs/, "Must consume useSavedJobs");
  assert.match(src, /postsApi\.get/, "Must fetch posts by id");
});

// ==========================================
// C2-9: MY POSTS CLIENT SCREEN
// ==========================================

test("C2-9 / MYPOST-01: Mobile (tabs)/my-posts.tsx calls getMyPosts and close", () => {
  assert.ok(existsAndroid("src/app/(tabs)/my-posts.tsx"), "src/app/(tabs)/my-posts.tsx must exist");
  const src = readAndroid("src/app/(tabs)/my-posts.tsx");
  assert.match(src, /postsApi\s*\.\s*getMyPosts/, "Must call getMyPosts");
  assert.match(src, /postsApi\s*\.\s*close/, "Must call postsApi.close");
  assert.match(src, /formatVND/, "Must use formatVND");
});

test("C2-9 / MYPOST-02: Mobile (tabs)/my-posts.tsx prompts confirm before closing post", () => {
  const src = readAndroid("src/app/(tabs)/my-posts.tsx");
  assert.match(src, /Alert\.alert/, "Must prompt confirmation alert");
  assert.match(src, /Xác nhận đóng tin/, "Alert title must be 'Xác nhận đóng tin'");
});

test("C2-9 / MYPOST-03: Mobile (tabs)/_layout.tsx configures saved and my-posts tabs", () => {
  const src = readAndroid("src/app/(tabs)/_layout.tsx");
  assert.match(src, /name=["']saved["']/, "Must register saved tab");
  assert.match(src, /name=["']my-posts["']/, "Must register my-posts tab");
  assert.match(src, /useAuth/, "Must consume useAuth");
});

// ==========================================
// C2-10: FORMAT UTILITY PARITY & DEDUPLICATION
// ==========================================

test("C2-10 / FORMAT-01: Mobile utils/format.ts exports VND_PER_USD, formatVND, formatPriceVND", async () => {
  assert.ok(existsAndroid("src/utils/format.ts"), "src/utils/format.ts must exist");
  const src = readAndroid("src/utils/format.ts");
  assert.match(src, /export\s+const\s+VND_PER_USD\s*=\s*25000/, "VND_PER_USD must equal 25000");
  assert.match(src, /export\s+function\s+formatVND/, "Must export formatVND");
  assert.match(src, /export\s+function\s+formatPriceVND/, "Must export formatPriceVND");
});

test("C2-10 / FORMAT-02: Mobile detail.tsx and service-card.tsx do not have inline Intl.NumberFormat", () => {
  const detailSrc = readAndroid("src/app/detail.tsx");
  const cardSrc = readAndroid("src/components/service-card.tsx");

  assert.doesNotMatch(detailSrc, /new\s+Intl\.NumberFormat/, "detail.tsx must import formatVND from utils");
  assert.doesNotMatch(cardSrc, /new\s+Intl\.NumberFormat/, "service-card.tsx must import formatVND from utils");
});

// ==========================================
// C2-11: DICTIONARY PARITY HARD GATE
// ==========================================

test("C2-11 / DICT-01: Dict keys for saved, toast, offline, myPosts, proposal exist in both locales", () => {
  const vi = JSON.parse(readWeb("src/dictionaries/vi.json"));
  const en = JSON.parse(readWeb("src/dictionaries/en.json"));

  const requiredSections = ["saved", "toast", "offline", "myPosts", "proposal"];
  for (const sec of requiredSections) {
    assert.ok(vi[sec], `vi.json must have section ${sec}`);
    assert.ok(en[sec], `en.json must have section ${sec}`);
  }

  // Check specific keys
  assert.ok(vi.saved.title && en.saved.title);
  assert.ok(vi.saved.empty && en.saved.empty);
  assert.ok(vi.toast.saved && en.toast.saved);
  assert.ok(vi.toast.submitted && en.toast.submitted);
  assert.ok(vi.offline.banner && en.offline.banner);
  assert.ok(vi.myPosts.title && en.myPosts.title);
  assert.ok(vi.proposal.bidAmount && en.proposal.bidAmount);
  assert.ok(vi.proposal.duplicate && en.proposal.duplicate);
});

// ==========================================
// C2-12: CONCURRENT 401 REFRESH STORM SINGLETON
// ==========================================

test("C2-12 / REFRESH-01: Web api-client.ts defines executeTokenRefresh singleton promise", () => {
  const src = readWeb("src/lib/api-client.ts");
  assert.match(src, /let\s+webRefreshPromise/, "Must declare webRefreshPromise singleton");
  assert.match(src, /executeTokenRefresh/, "Must define executeTokenRefresh helper");
  assert.match(src, /\/api\/auth\/refresh/, "Must call /api/auth/refresh");
});
