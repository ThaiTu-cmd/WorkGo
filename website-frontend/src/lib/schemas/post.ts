import { z } from "zod";

export const EXECUTION_TYPES = [
  "DIGITAL",
  "ONSITE",
  "DELIVERY",
  "APPOINTMENT",
  "HOURLY",
  "PROJECT",
] as const;

export const postSchema = z
  .object({
    title: z.string().trim().min(10, "validation.titleMin").max(120, "validation.titleMax"),
    description: z.string().trim().min(20, "validation.descMin").max(5000, "validation.descMax"),
    categoryId: z.string().min(1, "validation.required"),
    budgetMin: z.number().positive("validation.budgetMin"),
    budgetMax: z.number().positive("validation.budgetMin"),
    executionType: z.enum(EXECUTION_TYPES),
    locationSnapshot: z.string().optional(),
    deadlineAt: z.string().min(1, "validation.required"),
    attachments: z.array(z.string()).optional(),
  })
  .refine((data) => data.budgetMin <= data.budgetMax, {
    path: ["budgetMax"],
    message: "validation.budgetMinMax",
  })
  .refine(
    (data) => {
      if (data.executionType === "ONSITE" || data.executionType === "DELIVERY") {
        return Boolean(data.locationSnapshot && data.locationSnapshot.trim().length > 0);
      }
      return true;
    },
    {
      path: ["locationSnapshot"],
      message: "validation.addressRequired",
    }
  )
  .refine(
    (data) => {
      if (!data.deadlineAt) return false;
      const deadline = new Date(data.deadlineAt).getTime();
      const nowPlus24h = Date.now() + 24 * 60 * 60 * 1000 - 60000; // tolerance 1 min
      return deadline >= nowPlus24h;
    },
    {
      path: ["deadlineAt"],
      message: "validation.deadlineFuture",
    }
  );

export type PostFormData = z.infer<typeof postSchema>;
