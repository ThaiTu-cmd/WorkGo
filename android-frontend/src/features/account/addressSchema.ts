import { z } from 'zod';

export const PHONE_MESSAGE = 'Số điện thoại gồm 10 số, bắt đầu bằng 0';

export const addressSchema = z.object({
  label: z.string(),
  receiver: z.string().trim().min(1, 'Vui lòng nhập người nhận'),
  phone: z.string().trim().regex(/^0\d{9}$/, PHONE_MESSAGE),
  line1: z.string().trim().min(1, 'Vui lòng nhập số nhà, đường'),
  ward: z.string(),
  district: z.string(),
  city: z.string().trim().min(1, 'Vui lòng nhập tỉnh/thành phố'),
  note: z.string(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
