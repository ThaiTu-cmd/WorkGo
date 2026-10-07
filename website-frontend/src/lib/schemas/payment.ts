import { z } from "zod";

export const paymentSchema = z.object({
  method: z.enum(["CARD", "BANK", "EWALLET", "BALANCE"]),
  amount: z.number().int().min(1000, "validation.minDeposit"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
