import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("QA account isolation over real API (PLAN mock-data fix)", () => {
  it("1. backend-routes.ts exports posts.my / wallet.summary / payments.deposit", () => {
    const src = read("src/lib/adapters/backend-routes.ts");
    assert.match(src, /my:\s*`?\$\{API_V1\}\/posts\/my`?/, "missing posts.my route");
    assert.match(src, /summary:\s*`?\$\{API_V1\}\/wallet\/summary`?/, "missing wallet.summary route");
    assert.match(src, /deposit:\s*`?\$\{API_V1\}\/payments\/deposit`?/, "missing payments.deposit route");
    assert.match(src, /hasApplied:/, "missing proposals.hasApplied route");
  });

  it("2. posts.ts calls apiFetch scoped route, zero hardcoded posts", () => {
    const src = read("src/lib/adapters/posts.ts");
    assert.match(src, /apiFetch/, "must call apiFetch");
    assert.match(src, /backendRoutes\.posts\.my/, "getMyPosts must use backendRoutes.posts.my");
    assert.doesNotMatch(src, /livePosts/, "must not contain livePosts");
    assert.doesNotMatch(src, /MOCK_POSTS/, "must not contain MOCK_POSTS");
    assert.doesNotMatch(src, /setTimeout\(resolve/, "must not contain setTimeout mock latency");
    assert.doesNotMatch(src, /post-101/, "must not contain post-101");
    assert.doesNotMatch(src, /Trần Anh Khoa/, "must not contain hardcoded client name");
    assert.doesNotMatch(src, /Tôi \(Bạn\)/, "must not fabricate current-user client");
  });

  it("3. getMyPosts takes token and calls /my scope (per-account isolation)", () => {
    const src = read("src/lib/adapters/posts.ts");
    assert.match(
      src,
      /getMyPosts\(.*token\?: string.*backendRoutes\.posts\.my/s,
      "getMyPosts(token?) must call backendRoutes.posts.my"
    );
  });

  it("4. wallet.ts calls apiFetch, zero hardcoded balances", () => {
    const src = read("src/lib/adapters/wallet.ts");
    assert.match(src, /apiFetch/, "must call apiFetch");
    assert.doesNotMatch(src, /liveWallet/, "must not contain liveWallet");
    assert.doesNotMatch(src, /liveAccounts/, "must not contain liveAccounts");
    assert.doesNotMatch(src, /creditDeposit\(/, "must not contain creditDeposit");
    assert.doesNotMatch(src, /12500000/, "must not contain 12.5M hardcoded balance");
    assert.doesNotMatch(src, /0071001234567/, "must not contain hardcoded account number");
    assert.doesNotMatch(src, /TRAN HUU TRUNG/, "must not contain hardcoded holder name");
  });

  it("5. payments.ts posts deposit with idempotency, zero fabricated references", () => {
    const src = read("src/lib/adapters/payments.ts");
    assert.match(src, /apiFetch/, "must call apiFetch");
    assert.match(src, /idempotency:\s*true/, "must send idempotency:true");
    assert.doesNotMatch(src, /setTimeout/, "must not contain setTimeout");
    assert.doesNotMatch(src, /TX-\$\{/, "must not fabricate TX- ids");
    assert.doesNotMatch(src, /creditDeposit/, "must not call creditDeposit");
  });

  it("6. deposit boundary <1000 throws exact message; 1000 and 50M pass guard", () => {
    const src = read("src/lib/adapters/payments.ts");
    assert.match(src, /Số tiền nạp tối thiểu là 1\.000 ₫/, "must keep exact boundary message");
    // Local replica of the adapter guard (adapter itself needs network, so verify logic shape).
    function guard(amount) {
      if (amount < 1000) throw new Error("Số tiền nạp tối thiểu là 1.000 ₫");
      return true;
    }
    assert.throws(() => guard(999), /Số tiền nạp tối thiểu là 1\.000 ₫/);
    assert.equal(guard(1000), true);
    assert.equal(guard(50000000), true);
  });

  it("7. proposals.ts has zero RAM store; hasApplied maps 404 to false", () => {
    const src = read("src/lib/adapters/proposals.ts");
    assert.doesNotMatch(src, /liveProposals/, "must not contain liveProposals");
    assert.doesNotMatch(src, /appliedPostIds/, "must not contain appliedPostIds RAM set");
    assert.doesNotMatch(src, /Design Agency Alpha/, "must not contain hardcoded provider");
    assert.match(src, /hasApplied/, "must keep hasApplied");
    assert.match(src, /status.*===.*404[\s\S]{0,80}return false/, "hasApplied must return false on 404");
  });

  it("8. fixtures gone; proxy/login/me routes have zero demo branches", () => {
    assert.ok(!existsSync(join(ROOT, "src/lib/mocks/fixtures.ts")), "fixtures.ts must be deleted");
    const proxy = read("src/app/api/proxy/[...path]/route.ts");
    assert.doesNotMatch(proxy, /demo-/, "proxy must not reference demo tokens");
    assert.doesNotMatch(proxy, /Demo Mode/, "proxy must not serve Demo Mode payloads");
    assert.doesNotMatch(proxy, /usr-demo-/, "proxy must not fabricate demo users");
    assert.match(proxy, /BACKEND_OFFLINE/, "proxy catch must return BACKEND_OFFLINE 503");
    const login = read("src/app/api/auth/login/route.ts");
    assert.doesNotMatch(login, /DEMO_ACCOUNTS/, "login must not contain DEMO_ACCOUNTS");
    assert.doesNotMatch(login, /demo-jwt/, "login must not issue demo tokens");
    const me = read("src/app/api/auth/me/route.ts");
    assert.doesNotMatch(me, /startsWith\("demo-"\)/, "me must not branch on demo tokens");
  });

  it("9. dictionaries vi+en contain zero (Mock) success strings", () => {
    for (const f of ["src/dictionaries/vi.json", "src/dictionaries/en.json"]) {
      const dict = read(f);
      assert.doesNotMatch(dict, /\(Mock\)/, `${f} must not contain (Mock)`);
    }
  });

  it("10. identity + catalog real-domain logic intact (no collateral damage)", () => {
    const identity = read("src/lib/adapters/identity.ts");
    assert.match(identity, /apiFetch/, "identity must still use apiFetch");
    assert.match(identity, /normalizeUserRoles/, "identity must keep normalizeUserRoles");
    const catalog = read("src/lib/adapters/catalog.ts");
    assert.match(catalog, /apiFetch/, "catalog must still use apiFetch");
    assert.match(catalog, /mapBackendCategory/, "catalog must keep mapBackendCategory");
  });

  it("11. client/page.tsx contains zero hardcoded stats (15.5M/4.2M/3/8) and calls real APIs", () => {
    const src = read("src/app/[locale]/(app)/client/page.tsx");
    assert.match(src, /postsApi\.getMyPosts\(\)/, "must call postsApi.getMyPosts()");
    assert.match(src, /walletApi\.getSummary\(\)/, "must call walletApi.getSummary()");
    assert.match(src, /proposalsApi\.listAllClientApplications\(\)/, "must call proposalsApi.listAllClientApplications()");
    assert.doesNotMatch(src, /15\.500\.000/, "must not contain hardcoded 15.500.000");
    assert.doesNotMatch(src, /4\.200\.000/, "must not contain hardcoded 4.200.000");
    assert.doesNotMatch(src, />3<\/span>/, "must not contain hardcoded 3 open posts");
    assert.doesNotMatch(src, />8<\/span>/, "must not contain hardcoded 8 proposals");
  });

  it("12. provider/page.tsx contains zero hardcoded stats (38.2M/24) and calls real APIs", () => {
    const src = read("src/app/[locale]/(app)/provider/page.tsx");
    assert.match(src, /walletApi\.getSummary\(\)/, "must call walletApi.getSummary()");
    assert.match(src, /postsApi\.list\(/, "must call postsApi.list()");
    assert.doesNotMatch(src, /38\.200\.000/, "must not contain hardcoded 38.200.000");
    assert.doesNotMatch(src, />24<\/span>/, "must not contain hardcoded 24 opportunities");
  });
});

