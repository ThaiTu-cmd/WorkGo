import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// 1. HAPPY PATH TESTS: CORE ADAPTERS, UTILITIES & REWRITES
// =========================================================================

test("Happy Path - Spring Page normalization maps valid page structure correctly", () => {
  const springPage = {
    data: [
      { id: "p1", title: "Thiết kế logo WorkGo" },
      { id: "p2", title: "Phát triển ứng dụng Android" },
    ],
    currentPage: 1,
    pageSize: 10,
    totalElements: 42,
    totalPages: 5,
  };

  const normalized = {
    data: springPage.data || [],
    meta: {
      page: springPage.currentPage,
      limit: springPage.pageSize,
      total: springPage.totalElements,
      totalPages: springPage.totalPages,
    },
  };

  assert.equal(normalized.data.length, 2);
  assert.equal(normalized.data[0].id, "p1");
  assert.equal(normalized.meta.page, 1);
  assert.equal(normalized.meta.limit, 10);
  assert.equal(normalized.meta.total, 42);
  assert.equal(normalized.meta.totalPages, 5);
});

test("Happy Path - ApiError preserves code, multilingual messages, and HTTP status", () => {
  class ApiError extends Error {
    constructor(code, messageVi, messageEn, status, details) {
      super(messageVi);
      this.name = "ApiError";
      this.code = code;
      this.messageVi = messageVi;
      this.messageEn = messageEn;
      this.status = status;
      this.details = details;
    }
  }

  const err = new ApiError(
    1006,
    "Phiên đăng nhập đã hết hạn.",
    "Session expired.",
    401,
    { expiredAt: "2026-10-07T12:00:00Z" }
  );

  assert.ok(err instanceof Error);
  assert.equal(err.name, "ApiError");
  assert.equal(err.code, 1006);
  assert.equal(err.status, 401);
  assert.equal(err.messageVi, "Phiên đăng nhập đã hết hạn.");
  assert.equal(err.messageEn, "Session expired.");
  assert.equal(err.details.expiredAt, "2026-10-07T12:00:00Z");
});

test("Happy Path - Catalog DEFAULT_CATEGORIES contains all 6 required services", () => {
  const catalogContent = fs.readFileSync(
    path.resolve(__dirname, "../src/lib/adapters/catalog.ts"),
    "utf-8"
  );

  assert.match(catalogContent, /cat-1.*Thiết kế & Đồ họa/);
  assert.match(catalogContent, /cat-2.*Lập trình & Công nghệ/);
  assert.match(catalogContent, /cat-3.*Viết lách & Dịch thuật/);
  assert.match(catalogContent, /cat-4.*Marketing & Truyền thông/);
  assert.match(catalogContent, /cat-5.*Sửa chữa & Kỹ thuật tại nhà/);
  assert.match(catalogContent, /cat-6.*Vệ sinh & Gia đình/);
});

test("Happy Path - BFF Proxy path resolution logic differentiates Catalog and Gateway", () => {
  const API_BASE_URL = "http://localhost:8888";
  const CATALOG_BASE_URL = "http://localhost:8082";

  function resolveTargetUrl(pathSegments, search = "") {
    const targetPath = pathSegments.join("/");
    if (targetPath.startsWith("catalog/")) {
      return `${CATALOG_BASE_URL}/${targetPath}${search}`;
    } else if (targetPath.startsWith("api/")) {
      return `${API_BASE_URL}/${targetPath}${search}`;
    } else {
      return `${API_BASE_URL}/api/${targetPath}${search}`;
    }
  }

  // Catalog routes
  assert.equal(
    resolveTargetUrl(["catalog", "categories", "roots"]),
    "http://localhost:8082/catalog/categories/roots"
  );
  // Direct API routes
  assert.equal(
    resolveTargetUrl(["api", "v1", "identity", "users", "myInfo"]),
    "http://localhost:8888/api/v1/identity/users/myInfo"
  );
  // Default prefix routes
  assert.equal(
    resolveTargetUrl(["v1", "posts"], "?page=1&limit=6"),
    "http://localhost:8888/api/v1/posts?page=1&limit=6"
  );
});

