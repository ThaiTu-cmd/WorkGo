import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().min(1, "validation.required").max(50, "validation.max50"),
  contactName: z.string().trim().min(2, "validation.required").max(100, "validation.max100"),
  contactPhone: z.string().trim().regex(/^0\d{9}$/, "validation.phone"),
  line1: z.string().trim().min(1, "validation.required"),
  ward: z.string().trim().min(1, "validation.required"),
  district: z.string().trim().min(1, "validation.required"),
  city: z.string().trim().min(1, "validation.required"),
  countryCode: z.string(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  note: z.string().max(200, "validation.max200").optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
export type AddressFormInput = z.input<typeof addressSchema>;
