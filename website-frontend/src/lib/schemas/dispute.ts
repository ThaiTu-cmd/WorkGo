import { z } from "zod";

export const disputeSchema = z.object({
  reason: z.string().trim().min(5, "validation.reasonRequired").max(200),
  description: z.string().trim().min(10, "validation.descMin").max(2000),
});

export type DisputeFormData = z.infer<typeof disputeSchema>;

export const reportSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(["USER", "POST", "SERVICE", "REVIEW", "MESSAGE"]),
  reason: z.string().trim().min(5, "validation.reasonRequired").max(200),
  description: z.string().trim().max(2000).optional(),
});

export type ReportFormData = z.infer<typeof reportSchema>;