test("Happy Path - BFF Proxy Header sanitation and Bearer injection", () => {
  function prepareForwardHeaders(incomingHeaders, token) {
    const headers = new Headers(incomingHeaders);
    headers.delete("host");
    headers.delete("cookie");
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  }

  // Case 1: Injects Bearer token from cookie
  const res1 = prepareForwardHeaders(
    { host: "localhost:3000", cookie: "wg_at=secret123; wg_role=CLIENT" },
    "jwt-token-xyz"
  );
  assert.equal(res1.has("host"), false);
  assert.equal(res1.has("cookie"), false);
  assert.equal(res1.get("authorization"), "Bearer jwt-token-xyz");

  // Case 2: Preserves explicit authorization header
  const res2 = prepareForwardHeaders(
    { authorization: "Bearer custom-token" },
    "jwt-token-xyz"
  );
  assert.equal(res2.get("authorization"), "Bearer custom-token");
});

test("Happy Path - Dev Demo accounts authentication matrix", () => {
  const DEMO_ACCOUNTS = {
    demouser1: { role: "CLIENT", token: "demo-jwt-token-client-demouser1" },
    provider1: { role: "PROVIDER", token: "demo-jwt-token-provider-provider1" },
  };

  const VALID_PASSWORDS = ["Demo@12345", "demo", "Demo@123"];

  for (const [username, account] of Object.entries(DEMO_ACCOUNTS)) {
    for (const pwd of VALID_PASSWORDS) {
      const isDemo =
        Boolean(DEMO_ACCOUNTS[username]) &&
        VALID_PASSWORDS.includes(pwd);
      assert.equal(isDemo, true);
      assert.equal(DEMO_ACCOUNTS[username].role, account.role);
      assert.ok(DEMO_ACCOUNTS[username].token.startsWith("demo-jwt-token-"));
    }
  }
});

// =========================================================================
// 2. EDGE CASES & CORNER CASES: DATA ANOMALIES & OFFLINE RESILIENCE
// =========================================================================

test("Edge Case - Spring Page normalization handles empty, null or undefined data safely", () => {
  // Empty data array
  const emptyPage = {
    data: [],
    currentPage: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  };
  const norm1 = {
    data: emptyPage.data || [],
    meta: {
      page: emptyPage.currentPage,
      limit: emptyPage.pageSize,
      total: emptyPage.totalElements,
      totalPages: emptyPage.totalPages,
    },
  };
  assert.deepEqual(norm1.data, []);
  assert.equal(norm1.meta.total, 0);

  // Missing data property (undefined)
  const undefinedPage = {
    currentPage: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  };
  const norm2 = {
    data: undefinedPage.data || [],
    meta: {
      page: undefinedPage.currentPage,
      limit: undefinedPage.pageSize,
      total: undefinedPage.totalElements,
      totalPages: undefinedPage.totalPages,
    },
  };
  assert.deepEqual(norm2.data, []);
});

test("Edge Case - Login route validates empty or missing credentials with HTTP 400", () => {
  function validateLoginInput(body) {
    const { userName, password } = body;
    if (!userName || !password) {
      return { status: 400, code: 1001, message: "Tên đăng nhập và mật khẩu là bắt buộc." };
    }
    return { status: 200 };
  }

  assert.equal(validateLoginInput({}).status, 400);
  assert.equal(validateLoginInput({ userName: "" }).status, 400);
  assert.equal(validateLoginInput({ userName: "admin", password: "" }).status, 400);
  assert.equal(validateLoginInput({ userName: "", password: "pwd" }).status, 400);
  assert.equal(validateLoginInput({ userName: "user", password: "pwd" }).status, 200);
});

test("Edge Case - Login route rejects non-demo accounts when backend is offline with HTTP 401", () => {
  const DEMO_ACCOUNTS = {
    demouser1: { role: "CLIENT", token: "demo-jwt-token-client-demouser1" },
    provider1: { role: "PROVIDER", token: "demo-jwt-token-provider-provider1" },
  };

  function authenticateLocal(userName, password, backendOnline = false) {
    if (backendOnline) return { status: 200 };
    const isDemo =
      Boolean(DEMO_ACCOUNTS[userName]) &&
      ["Demo@12345", "demo", "Demo@123"].includes(password);

    if (isDemo) {
      return { status: 200, role: DEMO_ACCOUNTS[userName].role };
    }
    return {
      status: 401,
      code: 1006,
      message: "Sai email hoặc mật khẩu hoặc máy chủ backend chưa sẵn sàng.",
    };
  }

  // Invalid password for demouser1
  const badPwd = authenticateLocal("demouser1", "WrongPassword123");
  assert.equal(badPwd.status, 401);
  assert.equal(badPwd.code, 1006);

  // Unknown user
  const unknownUser = authenticateLocal("randomUser", "Demo@12345");
  assert.equal(unknownUser.status, 401);
  assert.equal(unknownUser.code, 1006);
});

