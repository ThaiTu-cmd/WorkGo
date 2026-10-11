import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("QA Zero-Mock & Account Isolation - Comprehensive Test Suite", () => {
  // ==========================================
  // SECTION 1: HAPPY PATH SCENARIOS
  // ==========================================
  describe("Happy Path Scenarios", () => {
    it("HP-01: postsApi.getMyPosts uses /posts/my endpoint and defaults to empty array for new accounts", () => {
      const src = read("src/lib/adapters/posts.ts");
      assert.match(src, /backendRoutes\.posts\.my/, "Must reference backendRoutes.posts.my");
      assert.match(src, /getMyPosts\(token\?: string\):\s*Promise<PostItem\[\]>/, "Must accept optional token parameter");
      assert.match(src, /return unwrap\(res\) \?\? \[\];/, "Must default safely to empty array when result is empty");
    });

    it("HP-02: postsApi.list constructs correct 0-based page query and normalizes 1-based page metadata", () => {
      const src = read("src/lib/adapters/posts.ts");
      assert.match(src, /p\.set\("page",\s*String\(\(f\.page \?\? 1\) - 1\)\)/, "Must map UI page (1-based) to Spring page (0-based)");
      assert.match(src, /page:\s*normalized\.meta\.page \+ 1/, "Must map Spring page (0-based) back to UI page (1-based)");
      assert.match(src, /normalizeSpringPage\(page\)/, "Must use normalizeSpringPage utility");
    });

    it("HP-03: walletApi.getSummary defaults all balances to 0 and transactions to empty array for new accounts", () => {
      const src = read("src/lib/adapters/wallet.ts");
      assert.match(src, /backendRoutes\.wallet\.summary/, "Must call backendRoutes.wallet.summary");
      assert.match(src, /availableBalance:\s*v\?\.availableBalance \?\? 0/, "availableBalance must default to 0");
      assert.match(src, /escrowBalance:\s*v\?\.escrowBalance \?\? 0/, "escrowBalance must default to 0");
      assert.match(src, /earnedBalance:\s*v\?\.earnedBalance \?\? 0/, "earnedBalance must default to 0");
      assert.match(src, /transactions:\s*v\?\.transactions \?\? \[\]/, "transactions must default to empty array []");
    });

    it("HP-04: paymentsApi.processDeposit requires amount >= 1000 and forwards Idempotency-Key", () => {
      const src = read("src/lib/adapters/payments.ts");
      assert.match(src, /backendRoutes\.payments\.deposit/, "Must call backendRoutes.payments.deposit");
      assert.match(src, /idempotency:\s*true/, "Must enable idempotency in apiFetch");
      assert.match(src, /"Idempotency-Key":\s*idempotencyKey/, "Must forward Idempotency-Key header when provided");
      assert.doesNotMatch(src, /creditDeposit/, "Must never mutate RAM balance on deposit");
    });

    it("HP-05: proposalsApi calls backend routes for submission, acceptance, and rejection", () => {
      const src = read("src/lib/adapters/proposals.ts");
      assert.match(src, /backendRoutes\.proposals\.forPost\(postId\)/, "Must post proposal to backendRoutes.proposals.forPost");
      assert.match(src, /backendRoutes\.proposals\.accept\(proposalId\)/, "Must post to backendRoutes.proposals.accept");
      assert.match(src, /backendRoutes\.proposals\.reject\(proposalId\)/, "Must post to backendRoutes.proposals.reject");
    });

    it("HP-06: walletApi payout and bank management calls backend routes", () => {
      const src = read("src/lib/adapters/wallet.ts");
      assert.match(src, /backendRoutes\.wallet\.banks/, "Must fetch banks from backendRoutes.wallet.banks");
      assert.match(src, /backendRoutes\.wallet\.payoutAccounts/, "Must fetch/add payout accounts from backendRoutes.wallet.payoutAccounts");
      assert.match(src, /backendRoutes\.wallet\.payoutDefault\(id\)/, "Must set default payout account via backendRoutes.wallet.payoutDefault");
    });

    it("HP-07: catalogApi defines CATALOG_OFFLINE_FALLBACK and root categories endpoint", () => {
      const src = read("src/lib/adapters/catalog.ts");
      assert.match(src, /CATALOG_OFFLINE_FALLBACK/, "Must define CATALOG_OFFLINE_FALLBACK");
      assert.match(src, /\/api\/proxy\/catalog\/categories\/roots\?page=0&size=20/, "Must call proxy catalog root endpoint");
    });
  });

  // ==========================================
  // SECTION 2: EDGE CASES & CORNER CASES
  // ==========================================
  describe("Edge Cases & Corner Cases", () => {
    it("EC-01: postsApi.get maps 404 to null, but rethrows other errors", () => {
      const src = read("src/lib/adapters/posts.ts");
      assert.match(
        src,
        /if\s*\(e\s*&&.*status.*===.*404\)\s*return null;\s*throw e;/s,
        "postsApi.get must catch status 404 and return null, while re-throwing other errors"
      );
    });

    it("EC-02: proposalsApi.hasApplied maps 404 to false, but rethrows other errors", () => {
      const src = read("src/lib/adapters/proposals.ts");
      assert.match(
        src,
        /if\s*\(e\s*&&.*status.*===.*404\)\s*return false;\s*throw e;/s,
        "proposalsApi.hasApplied must catch status 404 and return false, while re-throwing other errors"
      );
    });

    it("EC-03: paymentsApi deposit boundary validation: <1000 throws, >=1000 passes", () => {
      const src = read("src/lib/adapters/payments.ts");
      assert.match(src, /if\s*\(data\.amount\s*<\s*1000\)\s*throw new Error\("Số tiền nạp tối thiểu là 1\.000 ₫"\);/);

      function validateDepositAmount(amount) {
        if (amount < 1000) throw new Error("Số tiền nạp tối thiểu là 1.000 ₫");
        return true;
      }

      // Negative values
      assert.throws(() => validateDepositAmount(-100000), /Số tiền nạp tối thiểu là 1\.000 ₫/);
      // Zero
      assert.throws(() => validateDepositAmount(0), /Số tiền nạp tối thiểu là 1\.000 ₫/);
      // Boundary just below threshold
      assert.throws(() => validateDepositAmount(999), /Số tiền nạp tối thiểu là 1\.000 ₫/);
      // Boundary exact threshold
      assert.equal(validateDepositAmount(1000), true);
      // Boundary above threshold
      assert.equal(validateDepositAmount(1001), true);
      // High value
      assert.equal(validateDepositAmount(50000000), true);
    });

    it("EC-04: proposalsApi.listAllClientApplications properly formats ALL filter vs specific filter", () => {
      const src = read("src/lib/adapters/proposals.ts");
      assert.match(
        src,
        /const qs = statusFilter && statusFilter !== "ALL" \? `status=\$\{encodeURIComponent\(statusFilter\)\}` : "";/,
        "Must exclude status query parameter when filter is ALL or empty"
      );
    });

    it("EC-05: postsApi.incrementProposalCount is a safe no-op deprecated function", () => {
      const src = read("src/lib/adapters/posts.ts");
      assert.match(src, /incrementProposalCount\(_postId:\s*string\):\s*void/, "Must be defined as safe no-op");
      assert.doesNotMatch(src, /livePosts\.find/, "Must not attempt to mutate livePosts");
    });

    it("EC-06: walletApi defensive null-coalescing on all list and summary methods", () => {
      const src = read("src/lib/adapters/wallet.ts");
      assert.match(src, /getBanks.*return unwrap\(res\) \?\? \[\];/s, "getBanks must return [] on null/undefined");
      assert.match(src, /getPayoutAccounts.*return unwrap\(res\) \?\? \[\];/s, "getPayoutAccounts must return [] on null/undefined");
    });

    it("EC-07: proposalsApi defensive null-coalescing on list methods", () => {
      const src = read("src/lib/adapters/proposals.ts");
      assert.match(src, /unwrapList[\s\S]*?\?\?\s*\[\];/, "unwrapList must always default to empty array");
    });
  });

  // ==========================================
  // SECTION 3: ZERO MOCK & SECURITY LEAKAGE AUDIT
  // ==========================================
  describe("Zero Mock & Security Leakage Audit", () => {
    it("ZMA-01: fixtures.ts file is completely deleted", () => {
      assert.equal(existsSync(join(ROOT, "src/lib/mocks/fixtures.ts")), false, "fixtures.ts must NOT exist");
    });

    it("ZMA-02: Zero residual mock variables across all adapters", () => {
      const adapters = [
        "src/lib/adapters/posts.ts",
        "src/lib/adapters/wallet.ts",
        "src/lib/adapters/payments.ts",
        "src/lib/adapters/proposals.ts",
      ];
      const bannedPatterns = [
        /livePosts/,
        /liveWallet/,
        /liveProposals/,
        /liveAccounts/,
        /creditDeposit/,
        /SUPPORTED_BANKS/,
        /MOCK_POSTS/,
        /MOCK_WALLET/,
        /post-101/,
        /DEP-928172/,
        /ORD-55102/,
        /0071001234567/,
        /TRAN HUU TRUNG/,
        /appliedPostIds/,
      ];

      for (const file of adapters) {
        const content = read(file);
        for (const pattern of bannedPatterns) {
          assert.doesNotMatch(content, pattern, `${file} must not contain pattern ${pattern}`);
        }
      }
    });

    it("ZMA-03: Zero setTimeout mock latency in core domain adapters", () => {
      const adapters = [
        "src/lib/adapters/posts.ts",
        "src/lib/adapters/wallet.ts",
        "src/lib/adapters/payments.ts",
        "src/lib/adapters/proposals.ts",
      ];
      for (const file of adapters) {
        const content = read(file);
        assert.doesNotMatch(content, /setTimeout\(resolve/, `${file} must not contain setTimeout mock latency`);
      }
    });

    it("ZMA-04: Proxy route contains zero demo accounts, demo tokens, or fake catalog responses", () => {
      const proxy = read("src/app/api/proxy/[...path]/route.ts");
      assert.doesNotMatch(proxy, /isDemoToken/, "Proxy must not branch on demo token");
      assert.doesNotMatch(proxy, /Demo Mode/, "Proxy must not return Demo Mode payloads");
      assert.doesNotMatch(proxy, /usr-demo-/, "Proxy must not fabricate demo user IDs");
      assert.doesNotMatch(proxy, /prov-demo-1/, "Proxy must not fabricate demo provider profile");
      assert.doesNotMatch(proxy, /addr-demo-1/, "Proxy must not fabricate demo addresses");
      assert.doesNotMatch(proxy, /Catalog Demo/, "Proxy must not fabricate catalog items");
      assert.match(proxy, /BACKEND_OFFLINE/, "Proxy catch must return BACKEND_OFFLINE status 503");
      assert.match(proxy, /status:\s*503/, "Proxy catch must return HTTP status 503");
    });

    it("ZMA-05: Login route contains zero DEMO_ACCOUNTS and no demo-jwt issuance", () => {
      const login = read("src/app/api/auth/login/route.ts");
      assert.doesNotMatch(login, /DEMO_ACCOUNTS/, "Login route must not contain DEMO_ACCOUNTS");
      assert.doesNotMatch(login, /demo-jwt-token/, "Login route must not issue demo-jwt-tokens");
      assert.doesNotMatch(login, /Local Demo/, "Login route must not return Local Demo message");
      assert.match(login, /status:\s*401/, "Login route must return HTTP 401 when backend authentication fails");
    });

    it("ZMA-06: Me route contains zero demo token branching", () => {
      const me = read("src/app/api/auth/me/route.ts");
      assert.doesNotMatch(me, /token\.startsWith\("demo-"\)/, "Me route must not branch on demo tokens");
      assert.doesNotMatch(me, /usr-demo-/, "Me route must not fabricate demo users");
    });

    it("ZMA-07: Dictionaries vi.json and en.json have zero (Mock) strings and no mockData key", () => {
      for (const lang of ["vi", "en"]) {
        const dict = read(`src/dictionaries/${lang}.json`);
        assert.doesNotMatch(dict, /\(Mock\)/, `${lang}.json must not contain '(Mock)' in messages`);
        assert.doesNotMatch(dict, /"mockData":/, `${lang}.json must not contain dead 'mockData' key`);
      }
    });

    it("ZMA-08: UI Client Posts page provides faithful EmptyState when posts array is empty", () => {
      const clientPosts = read("src/app/[locale]/(app)/client/posts/page.tsx");
      assert.match(clientPosts, /posts\.length === 0/, "Must check for posts.length === 0");
      assert.match(clientPosts, /title="Bạn chưa có bài đăng việc làm nào"/, "Must display empty state title for new accounts");
      assert.match(clientPosts, /Đăng bài việc làm đầu tiên/, "Must display CTA button to create first job post");
    });

    it("ZMA-09: UI Wallet page provides faithful EmptyState for zero transactions and zero balance", () => {
      const walletPage = read("src/app/[locale]/(app)/wallet/page.tsx");
      assert.match(walletPage, /wallet\.transactions\.length === 0/, "Must check for wallet.transactions.length === 0");
      assert.match(walletPage, /Chưa có giao dịch phát sinh nào trong tài khoản/, "Must display empty transactions message");
      assert.match(walletPage, /WalletSummary/, "Must pass balance props to WalletSummary");
      assert.match(walletPage, /await loadWallet\(\)/, "Must reload wallet state from backend upon deposit success");
    });

    it("ZMA-10: PaymentPanel prevents double-click race conditions via isSubmitting guard", () => {
      const paymentPanel = read("src/components/domain/payment-panel.tsx");
      assert.match(paymentPanel, /generateIdempotencyKey\(\)/, "Must generate unique idempotency key");
      assert.match(paymentPanel, /isLoading=\{isSubmitting\}/, "Submit button must bind isLoading to isSubmitting state");
      assert.match(paymentPanel, /disabled=\{isSubmitting\}/, "Inputs must be disabled while isSubmitting is true");
    });
  });
});
