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

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginIdentifierSchema = z
  .string()
  .transform((v) => stripHtml(v))
  .pipe(
    z.string().min(1, "Vui lòng nhập tài khoản hoặc email!").refine(
      (val) => val.toLowerCase() === "admin" || z.string().email().safeParse(val).success,
      { message: "Vui lòng nhập email hợp lệ hoặc tài khoản admin!" }
    )
  );

export const loginSchema = z.object({
  email: loginIdentifierSchema,
  password: passwordSchema,
});

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
