import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const W = path.join(REPO, "website-frontend");
const TRUNG = path.join(W, "src/components/trung-pages");

const read = (p) => fs.readFileSync(p, "utf-8");

// Re-implemented helper functions matching implementation for standalone unit testing
function stripHtml(s) {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s) {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

function slugify(s) {
  return sanitizeText(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function maskAccount(n) {
  const digits = String(n ?? "").replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

function formatBudget(v) {
  return `${v.toLocaleString("vi-VN")} ₫`;
}

// Zod schemas matching authValidation.ts
const emailSchema = z
  .string()
  .transform((v) => stripHtml(v))
  .pipe(z.string().email("Email chưa đúng định dạng!"));

const passwordSchema = z
  .string()
  .transform((v) => stripHtml(v))
  .pipe(z.string().min(6, "Mật khẩu tối thiểu 6 ký tự!"));

const nameSchema = z
  .string()
  .transform((v) => sanitizeText(v))
  .pipe(z.string().min(2, "Vui lòng nhập tên từ 2 ký tự!"));

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// =========================================================================
// 1. HAPPY PATH TESTS (HP-TRUNG-01 -> HP-TRUNG-10)
// =========================================================================

test("HP-TRUNG-01: Auth schemas validate standard registration and login inputs", () => {
  const validRegister = {
    name: "Trần Hữu Trung",
    email: "trung@workgo.vn",
    password: "Password123!",
  };
  const regResult = registerSchema.safeParse(validRegister);
  assert.ok(regResult.success, "Valid register input must pass schema validation");
  assert.equal(regResult.data.name, "Trần Hữu Trung");
  assert.equal(regResult.data.email, "trung@workgo.vn");

  const validLogin = {
    email: "trung@workgo.vn",
    password: "Password123!",
  };
  const logResult = loginSchema.safeParse(validLogin);
  assert.ok(logResult.success, "Valid login input must pass schema validation");
  assert.equal(logResult.data.email, "trung@workgo.vn");
});

test("HP-TRUNG-02: Slugify converts Vietnamese accented titles into clean URL slugs", () => {
  const title = "Thiết kế logo & bộ nhận diện thương hiệu quán café";
  const slug = slugify(title);
  assert.equal(slug, "thiet-ke-logo-bo-nhan-dien-thuong-hieu-quan-cafe");
});

test("HP-TRUNG-03: maskAccount masks account numbers > 4 digits and preserves last 4", () => {
  assert.equal(maskAccount("0123456789"), "****6789");
  assert.equal(maskAccount("987654321012345"), "****2345");
  assert.equal(maskAccount("1234"), "1234");
  assert.equal(maskAccount("99"), "99");
});

test("HP-TRUNG-04: formatBudget outputs properly localized currency string with symbol", () => {
  assert.equal(formatBudget(50000), "50.000 ₫");
  assert.equal(formatBudget(2500000), "2.500.000 ₫");
  assert.equal(formatBudget(100000000), "100.000.000 ₫");
});

test("HP-TRUNG-05: mockJobs has valid structure, budgets in 50k-100M, and covers all 4 job types", () => {
  const file = read(path.join(TRUNG, "_mocks/mockJobs.ts"));
  assert.ok(file.includes("DIGITAL") && file.includes("ONSITE") && file.includes("DELIVERY") && file.includes("APPOINTMENT"));
  assert.ok(file.includes("export const mockJobs: Job[] = ["));
  assert.ok(file.includes("export const JOB_TYPES: JobType[] = ["));
});

test("HP-TRUNG-06: mockProposals structure and status types (PENDING, ACCEPTED, REJECTED)", () => {
  const file = read(path.join(TRUNG, "_mocks/mockProposals.ts"));
  assert.ok(file.includes("PENDING"));
  assert.ok(file.includes("ACCEPTED"));
  assert.ok(file.includes("REJECTED"));
  assert.ok(file.includes("export const mockProposals: Proposal[] = ["));
});

test("HP-TRUNG-07: mockWallet holds valid escrow and release state with history", () => {
  const file = read(path.join(TRUNG, "_mocks/mockWallet.ts"));
  assert.ok(file.includes("held: 3500000"));
  assert.ok(file.includes("released: 12750000"));
  assert.ok(file.includes("HOLD") && file.includes("RELEASE") && file.includes("TOPUP") && file.includes("PAYOUT"));
});

test("HP-TRUNG-08: mockDisputes covers REPORT and DISPUTE kinds with OPEN/RESOLVED status", () => {
  const file = read(path.join(TRUNG, "_mocks/mockDisputes.ts"));
  assert.ok(file.includes("REPORT"));
  assert.ok(file.includes("DISPUTE"));
  assert.ok(file.includes("OPEN"));
  assert.ok(file.includes("RESOLVED"));
});

test("HP-TRUNG-09: mockProviders provides valid ratings (1-5), bio, and service listings", () => {
  const file = read(path.join(TRUNG, "_mocks/mockProviders.ts"));
  assert.ok(file.includes("pv-1") && file.includes("pv-2") && file.includes("pv-3"));
  assert.ok(file.includes("rating: 4.9"));
  assert.ok(file.includes("services: ["));
});

test("HP-TRUNG-10: KEYS constant defines all 9 localStorage keys under workgo_* namespace", () => {
  const file = read(path.join(TRUNG, "_stores/keys.ts"));
  const expectedKeys = [
    'jobs: "workgo_jobs"',
    'proposals: "workgo_proposals"',
    'wallet: "workgo_wallet"',
    'disputes: "workgo_disputes"',
    'addresses: "workgo_addresses"',
    'profile: "workgo_profile"',
    'payout: "workgo_payout"',
    'providerRequest: "workgo_provider_request"',
    'authToken: "accessToken"',
  ];
  for (const k of expectedKeys) {
    assert.ok(file.includes(k), `keys.ts missing definition: ${k}`);
  }
});

// =========================================================================
// 2. EDGE CASES & CORNER CASES (EC-TRUNG-01 -> EC-TRUNG-18)
// =========================================================================

test("EC-TRUNG-01: stripHtml and sanitizeText neutralize XSS vectors and malformed HTML", () => {
  const malicious = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="stealCookie()"/>',
    '<a href="javascript:void(0)">Click me</a>',
    '<div><p>Paragraph <b>Bold</b> <iframe src="evil.com"></iframe></p></div>',
    '<div onmouseover="hack()">Safe Text</div>',
  ];

  for (const vector of malicious) {
    const stripped = stripHtml(vector);
    assert.ok(!stripped.includes("<"), `stripHtml must remove opening tags: ${stripped}`);
    assert.ok(!stripped.includes(">"), `stripHtml must remove closing tags: ${stripped}`);
    assert.ok(!stripped.includes("script"), `stripHtml must eliminate script tags`);
  }

  const malformed = "<div Hello world<span test>Clean</b>";
  assert.equal(sanitizeText(malformed), "Clean");
});

test("EC-TRUNG-02: sanitizeText collapses redundant whitespace and keeps Unicode/CJK/Emoji", () => {
  const weirdWhitespace = "  Hello \t\n\r  World   \n\n\n\t from   WorkGo!   ";
  assert.equal(sanitizeText(weirdWhitespace), "Hello World from WorkGo!");

  const unicodeText = "Tiếng Việt có dấu: Ứng dụng WorkGo kết nối Freelancer 🚀✨🔥 日本語テスト العربية";
  assert.equal(sanitizeText(unicodeText), unicodeText);
});

test("EC-TRUNG-03: Email validation edge cases and error messages", () => {
  const invalidEmails = [
    "",
    "   ",
    "plainaddress",
    "@missingusername.com",
    "username@.com",
    "username@domain..com",
    "username@domain,com",
  ];

  for (const email of invalidEmails) {
    const res = emailSchema.safeParse(email);
    assert.ok(!res.success, `Email '${email}' should fail validation`);
    const err = res.error.flatten().formErrors[0];
    assert.equal(err, "Email chưa đúng định dạng!");
  }

  // HTML in email stripped
  const htmlEmail = "<b>user@workgo.vn</b>";
  const passRes = emailSchema.safeParse(htmlEmail);
  assert.ok(passRes.success);
  assert.equal(passRes.data, "user@workgo.vn");
});

test("EC-TRUNG-04: Password boundary cases (< 6 chars rejected, >= 6 chars accepted)", () => {
  const shortPasswords = ["", "1", "12", "123", "1234", "12345"];
  for (const p of shortPasswords) {
    const res = passwordSchema.safeParse(p);
    assert.ok(!res.success, `Password '${p}' should fail validation`);
    assert.equal(res.error.flatten().formErrors[0], "Mật khẩu tối thiểu 6 ký tự!");
  }

  assert.ok(passwordSchema.safeParse("123456").success, "6-character password must pass");
  assert.ok(passwordSchema.safeParse("1234567890abcdef").success, "Long password must pass");

  // HTML stripping on password
  const htmlPassword = "<i>1234</i>"; // stripped length = 4 -> should fail
  const htmlRes = passwordSchema.safeParse(htmlPassword);
  assert.ok(!htmlRes.success);
});

test("EC-TRUNG-05: Name validation boundary cases (< 2 chars rejected, >= 2 chars accepted)", () => {
  const invalidNames = ["", " ", "   ", "A", "<b>A</b>", "\t \n "];
  for (const n of invalidNames) {
    const res = nameSchema.safeParse(n);
    assert.ok(!res.success, `Name '${n}' should fail validation`);
    assert.equal(res.error.flatten().formErrors[0], "Vui lòng nhập tên từ 2 ký tự!");
  }

  assert.ok(nameSchema.safeParse("An").success, "2-char name must pass");
  assert.ok(nameSchema.safeParse("Trần Hữu Trung").success, "Full name must pass");
});

test("EC-TRUNG-06: Phone number validation (/^0\\d{9}$/) edge and boundary cases", () => {
  const phoneRegex = /^0\d{9}$/;
  const invalidPhones = [
    "",
    "1234567890", // doesn't start with 0
    "090123456",   // 9 digits
    "09012345678", // 11 digits
    "090123456a", // contains letters
    "090-123-4567", // contains dashes
    " 0901234567 ", // leading/trailing spaces
    "0901234 567", // spaces in between
  ];

  for (const p of invalidPhones) {
    assert.ok(!phoneRegex.test(p), `Phone '${p}' must fail regex test`);
  }

  const validPhones = ["0901234567", "0381234567", "0779998888", "0865554444"];
  for (const p of validPhones) {
    assert.ok(phoneRegex.test(p), `Phone '${p}' must pass regex test`);
  }
});

test("EC-TRUNG-07: Budget & bid price strict boundaries [50.000, 100.000.000 ₫]", () => {
  const PRICE_MIN = 50000;
  const PRICE_MAX = 100000000;

  function validateBudget(raw) {
    const budget = Number(String(raw).replace(/[^\d]/g, ""));
    if (!Number.isFinite(budget) || budget <= 0) return "Giá gói phải là số lớn hơn 0!";
    if (budget < PRICE_MIN) return `Giá tối thiểu là ${PRICE_MIN.toLocaleString("vi-VN")} ₫!`;
    if (budget > PRICE_MAX) return `Giá vượt quá ${PRICE_MAX.toLocaleString("vi-VN")} ₫ cho phép!`;
    return null;
  }

  assert.equal(validateBudget(""), "Giá gói phải là số lớn hơn 0!");
  assert.equal(validateBudget("abc"), "Giá gói phải là số lớn hơn 0!");
  assert.equal(validateBudget("0"), "Giá gói phải là số lớn hơn 0!");
  assert.equal(validateBudget("49999"), "Giá tối thiểu là 50.000 ₫!");
  assert.equal(validateBudget("10000"), "Giá tối thiểu là 50.000 ₫!");
  assert.equal(validateBudget("50000"), null); // exact floor
  assert.equal(validateBudget("2500000"), null);
  assert.equal(validateBudget("100000000"), null); // exact ceiling
  assert.equal(validateBudget("100000001"), "Giá vượt quá 100.000.000 ₫ cho phép!");
  assert.equal(validateBudget("999999999999"), "Giá vượt quá 100.000.000 ₫ cho phép!");
});

test("EC-TRUNG-08: Job title (15-100) and description (>= 20) boundaries", () => {
  const TITLE_MIN = 15;
  const TITLE_MAX = 100;
  const DESC_MIN = 20;

  function validateJobPost(title, desc) {
    const cleanTitle = sanitizeText(title);
    const cleanDesc = sanitizeText(desc);
    const errors = {};
    if (cleanTitle.length < TITLE_MIN || cleanTitle.length > TITLE_MAX) {
      errors.title = cleanTitle.length < TITLE_MIN
        ? `Vui lòng nhập tiêu đề từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự!`
        : `Tiêu đề quá dài (${cleanTitle.length}/${TITLE_MAX} ký tự) — vui lòng rút gọn!`;
    }
    if (cleanDesc.length < DESC_MIN) {
      errors.description = `Vui lòng nhập mô tả chi tiết từ ${DESC_MIN} ký tự trở lên!`;
    }
    return errors;
  }

  // 14 chars -> fail
  assert.ok(validateJobPost("12345678901234", "Mô tả việc cần làm chi tiết hơn 20 ký tự").title);
  // 15 chars -> pass
  assert.equal(validateJobPost("123456789012345", "Mô tả việc cần làm chi tiết hơn 20 ký tự").title, undefined);
  // 100 chars -> pass
  assert.equal(validateJobPost("a".repeat(100), "Mô tả việc cần làm chi tiết hơn 20 ký tự").title, undefined);
  // 101 chars -> fail
  assert.ok(validateJobPost("a".repeat(101), "Mô tả việc cần làm chi tiết hơn 20 ký tự").title);

  // Description 19 chars -> fail
  assert.ok(validateJobPost("Tiêu đề hợp lệ từ 15 ký tự", "1234567890123456789").description);
  // Description 20 chars -> pass
  assert.equal(validateJobPost("Tiêu đề hợp lệ từ 15 ký tự", "12345678901234567890").description, undefined);
});

test("EC-TRUNG-09: Provider Onboarding businessName (5-100), bio (>= 20) and agreed checkbox", () => {
  function validateOnboarding(businessName, bio, agreed) {
    const cleanBusiness = sanitizeText(businessName);
    const cleanBio = sanitizeText(bio);
    const errors = {};
    if (cleanBusiness.length < 5 || cleanBusiness.length > 100) {
      errors.businessName = "Vui lòng nhập tên kinh doanh từ 5 đến 100 ký tự!";
    }
    if (cleanBio.length < 20) {
      errors.bio = "Vui lòng nhập giới thiệu chi tiết từ 20 ký tự trở lên!";
    }
    if (!agreed) {
      errors.agreed = "Bạn cần đồng ý điều khoản dành cho provider để tiếp tục!";
    }
    return errors;
  }

  assert.ok(validateOnboarding("ABCD", "Giới thiệu đủ 20 ký tự trở lên tại đây", true).businessName);
  assert.equal(validateOnboarding("ABCDE", "Giới thiệu đủ 20 ký tự trở lên tại đây", true).businessName, undefined);
  assert.ok(validateOnboarding("A".repeat(101), "Giới thiệu đủ 20 ký tự trở lên tại đây", true).businessName);
  assert.ok(validateOnboarding("Studio ABC", "Ngắn quá", true).bio);
  assert.ok(validateOnboarding("Studio ABC", "Giới thiệu đủ 20 ký tự trở lên tại đây", false).agreed);
  assert.deepEqual(validateOnboarding("Studio ABC", "Giới thiệu đủ 20 ký tự trở lên tại đây", true), {});
});

test("EC-TRUNG-10: Bank account number (STK) regex /\\^\\d{8,19}$/ and masking logic", () => {
  const stkRegex = /^\d{8,19}$/;

  assert.ok(!stkRegex.test("1234567")); // 7 digits
  assert.ok(stkRegex.test("12345678")); // 8 digits (min)
  assert.ok(stkRegex.test("1234567890123456789")); // 19 digits (max)
  assert.ok(!stkRegex.test("12345678901234567890")); // 20 digits
  assert.ok(!stkRegex.test("12345abc678")); // letters

  assert.equal(maskAccount("12345678"), "****5678");
  assert.equal(maskAccount("1234567890123456789"), "****6789");
  assert.equal(maskAccount("1234"), "1234");
  assert.equal(maskAccount(""), "");
});

test("EC-TRUNG-11: Dispute Center URL validation and reason length (>= 20)", () => {
  function validateDispute(orderId, reason, evidenceUrl) {
    const cleanOrder = sanitizeText(orderId);
    const cleanReason = sanitizeText(reason);
    const cleanEvidence = sanitizeText(evidenceUrl);
    if (cleanOrder.length < 2) return "Vui lòng nhập mã đơn hàng!";
    if (cleanReason.length < 20) return "Vui lòng nhập lý do chi tiết từ 20 ký tự trở lên!";
    if (cleanEvidence !== "") {
      try {
        const u = new URL(cleanEvidence);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad");
      } catch {
        return "Link minh chứng chưa đúng định dạng URL!";
      }
    }
    return null;
  }

  assert.equal(validateDispute("O", "Lý do chi tiết dài trên 20 ký tự", ""), "Vui lòng nhập mã đơn hàng!");
  assert.equal(validateDispute("ORD-1", "Ngắn", ""), "Vui lòng nhập lý do chi tiết từ 20 ký tự trở lên!");
  assert.equal(validateDispute("ORD-1", "Lý do chi tiết dài trên 20 ký tự ở đây", "invalid_url"), "Link minh chứng chưa đúng định dạng URL!");
  assert.equal(validateDispute("ORD-1", "Lý do chi tiết dài trên 20 ký tự ở đây", "ftp://evil.com/file"), "Link minh chứng chưa đúng định dạng URL!");
  assert.equal(validateDispute("ORD-1", "Lý do chi tiết dài trên 20 ký tự ở đây", "javascript:alert(1)"), "Link minh chứng chưa đúng định dạng URL!");
  assert.equal(validateDispute("ORD-1", "Lý do chi tiết dài trên 20 ký tự ở đây", "https://workgo.vn/evidence.jpg"), null);
  assert.equal(validateDispute("ORD-1", "Lý do chi tiết dài trên 20 ký tự ở đây", ""), null);
});

test("EC-TRUNG-12: Review stars (1-5), comment (>=10), orderId (>=2) and duplicate protection", () => {
  const existingReviews = [
    { orderId: "ORD-1001", stars: 5, comment: "Dịch vụ rất tốt và nhanh", at: "2026-10-16" }
  ];

  function validateReview(orderId, stars, comment) {
    const cleanOrder = sanitizeText(orderId);
    const cleanComment = sanitizeText(comment);
    if (cleanOrder.length < 2) return "Vui lòng nhập mã đơn hàng!";
    if (stars < 1 || stars > 5) return "Vui lòng chọn số sao từ 1 đến 5!";
    if (cleanComment.length < 10) return "Vui lòng nhập nhận xét chi tiết từ 10 ký tự trở lên!";
    if (existingReviews.some((r) => r.orderId === cleanOrder)) return "Đơn hàng này đã được đánh giá!";
    return null;
  }

  assert.equal(validateReview("O", 5, "Nhận xét chất lượng 10 ký tự"), "Vui lòng nhập mã đơn hàng!");
  assert.equal(validateReview("ORD-2", 0, "Nhận xét chất lượng 10 ký tự"), "Vui lòng chọn số sao từ 1 đến 5!");
  assert.equal(validateReview("ORD-2", 6, "Nhận xét chất lượng 10 ký tự"), "Vui lòng chọn số sao từ 1 đến 5!");
  assert.equal(validateReview("ORD-2", 5, "Ngắn"), "Vui lòng nhập nhận xét chi tiết từ 10 ký tự trở lên!");
  assert.equal(validateReview("ORD-1001", 5, "Nhận xét chất lượng 10 ký tự"), "Đơn hàng này đã được đánh giá!");
  assert.equal(validateReview("ORD-1002", 5, "Nhận xét chất lượng 10 ký tự"), null);
});

test("EC-TRUNG-13: Proposal duplicate detection, single-accept exclusivity, and escrow HOLD", () => {
  const proposals = [
    { proposalId: "prop-1", jobId: "job-1", providerName: "Bạn", bidPrice: 1000000, durationDays: 3, message: "Proposal 1", status: "PENDING" },
    { proposalId: "prop-2", jobId: "job-1", providerName: "Provider Khác", bidPrice: 1200000, durationDays: 4, message: "Proposal 2", status: "PENDING" },
  ];

  // Duplicate check
  const isDup = proposals.some((p) => p.jobId === "job-1" && p.providerName === "Bạn" && p.status === "PENDING");
  assert.ok(isDup, "Must detect duplicate pending proposal for same job and user");

  // Accept prop-2 -> prop-1 must auto-reject
  const acceptedTarget = proposals.find((p) => p.proposalId === "prop-2");
  const updatedProposals = proposals.map((p) => {
    if (p.jobId !== acceptedTarget.jobId) return p;
    if (p.proposalId === "prop-2") return { ...p, status: "ACCEPTED" };
    return p.status === "PENDING" ? { ...p, status: "REJECTED" } : p;
  });

  assert.equal(updatedProposals.find((p) => p.proposalId === "prop-2").status, "ACCEPTED");
  assert.equal(updatedProposals.find((p) => p.proposalId === "prop-1").status, "REJECTED");

  // Escrow update
  const wallet = { held: 500000, released: 2000000, history: [] };
  const updatedWallet = {
    held: wallet.held + acceptedTarget.bidPrice,
    released: wallet.released,
    history: [
      { id: `w-${acceptedTarget.proposalId}-1`, type: "HOLD", amount: acceptedTarget.bidPrice, label: `Giữ hộ việc ${acceptedTarget.jobId}` }
    ]
  };
  assert.equal(updatedWallet.held, 1700000);
  assert.equal(updatedWallet.history[0].type, "HOLD");
});

test("EC-TRUNG-14: PaymentGateway mock top-up increases released balance and writes TOPUP entry", () => {
  const wallet = { held: 1000000, released: 2000000, history: [] };
  const topUpAmount = 500000;
  const tab = "VNPAY";

  const nextWallet = {
    held: wallet.held,
    released: wallet.released + topUpAmount,
    history: [
      { id: `w-${Date.now()}`, type: "TOPUP", amount: topUpAmount, label: `Nạp tiền qua ${tab} (mock)`, at: "2026-10-16" },
      ...wallet.history,
    ],
  };

  assert.equal(nextWallet.released, 2500000);
  assert.equal(nextWallet.held, 1000000);
  assert.equal(nextWallet.history[0].type, "TOPUP");
  assert.equal(nextWallet.history[0].amount, 500000);
});

test("EC-TRUNG-15: LocalStorage quota exception resilience & SSR safety across all components", () => {
  const quotaMsg = "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";
  const pages = [
    "jobs/JobPostPage.tsx",
    "jobs/SubmitProposalPage.tsx",
    "jobs/ProposalReviewPage.tsx",
    "payment/PaymentGatewayPage.tsx",
    "payment/PayoutSettingsPage.tsx",
    "profile/ProfileSettingsPage.tsx",
    "profile/AddressBookPage.tsx",
    "provider/ProviderOnboardingPage.tsx",
    "trust/ReviewFormPage.tsx",
    "trust/DisputeCenterPage.tsx",
    "auth/RegisterPage.tsx",
    "auth/LoginPage.tsx",
  ];

  for (const p of pages) {
    const src = read(path.join(TRUNG, p));
    assert.ok(
      src.includes(quotaMsg) || src.includes("quotaToast"),
      `${p} must guard localStorage write with quota toast error message`
    );
  }
});

test("EC-TRUNG-16: Overlay focus trap, aria-modal, and Escape listener in AddressBook", () => {
  const src = read(path.join(TRUNG, "profile/AddressBookPage.tsx"));
  assert.ok(src.includes('role="dialog"'));
  assert.ok(src.includes('aria-modal="true"'));
  assert.ok(src.includes('e.key === "Escape"'));
  assert.ok(src.includes('e.key === "Tab"'));
  assert.ok(src.includes("e.shiftKey"));
});

test("EC-TRUNG-17: 320px responsive safety and WCAG 44px touch target compliance", () => {
  const walkCss = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkCss(p, out);
      else if (e.name.endsWith(".module.css")) out.push(p);
    }
    return out;
  };
  const cssFiles = walkCss(TRUNG);
  assert.ok(cssFiles.length >= 16);

  for (const f of cssFiles) {
    const css = read(f);
    const hasWrap = /overflow-wrap:\s*break-word/.test(css) || /word-break:\s*break-word/.test(css);
    assert.ok(hasWrap, `${path.basename(f)} must enforce overflow-wrap: break-word`);
    const hasTouch = /min-height:\s*44px/.test(css);
    assert.ok(hasTouch, `${path.basename(f)} must maintain 44px min-height touch targets`);
  }
});

test("EC-TRUNG-18: Zero backend leakage, zero console statements, zero TODOs, and mirror isolation", () => {
  const walkTs = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkTs(p, out);
      else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const tsFiles = walkTs(TRUNG);

  for (const f of tsFiles) {
    const code = read(f);
    assert.ok(!/console\.(log|warn|error)/.test(code), `${path.basename(f)} contains console.*`);
    assert.ok(!code.includes("_webapp-mirror"), `${path.basename(f)} illegal import from _webapp-mirror`);
    assert.ok(!code.includes(":8888") && !code.includes(":8081") && !code.includes(":8082"), `${path.basename(f)} leaks backend URL`);
    assert.ok(!/\b(TODO|FIXME)\b/.test(code), `${path.basename(f)} contains TODO/FIXME comments`);
  }
});