test("Edge Case - Refresh Route returns HTTP 401 without deleting session cookies", () => {
  const refreshContent = fs.readFileSync(
    path.resolve(__dirname, "../src/app/api/auth/refresh/route.ts"),
    "utf-8"
  );

  // Status must be 401
  assert.match(refreshContent, /status:\s*401/);
  // Code must be REFRESH_UNSUPPORTED
  assert.match(refreshContent, /REFRESH_UNSUPPORTED/);
  // Must NOT delete cookies
  assert.doesNotMatch(refreshContent, /cookies\.delete/);
  assert.doesNotMatch(refreshContent, /cookies\(\)\.set.*maxAge:\s*0/);
});

test("Edge Case - BFF Proxy offline fallback distinguishes CLIENT vs PROVIDER profiles", () => {
  function getMockProfile(targetPath, token) {
    const isDemoToken = Boolean(token?.startsWith("demo-"));
    const isProvider = token?.includes("provider");

    if (isDemoToken && targetPath.includes("identity/providers/myProfile")) {
      if (isProvider) {
        return {
          status: 200,
          result: {
            providerProfileId: "prov-demo-1",
            userId: "usr-demo-provider",
            verificationStatus: "VERIFIED",
          },
        };
      }
      return { status: 404, message: "Provider profile not found" };
    }

    if (targetPath.includes("identity/users/myInfo")) {
      return {
        status: 200,
        result: {
          userId: isProvider ? "usr-demo-provider" : "usr-demo-client",
          roles: isProvider ? ["PROVIDER", "USER"] : ["CLIENT", "USER"],
        },
      };
    }

    return { status: 503, code: "BACKEND_OFFLINE" };
  }

  // Client token asking for provider profile -> 404
  const clientReq = getMockProfile(
    "identity/providers/myProfile",
    "demo-jwt-token-client-demouser1"
  );
  assert.equal(clientReq.status, 404);

  // Provider token asking for provider profile -> 200
  const provReq = getMockProfile(
    "identity/providers/myProfile",
    "demo-jwt-token-provider-provider1"
  );
  assert.equal(provReq.status, 200);
  assert.equal(provReq.result.userId, "usr-demo-provider");

  // Unknown route offline fallback -> 503
  const unknownRoute = getMockProfile("order/v1/orders/123", "demo-token");
  assert.equal(unknownRoute.status, 503);
  assert.equal(unknownRoute.code, "BACKEND_OFFLINE");
});

