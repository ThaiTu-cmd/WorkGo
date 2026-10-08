import { z } from "zod";

export const userProfileSchema = z.object({
  firstName: z.string().trim().min(2, "validation.required").max(50),
  lastName: z.string().trim().min(2, "validation.required").max(50),
  phone: z.string().trim().regex(/^0\d{9}$/, "validation.phone"),
  email: z.string().email().optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

export const providerProfileSchema = z.object({
  providerType: z.enum(["INDIVIDUAL", "COMPANY"]),
  businessName: z.string().trim().min(1, "validation.required").max(100),
  bio: z.string().trim().min(20, "validation.descMin").max(1000, "validation.max1000"),
  isAcceptingOrders: z.boolean(),
});

export type ProviderProfileFormData = z.infer<typeof providerProfileSchema>;
