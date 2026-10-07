import { z } from "zod";

export const payoutSchema = z
  .object({
    accountType: z.enum(["BANK", "WALLET"]),
    bankCode: z.string().optional(),
    accountNumber: z
      .string()
      .trim()
      .min(6, "validation.accountNumber")
      .max(24, "validation.accountNumber")
      .regex(/^[0-9A-Za-z]+$/, "validation.accountNumberAlphanumeric"),
    accountHolderName: z
      .string()
      .trim()
      .min(2, "validation.accountHolder")
      .max(100, "validation.accountHolder"),
    isDefault: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.accountType === "BANK") {
        return Boolean(data.bankCode && data.bankCode.length > 0);
      }
      return true;
    },
    {
      path: ["bankCode"],
      message: "Vui lòng chọn ngân hàng thụ hưởng",
    }
  );

export type PayoutFormData = z.infer<typeof payoutSchema>;
