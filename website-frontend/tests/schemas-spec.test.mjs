import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Schemas as specified in .team/PLAN.md §4.7
const registerSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(50),
    userName: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9._-]+$/),
    email: z.string().email(),
    phone: z.string().regex(/^0\d{9}$/),
    password: z
      .string()
      .min(8)
      .regex(/\d/),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "validation.passwordMatch",
  });

const loginSchema = z.object({
  userName: z.string().trim().min(1),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

const addressSchema = z.object({
  label: z.string().trim().min(1).max(50),
  contactName: z.string().trim().min(2).max(100),
  contactPhone: z.string().regex(/^0\d{9}$/),
  line1: z.string().trim().min(1),
  ward: z.string().trim().min(1),
  district: z.string().trim().min(1),
  city: z.string().trim().min(1),
  countryCode: z.string().default("VN"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  note: z.string().max(200).optional(),
});

const postSchema = z
  .object({
    title: z.string().trim().min(10).max(120),
    description: z.string().trim().min(20).max(5000),
    categoryId: z.string().min(1),
    budgetMin: z.number().positive(),
    budgetMax: z.number().positive(),
    executionType: z.enum([
      "DIGITAL",
      "ONSITE",
      "DELIVERY",
      "APPOINTMENT",
      "HOURLY",
      "PROJECT",
    ]),
    locationSnapshot: z.string().optional(),
    deadlineAt: z.coerce.date(),
  })
  .refine((v) => v.budgetMin <= v.budgetMax, {
    path: ["budgetMax"],
    message: "validation.budgetMinMax",
  })
  .refine(
    (v) => {
      if (v.executionType === "ONSITE" || v.executionType === "DELIVERY") {
        return !!v.locationSnapshot && v.locationSnapshot.trim().length > 0;
      }
      return true;
    },
    {
      path: ["locationSnapshot"],
      message: "validation.addressRequired",
    }
  );

const proposalSchema = z.object({
  price: z.number().int().positive(),
  estimatedDays: z.number().int().min(1).max(365),
  message: z.string().trim().min(10).max(1000),
  terms: z.string().max(2000).optional(),
});

const paymentSchema = z.object({
  method: z.enum(["CARD", "BANK", "EWALLET", "BALANCE", "PAYPAL"]),
  amount: z.number().int().min(1000),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// 1.0 Register Schema Tests
test("Schema Validation (1.0 Register) - Happy Path: Valid data passes", () => {
  const validData = {
    firstName: "Trung",
    lastName: "Tran",
    userName: "trunghuu",
    email: "trung@example.com",
    phone: "0912345678",
    password: "Password123",
    confirm: "Password123",
  };
  const result = registerSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test("Schema Validation (1.0 Register) - Edge Cases: Invalid inputs fail with correct errors", () => {
  // Password mismatch
  const mismatch = registerSchema.safeParse({
    firstName: "Trung",
    lastName: "Tran",
    userName: "trunghuu",
    email: "trung@example.com",
    phone: "0912345678",
    password: "Password123",
    confirm: "WrongPassword",
  });
  assert.equal(mismatch.success, false);

  // Phone invalid (not starting with 0 or not 10 digits)
  const badPhone = registerSchema.safeParse({
    firstName: "Trung",
    lastName: "Tran",
    userName: "trunghuu",
    email: "trung@example.com",
    phone: "84912345678", // 11 digits
    password: "Password123",
    confirm: "Password123",
  });
  assert.equal(badPhone.success, false);

  // Password missing digit
  const noDigit = registerSchema.safeParse({
    firstName: "Trung",
    lastName: "Tran",
    userName: "trunghuu",
    email: "trung@example.com",
    phone: "0912345678",
    password: "PasswordOnly",
    confirm: "PasswordOnly",
  });
  assert.equal(noDigit.success, false);
});

// 2.0 Login Schema Tests
test("Schema Validation (2.0 Login) - Happy Path & Edge Cases", () => {
  const valid = loginSchema.safeParse({
    userName: "user_123",
    password: "secretPassword",
    remember: true,
  });
  assert.equal(valid.success, true);

  const emptyUser = loginSchema.safeParse({
    userName: "   ",
    password: "secretPassword",
  });
  assert.equal(emptyUser.success, false);
});

// 47.0 Job Post Schema Tests
test("Schema Validation (47.0 Job Post) - Happy Path & Edge Cases", () => {
  const validPost = {
    title: "Tuyển thiết kế UI/UX ứng dụng di động",
    description: "Mô tả công việc chi tiết với độ dài tối thiểu trên 20 ký tự chuẩn.",
    categoryId: "cat_ui_ux",
    budgetMin: 5000000,
    budgetMax: 10000000,
    executionType: "DIGITAL",
    deadlineAt: new Date(Date.now() + 86400000 * 5),
  };
  const result = postSchema.safeParse(validPost);
  assert.equal(result.success, true);

  // Edge case: budgetMin > budgetMax
  const invalidBudget = postSchema.safeParse({
    ...validPost,
    budgetMin: 12000000,
    budgetMax: 5000000,
  });
  assert.equal(invalidBudget.success, false);

  // Edge case: executionType ONSITE without locationSnapshot
  const onsiteNoLoc = postSchema.safeParse({
    ...validPost,
    executionType: "ONSITE",
    locationSnapshot: "",
  });
  assert.equal(onsiteNoLoc.success, false);
});

// 48.0 Proposal Schema Tests
test("Schema Validation (48.0 Submit Proposal) - Happy Path & Boundary Cases", () => {
  const valid = proposalSchema.safeParse({
    price: 3500000,
    estimatedDays: 7,
    message: "Tôi có 5 năm kinh nghiệm thiết kế Mobile App và sẵn sàng làm ngay.",
  });
  assert.equal(valid.success, true);

  // Boundary: estimatedDays = 0 or > 365
  const zeroDays = proposalSchema.safeParse({
    price: 3500000,
    estimatedDays: 0,
    message: "Đề xuất hợp lệ nhưng ngày bằng 0",
  });
  assert.equal(zeroDays.success, false);

  // Boundary: price <= 0
  const negativePrice = proposalSchema.safeParse({
    price: -100,
    estimatedDays: 5,
    message: "Đề xuất hợp lệ nhưng giá âm",
  });
  assert.equal(negativePrice.success, false);
});

// 80.0 Payment Schema Tests
test("Schema Validation (80.0 Payment) - Min Deposit Boundary", () => {
  const valid = paymentSchema.safeParse({
    method: "BANK",
    amount: 50000,
  });
  assert.equal(valid.success, true);

  // Boundary: amount < 1000 VND
  const belowMin = paymentSchema.safeParse({
    method: "BANK",
    amount: 500,
  });
  assert.equal(belowMin.success, false);
});

// 115.0 Review Schema Tests
test("Schema Validation (115.0 Review) - Star Rating 1-5 Boundary", () => {
  const valid = reviewSchema.safeParse({
    rating: 5,
    comment: "Dịch vụ tuyệt vời, hoàn thành trước hạn!",
  });
  assert.equal(valid.success, true);

  // Boundary: rating 0 or 6
  assert.equal(reviewSchema.safeParse({ rating: 0 }).success, false);
  assert.equal(reviewSchema.safeParse({ rating: 6 }).success, false);
});

// 5.0 Address Book Schema Tests
test("Schema Validation (5.0 Address Book) - Happy Path & Boundary Cases", () => {
  const validAddress = {
    label: "Văn phòng làm việc",
    contactName: "Trần Hữu Trung",
    contactPhone: "0987654321",
    line1: "123 Đường Nguyễn Trãi",
    ward: "Phường Bến Thành",
    district: "Quận 1",
    city: "Hồ Chí Minh",
    countryCode: "VN",
    latitude: 10.7769,
    longitude: 106.7009,
    note: "Tòa nhà Bitexco tầng 12",
  };
  assert.equal(addressSchema.safeParse(validAddress).success, true);

  // Edge: phone invalid
  assert.equal(
    addressSchema.safeParse({ ...validAddress, contactPhone: "12345" }).success,
    false
  );

  // Boundary: latitude out of bounds (> 90)
  assert.equal(
    addressSchema.safeParse({ ...validAddress, latitude: 95 }).success,
    false
  );
});

