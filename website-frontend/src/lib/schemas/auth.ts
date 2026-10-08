import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "validation.required")
      .max(50, "validation.max50"),
    lastName: z
      .string()
      .trim()
      .min(2, "validation.required")
      .max(50, "validation.max50"),
    userName: z
      .string()
      .trim()
      .min(3, "validation.userNameMin")
      .max(50, "validation.max50")
      .regex(/^[a-zA-Z0-9._-]+$/, "validation.userNameRegex"),
    email: z.string().trim().email("validation.email"),
    phone: z.string().trim().regex(/^0\d{9}$/, "validation.phone"),
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .regex(/\d/, "validation.passwordDigit"),
    confirm: z.string(),
    agreeTerms: z.boolean().refine((v) => v === true, {
      message: "validation.agreeTermsRequired",
    }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "validation.passwordMatch",
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  userName: z.string().trim().min(1, "validation.required"),
  password: z.string().min(1, "validation.required"),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
