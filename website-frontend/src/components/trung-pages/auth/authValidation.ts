import { z } from "zod";

export function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

export function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

export const emailSchema = z
  .string()
  .transform((v) => stripHtml(v))
  .pipe(z.string().email("Email chưa đúng định dạng!"));

export const passwordSchema = z
  .string()
  .transform((v) => stripHtml(v))
  .pipe(z.string().min(6, "Mật khẩu tối thiểu 6 ký tự!"));

export const nameSchema = z
  .string()
  .transform((v) => sanitizeText(v))
  .pipe(z.string().min(2, "Vui lòng nhập tên từ 2 ký tự!"));

export const userNameSchema = z
  .string()
  .transform((v) => stripHtml(v).trim())
  .pipe(
    z
      .string()
      .min(3, "Tên đăng nhập tối thiểu 3 ký tự!")
      .regex(/^[A-Za-z0-9._-]+$/, "Tên đăng nhập chỉ gồm chữ, số, dấu . _ -")
  );

export const phoneSchema = z
  .string()
  .transform((v) => stripHtml(v).replace(/\s+/g, ""))
  .pipe(z.string().regex(/^0\d{9}$/, "Số điện thoại gồm 10 số, bắt đầu bằng 0!"));

export const registerSchema = z.object({
  name: nameSchema,
  userName: userNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

// identity-service authenticates by userName (POST /auth/token).
export const loginSchema = z.object({
  userName: userNameSchema,
  password: passwordSchema,
});

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
