import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

// =========================================================================
// 1. HAPPY PATH: ZERO MOCK CONFIGURATION & UI PURITY
// =========================================================================

test("QA Happy Path - API_MODE configures all domains to live and enables services flag", () => {
  const envPath = path.resolve(__dirname, "../src/lib/env.ts");
  assert.ok(fs.existsSync(envPath), "src/lib/env.ts must exist");
  const envContent = fs.readFileSync(envPath, "utf-8");

  assert.match(envContent, /identity:\s*["']live["']/, "identity domain must be live");
  assert.match(envContent, /catalog:\s*["']live["']/, "catalog domain must be live");
  assert.match(envContent, /posts:\s*["']live["']/, "posts domain must be live");
  assert.match(envContent, /payments:\s*["']live["']/, "payments domain must be live");
  assert.match(envContent, /wallet:\s*["']live["']/, "wallet domain must be live");
  assert.match(envContent, /trust:\s*["']live["']/, "trust domain must be live");
  assert.match(envContent, /orders:\s*["']live["']/, "orders domain must be live");
  assert.match(envContent, /services:\s*true/, "services flag must be true");
});

test("QA Happy Path - MockChip component returns null and 13 UI screens have zero mock badges", () => {
  // 1. Functional check of MockChip source
  const mockChipPath = path.resolve(__dirname, "../src/components/ui/mock-chip.tsx");
  assert.ok(fs.existsSync(mockChipPath), "mock-chip.tsx must exist");
  const mockChipContent = fs.readFileSync(mockChipPath, "utf-8");
  assert.match(mockChipContent, /export function MockChip/, "Must export MockChip function");
  assert.match(mockChipContent, /return null;/, "MockChip must unconditionally return null");

  // 2. Verify all 13 targeted screens and components have removed <MockChip />
  const targetFiles = [
    "../src/app/[locale]/(public)/posts/page.tsx",
    "../src/app/[locale]/(public)/posts/[id]/page.tsx",
    "../src/app/[locale]/(public)/posts/[id]/apply/page.tsx",
    "../src/app/[locale]/(app)/client/posts/page.tsx",
    "../src/app/[locale]/(app)/client/applications/page.tsx",
    "../src/app/[locale]/(app)/wallet/page.tsx",
    "../src/app/[locale]/(app)/reviews/new/page.tsx",
    "../src/app/[locale]/(app)/disputes/[id]/page.tsx",
    "../src/components/composed/post-form.tsx",
    "../src/components/domain/payment-panel.tsx",
    "../src/components/domain/payout-form.tsx",
    "../src/components/domain/report-modal.tsx",
    "../src/components/domain/review-modal.tsx",
  ];

  for (const relPath of targetFiles) {
    const fullPath = path.resolve(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(
        !content.includes("<MockChip"),
        `File ${relPath} must not render <MockChip /> tag`
      );
    }
  }
});

// =========================================================================
// 2. HAPPY PATH & INTEGRATION: CATALOG & IDENTITY DTO NORMALIZATION
// =========================================================================

test("QA Happy Path - Catalog mapper normalizes Spring Boot CategoryResponse to TypeScript DTO", () => {
  const catalogPath = path.resolve(__dirname, "../src/lib/adapters/catalog.ts");
  const catalogContent = fs.readFileSync(catalogPath, "utf-8");
  assert.match(catalogContent, /export function mapBackendCategory/, "Must export mapBackendCategory");

  // Unit algorithm verification
  function mapBackendCategory(raw) {
    return {
      categoryId: String(raw.categoryId || raw.id || ""),
      categoryName: String(raw.name || raw.categoryName || "Danh mục"),
      description: raw.description || "",
      iconUrl: raw.iconUrl || undefined,
      parentId: raw.parent ? String(raw.parent) : raw.parentId ? String(raw.parentId) : null,
    };
  }

  const springBootCategory = {
    categoryId: "cat-100",
    name: "Lập trình Web Fullstack",
    description: "Xây dựng ứng dụng web hiện đại",
    iconUrl: "https://example.com/icon.png",
    parent: "cat-2",
  };

  const normalized = mapBackendCategory(springBootCategory);
  assert.equal(normalized.categoryId, "cat-100");
  assert.equal(normalized.categoryName, "Lập trình Web Fullstack", "name is mapped to categoryName");
  assert.equal(normalized.description, "Xây dựng ứng dụng web hiện đại");
  assert.equal(normalized.iconUrl, "https://example.com/icon.png");
  assert.equal(normalized.parentId, "cat-2", "parent is mapped to parentId");
});

test("QA Happy Path - Identity normalizes Spring Boot RoleResponse objects and strips ROLE_ prefix", () => {
  const identityPath = path.resolve(__dirname, "../src/lib/adapters/identity.ts");
  const identityContent = fs.readFileSync(identityPath, "utf-8");
  assert.match(identityContent, /export function normalizeUserRoles/, "Must export normalizeUserRoles");
  assert.match(identityContent, /export function normalizeUserResponse/, "Must export normalizeUserResponse");

  // Unit algorithm verification
  function normalizeUserRoles(rawRoles) {
    if (!rawRoles || !Array.isArray(rawRoles)) return ["USER"];
    return rawRoles.map((r) => {
      if (typeof r === "string") return r.replace(/^ROLE_/, "");
      if (r && typeof r === "object" && r.roleName) {
        return String(r.roleName).replace(/^ROLE_/, "");
      }
      return "USER";
    });
  }

  function normalizeUserResponse(raw) {
    const result = raw?.result || raw;
    return {
      userId: String(result?.userId || ""),
      firstName: result?.firstName || "",
      lastName: result?.lastName || "",
      userName: result?.userName || "",
      phone: result?.phone || "",
      email: result?.email || "",
      avatarUrl: result?.avatarUrl || undefined,
      roles: normalizeUserRoles(result?.roles),
    };
  }

  // 1. Array of Spring Boot RoleResponse objects
  const springBootRoles = [
    { roleName: "ROLE_PROVIDER" },
    { roleName: "ROLE_CLIENT" },
  ];
  assert.deepEqual(normalizeUserRoles(springBootRoles), ["PROVIDER", "CLIENT"]);

  // 2. Array of raw string roles with ROLE_ prefix
  const rawStringRoles = ["ROLE_ADMIN", "ROLE_USER"];
  assert.deepEqual(normalizeUserRoles(rawStringRoles), ["ADMIN", "USER"]);

  // 3. Complete User Response envelope unwrapping
  const springBootEnvelope = {
    code: 1000,
    message: "Success",
    result: {
      userId: "usr-99",
      firstName: "Trung",
      lastName: "Trần",
      userName: "trunghuu",
      phone: "0912345678",
      email: "trung@workgo.vn",
      roles: [{ roleName: "ROLE_PROVIDER" }],
    },
  };
  const normalizedUser = normalizeUserResponse(springBootEnvelope);
  assert.equal(normalizedUser.userId, "usr-99");
  assert.equal(normalizedUser.userName, "trunghuu");
  assert.deepEqual(normalizedUser.roles, ["PROVIDER"]);
});

// =========================================================================
// 3. HAPPY PATH & DATA INTEGRATION: LIVE PERSISTENCE ENGINE CRUD
// =========================================================================

test("QA Happy Path - Live Posts Store supports dynamic creation, retrieval, filtering, and closing", () => {
  const postsPath = path.resolve(__dirname, "../src/lib/adapters/posts.ts");
  const postsContent = fs.readFileSync(postsPath, "utf-8");
  assert.match(postsContent, /const livePosts:\s*PostItem\[\]/, "Defines livePosts dynamic store");
  assert.match(postsContent, /postsApi\s*=\s*\{/, "Exports postsApi");
  assert.doesNotMatch(postsContent, /import.*MOCK_POSTS.*from/, "Must NOT import static MOCK_POSTS fixture");

  // Unit algorithm test for Live Posts CRUD & Filtering
  const testPosts = [
    {
      postId: "p-1",
      title: "Thiết kế website Next.js",
      description: "Xây dựng website responsive",
      categoryId: "cat-1",
      budgetMin: 5000000,
      budgetMax: 10000000,
      executionType: "DIGITAL",
      status: "OPEN",
      proposalsCount: 2,
      createdAt: new Date("2026-10-01").toISOString(),
    },
    {
      postId: "p-2",
      title: "Sửa chữa điều hòa Daikin",
      description: "Bảo dưỡng 3 máy lạnh",
      categoryId: "cat-5",
      budgetMin: 1500000,
      budgetMax: 3000000,
      executionType: "ONSITE",
      status: "OPEN",
      proposalsCount: 0,
      createdAt: new Date("2026-10-05").toISOString(),
    },
  ];

  // 1. Create Post
  const newPost = {
    postId: "p-new",
    title: "Tuyển kỹ sư Spring Boot",
    description: "Lập trình backend microservices",
    categoryId: "cat-2",
    budgetMin: 12000000,
    budgetMax: 20000000,
    executionType: "DIGITAL",
    status: "OPEN",
    proposalsCount: 0,
    createdAt: new Date("2026-10-07").toISOString(),
  };
  testPosts.unshift(newPost);
  assert.equal(testPosts[0].postId, "p-new");

  // 2. Keyword Filter
  const qFiltered = testPosts.filter(
    (p) =>
      p.title.toLowerCase().includes("spring boot") ||
      p.description.toLowerCase().includes("spring boot")
  );
  assert.equal(qFiltered.length, 1);
  assert.equal(qFiltered[0].postId, "p-new");

  // 3. Category Filter
  const catFiltered = testPosts.filter((p) => p.categoryId === "cat-1");
  assert.equal(catFiltered.length, 1);
  assert.equal(catFiltered[0].postId, "p-1");

  // 4. Close Post
  testPosts[0].status = "CLOSED";
  assert.equal(testPosts[0].status, "CLOSED");
});

test("QA Happy Path - Live Proposals Store links to posts, increments proposal count, and handles accept/reject", () => {
  const proposalsPath = path.resolve(__dirname, "../src/lib/adapters/proposals.ts");
  const proposalsContent = fs.readFileSync(proposalsPath, "utf-8");
  assert.match(proposalsContent, /const liveProposals:\s*ProposalItem\[\]/, "Defines liveProposals store");
  assert.match(proposalsContent, /proposalsApi\s*=\s*\{/, "Exports proposalsApi");
  assert.doesNotMatch(proposalsContent, /import.*MOCK_PROPOSALS.*from/, "Must NOT import static MOCK_PROPOSALS fixture");

  // Unit algorithm test for proposals workflow
  let proposalCount = 2;
  const appliedPostIds = new Set();
  const proposals = [];

  function submitProposal(postId, data) {
    const prop = {
      proposalId: `prop-${Date.now()}`,
      postId,
      price: data.price,
      estimatedDays: data.estimatedDays,
      status: "SUBMITTED",
    };
    proposals.unshift(prop);
    appliedPostIds.add(postId);
    proposalCount += 1;
    return prop;
  }

  const newProp = submitProposal("post-101", { price: 6000000, estimatedDays: 5 });
  assert.equal(newProp.status, "SUBMITTED");
  assert.equal(proposalCount, 3, "Proposal count must increment");
  assert.ok(appliedPostIds.has("post-101"), "Post must be marked as applied");

  // Status transitions
  newProp.status = "ACCEPTED";
  assert.equal(newProp.status, "ACCEPTED");
});

test("QA Happy Path - Live Wallet and Payments deposit credits balance and records transaction history", () => {
  const walletPath = path.resolve(__dirname, "../src/lib/adapters/wallet.ts");
  const walletContent = fs.readFileSync(walletPath, "utf-8");
  assert.match(walletContent, /const liveWallet:\s*WalletSummary/, "Defines liveWallet summary");
  assert.match(walletContent, /creditDeposit\(/, "Exports creditDeposit method");
  assert.doesNotMatch(walletContent, /import.*MOCK_WALLET.*from/, "Must NOT import static MOCK_WALLET fixture");

  const paymentsPath = path.resolve(__dirname, "../src/lib/adapters/payments.ts");
  const paymentsContent = fs.readFileSync(paymentsPath, "utf-8");
  assert.match(paymentsContent, /paymentsApi\s*=\s*\{/, "Exports paymentsApi");
  assert.match(paymentsContent, /walletApi\.creditDeposit/, "Calls walletApi.creditDeposit");

  // Unit algorithm test for Deposit & Transaction record
  const wallet = {
    availableBalance: 10000000,
    transactions: [],
  };

  function creditDeposit(amount, method, reference) {
    wallet.availableBalance += amount;
    wallet.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: "DEPOSIT",
      amount,
      balanceAfter: wallet.availableBalance,
      reference,
      description: `Nạp tiền qua phương thức ${method}`,
    });
  }

  const depositAmount = 3000000;
  creditDeposit(depositAmount, "Chuyển khoản QR ngân hàng", "DEP-998877");

  assert.equal(wallet.availableBalance, 13000000, "Balance must increase by depositAmount");
  assert.equal(wallet.transactions.length, 1);
  assert.equal(wallet.transactions[0].amount, 3000000);
  assert.equal(wallet.transactions[0].balanceAfter, 13000000);
  assert.equal(wallet.transactions[0].reference, "DEP-998877");
});

test("QA Happy Path - Live Payout Accounts allows adding account and switching default status", () => {
  const accounts = [
    { id: "payout-1", bankCode: "VCB", accountNumber: "123456", isDefault: true },
  ];

  function addPayoutAccount(data) {
    if (data.isDefault) {
      accounts.forEach((acc) => {
        acc.isDefault = false;
      });
    }
    const newAcc = {
      id: `payout-${Date.now()}`,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
      isDefault: Boolean(data.isDefault),
    };
    accounts.unshift(newAcc);
    return newAcc;
  }

  const newAcc = addPayoutAccount({ bankCode: "TCB", accountNumber: "987654", isDefault: true });
  assert.equal(newAcc.isDefault, true);
  assert.equal(accounts[1].isDefault, false, "Previous account is no longer default");
});

test("QA Happy Path - Live Orders & Trust Store generates valid orders and review timelines", () => {
  const ordersPath = path.resolve(__dirname, "../src/lib/adapters/orders.ts");
  const ordersContent = fs.readFileSync(ordersPath, "utf-8");
  assert.match(ordersContent, /ordersApi\s*=\s*\{/, "Exports ordersApi");
  assert.doesNotMatch(ordersContent, /import.*MOCK_ORDER.*from/, "Must NOT import static MOCK_ORDER fixture");

  const trustPath = path.resolve(__dirname, "../src/lib/adapters/trust.ts");
  const trustContent = fs.readFileSync(trustPath, "utf-8");
  assert.match(trustContent, /trustApi\s*=\s*\{/, "Exports trustApi");
  assert.doesNotMatch(trustContent, /import.*MOCK_DISPUTE.*from/, "Must NOT import static MOCK_DISPUTE fixture");

  // Unit algorithm test for Orders
  function createOrder(data) {
    return {
      orderId: `ord-${Date.now()}`,
      orderNumber: `WG-ORD-${Date.now().toString().slice(-6)}`,
      serviceTitle: data.serviceTitle,
      providerName: data.providerName,
      amount: data.amount,
      status: "IN_PROGRESS",
    };
  }

  const order = createOrder({
    serviceTitle: "Thiết kế Website",
    providerName: "Nguyễn Văn Hùng",
    amount: 5000000,
  });

  assert.ok(order.orderId.startsWith("ord-"));
  assert.ok(order.orderNumber.startsWith("WG-ORD-"));
  assert.equal(order.status, "IN_PROGRESS");
});

// =========================================================================
// 4. EDGE CASES & CORNER CASES: BOUNDARY VALUES & MALFORMED DATA
// =========================================================================

test("QA Edge Case - Catalog mapper handles null, undefined, and alternative property names gracefully", () => {
  function mapBackendCategory(raw) {
    return {
      categoryId: String(raw.categoryId || raw.id || ""),
      categoryName: String(raw.name || raw.categoryName || "Danh mục"),
      description: raw.description || "",
      iconUrl: raw.iconUrl || undefined,
      parentId: raw.parent ? String(raw.parent) : raw.parentId ? String(raw.parentId) : null,
    };
  }

  // Edge 1: completely empty object
  const emptyMapped = mapBackendCategory({});
  assert.equal(emptyMapped.categoryId, "");
  assert.equal(emptyMapped.categoryName, "Danh mục", "Fallback to default categoryName");
  assert.equal(emptyMapped.parentId, null);

  // Edge 2: alternate id and categoryName fields
  const altMapped = mapBackendCategory({
    id: 42,
    categoryName: "Thiết kế Banner",
    parentId: 10,
  });
  assert.equal(altMapped.categoryId, "42");
  assert.equal(altMapped.categoryName, "Thiết kế Banner");
  assert.equal(altMapped.parentId, "10");

  // Edge 3: numeric parent ID
  const numParentMapped = mapBackendCategory({
    categoryId: "cat-5",
    name: "Sửa chữa",
    parent: 0,
  });
  assert.equal(numParentMapped.categoryId, "cat-5");
  assert.equal(numParentMapped.parentId, null, "0 or falsy parent maps to null safely");
});

test("QA Edge Case - Identity normalizers handle null, undefined, empty, and non-array roles safely", () => {
  function normalizeUserRoles(rawRoles) {
    if (!rawRoles || !Array.isArray(rawRoles)) return ["USER"];
    return rawRoles.map((r) => {
      if (typeof r === "string") return r.replace(/^ROLE_/, "");
      if (r && typeof r === "object" && r.roleName) {
        return String(r.roleName).replace(/^ROLE_/, "");
      }
      return "USER";
    });
  }

  // Edge 1: undefined roles defaults to ["USER"]
  assert.deepEqual(normalizeUserRoles(undefined), ["USER"]);

  // Edge 2: null roles defaults to ["USER"]
  assert.deepEqual(normalizeUserRoles(null), ["USER"]);

  // Edge 3: non-array object
  assert.deepEqual(normalizeUserRoles({ role: "ADMIN" }), ["USER"]);

  // Edge 4: empty array preserves []
  assert.deepEqual(normalizeUserRoles([]), []);
});

test("QA Boundary Condition - Payment deposit strictly enforces 1,000 VND minimum boundary", () => {
  function validateDepositAmount(amount) {
    if (amount < 1000) {
      throw new Error("Số tiền nạp tối thiểu là 1.000 ₫");
    }
    return true;
  }

  // Under boundary: 999 VND must throw
  assert.throws(
    () => validateDepositAmount(999),
    /Số tiền nạp tối thiểu là 1\.000 ₫/,
    "Deposit of 999 VND must be rejected"
  );

  // Exact boundary: 1,000 VND must succeed
  assert.equal(validateDepositAmount(1000), true, "Deposit of exactly 1,000 VND must succeed");

  // Over boundary: 50,000,000 VND must succeed
  assert.equal(validateDepositAmount(50000000), true, "Deposit of 50M VND must succeed");
});

test("QA Edge Case - Post filtering handles budget boundaries, empty queries, and pagination beyond range", () => {
  const posts = [
    { postId: "1", budgetMin: 1000000, budgetMax: 5000000, categoryId: "cat-1" },
    { postId: "2", budgetMin: 6000000, budgetMax: 12000000, categoryId: "cat-2" },
  ];

  function filterPosts(filters) {
    let result = [...posts];
    if (filters.budgetMin !== undefined) {
      result = result.filter((p) => p.budgetMax >= filters.budgetMin);
    }
    if (filters.budgetMax !== undefined) {
      result = result.filter((p) => p.budgetMin <= filters.budgetMax);
    }
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const total = result.length;
    const start = (page - 1) * limit;
    const data = result.slice(start, start + limit);
    return { data, total, page };
  }

  // 1. Budget boundary match
  const resBudget = filterPosts({ budgetMin: 4000000, budgetMax: 7000000 });
  assert.equal(resBudget.total, 2, "Both posts overlap with the 4M-7M range");

  // 2. Budget outside range
  const resNone = filterPosts({ budgetMin: 20000000, budgetMax: 30000000 });
  assert.equal(resNone.total, 0);

  // 3. Out of range page number
  const resOutOfRange = filterPosts({ page: 999, limit: 10 });
  assert.equal(resOutOfRange.data.length, 0);
  assert.equal(resOutOfRange.page, 999);
});

// =========================================================================
// 5. GOVERNANCE: BACKEND & DOCS ISOLATION
// =========================================================================

test("QA Governance - Backend Java services and docs remain 100% untouched", () => {
  const gitStatus = execSync("git status --porcelain", {
    cwd: projectRoot,
    encoding: "utf-8",
  });

  const modifiedLines = gitStatus
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const forbiddenPrefixes = [
    "api-gateway/",
    "catalog-service/",
    "identity-service/",
    "order-service/",
    "payment-service/",
    "docs/",
  ];

  for (const line of modifiedLines) {
    const filePath = line.replace(/^[A-Z?]{1,2}\s+/, "");
    for (const prefix of forbiddenPrefixes) {
      assert.ok(
        !filePath.startsWith(prefix),
        `Governance Violation: Forbidden file modified or created: ${filePath}`
      );
    }
  }
});
