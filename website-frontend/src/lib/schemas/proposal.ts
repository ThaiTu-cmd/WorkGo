import { z } from "zod";

export const proposalSchema = z.object({
  price: z.number().int().positive("validation.priceMin"),
  estimatedDays: z
    .number()
    .int()
    .min(1, "validation.estimatedDaysMin")
    .max(365, "validation.maxDays365"),
  message: z.string().trim().min(10, "validation.descMin").max(1000, "validation.max1000"),
  terms: z.string().trim().max(2000, "validation.max2000").optional(),
});

export type ProposalFormData = z.infer<typeof proposalSchema>;
