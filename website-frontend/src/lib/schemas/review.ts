import { z } from "zod";

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "validation.ratingRequired")
    .max(5, "validation.ratingRequired"),
  comment: z.string().trim().max(500, "validation.max500").optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