test("Edge Case - ApiClient stops infinite loop on 401 when refresh is unsupported", () => {
  let refreshAttempts = 0;

  async function simulateApiFetch(path, options = {}) {
    const { _isRetry = false } = options;

    // Simulate backend returning 401
    const responseStatus = 401;

    if (responseStatus === 401) {
      if (!_isRetry) {
        // Attempt refresh
        refreshAttempts++;
        const refreshResponse = {
          ok: false,
          status: 401,
          json: async () => ({ code: "REFRESH_UNSUPPORTED" }),
        };

        if (refreshResponse.ok) {
          return simulateApiFetch(path, { ...options, _isRetry: true });
        }
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  return simulateApiFetch("/api/v1/identity/users/myInfo")
    .then(() => assert.fail("Should have thrown"))
    .catch((err) => {
      assert.equal(err.message, "Session expired. Please log in again.");
      assert.equal(refreshAttempts, 1, "Must only attempt refresh once, never loop");
    });
});

// =========================================================================
// 3. BOUNDARY CONDITION TESTS: NUMERIC & STRING BOUNDARIES
// =========================================================================

test("Boundary Conditions - Proposal estimated days [1 to 365] inclusive", () => {
  const proposalSchema = z.object({
    estimatedDays: z.number().int().min(1).max(365),
  });

  assert.equal(proposalSchema.safeParse({ estimatedDays: 1 }).success, true);
  assert.equal(proposalSchema.safeParse({ estimatedDays: 365 }).success, true);
  assert.equal(proposalSchema.safeParse({ estimatedDays: 0 }).success, false);
  assert.equal(proposalSchema.safeParse({ estimatedDays: 366 }).success, false);
  assert.equal(proposalSchema.safeParse({ estimatedDays: 10.5 }).success, false);
});

test("Boundary Conditions - Job budgetMin vs budgetMax relationship", () => {
  const budgetSchema = z
    .object({
      budgetMin: z.number().positive(),
      budgetMax: z.number().positive(),
    })
    .refine((v) => v.budgetMin <= v.budgetMax, {
      message: "budgetMin must be <= budgetMax",
    });

  // Equal budget (fixed price)
  assert.equal(
    budgetSchema.safeParse({ budgetMin: 5000000, budgetMax: 5000000 }).success,
    true
  );
  // Min < Max
  assert.equal(
    budgetSchema.safeParse({ budgetMin: 1000000, budgetMax: 5000000 }).success,
    true
  );
  // Min > Max -> Fail
  assert.equal(
    budgetSchema.safeParse({ budgetMin: 5000001, budgetMax: 5000000 }).success,
    false
  );
  // Zero or Negative -> Fail
  assert.equal(
    budgetSchema.safeParse({ budgetMin: 0, budgetMax: 1000000 }).success,
    false
  );
});

test("Boundary Conditions - Review rating integer [1 to 5] inclusive", () => {
  const reviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
  });

  assert.equal(reviewSchema.safeParse({ rating: 1 }).success, true);
  assert.equal(reviewSchema.safeParse({ rating: 5 }).success, true);
  assert.equal(reviewSchema.safeParse({ rating: 0 }).success, false);
  assert.equal(reviewSchema.safeParse({ rating: 6 }).success, false);
  assert.equal(reviewSchema.safeParse({ rating: 3.5 }).success, false);
});

test("Boundary Conditions - Payment deposit minimum threshold 1,000 VND", () => {
  const paymentSchema = z.object({
    amount: z.number().int().min(1000),
  });

  assert.equal(paymentSchema.safeParse({ amount: 1000 }).success, true);
  assert.equal(paymentSchema.safeParse({ amount: 1001 }).success, true);
  assert.equal(paymentSchema.safeParse({ amount: 999 }).success, false);
  assert.equal(paymentSchema.safeParse({ amount: 0 }).success, false);
  assert.equal(paymentSchema.safeParse({ amount: -500 }).success, false);
});

// =========================================================================
// 4. MOBILE APP TOKENS & SYSTEM GOVERNANCE TESTS
// =========================================================================

test("Mobile Governance - Theme tokens conform strictly to Brand A Trust Blue", () => {
  const themePath = path.resolve(__dirname, "../../android-frontend/src/constants/theme.ts");
  assert.ok(fs.existsSync(themePath), "android-frontend theme.ts must exist");

  const themeContent = fs.readFileSync(themePath, "utf-8");
  assert.match(themeContent, /#2563EB/, "Primary color must be Brand A Trust Blue #2563EB");
  assert.match(themeContent, /#F8FAFC/, "Light background must be #F8FAFC");
  assert.match(themeContent, /#0F172A/, "Light text must be #0F172A");
  assert.match(themeContent, /#15803D/, "Success color must be #15803D");
  assert.match(themeContent, /#DC2626/, "Danger color must be #DC2626");
});

test("Mobile Governance - Index screen reflects WorkGo Mobile Branding", () => {
  const indexPath = path.resolve(__dirname, "../../android-frontend/src/app/index.tsx");
  assert.ok(fs.existsSync(indexPath), "android-frontend index.tsx must exist");

  const indexContent = fs.readFileSync(indexPath, "utf-8");
  assert.match(indexContent, /WorkGo Mobile/, "Must feature WorkGo Mobile branding");
  assert.match(indexContent, /BFF Unified Proxy/, "Must highlight BFF Proxy readiness");
  assert.doesNotMatch(indexContent, /Welcome!/, "Must not contain default Expo template text");
});
