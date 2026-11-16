import { z } from 'zod';
import { translate } from '@/i18n';

export const phoneMessage = () => translate('addressSchema.so_dien_thoai_gom_10');

export const addressSchema = z.object({
  label: z.string(),
  receiver: z.string().trim().min(1, { error: () => translate('addressSchema.vui_long_nhap_nguoi_nhan') }),
  phone: z.string().trim().regex(/^0\d{9}$/, { error: phoneMessage }),
  line1: z.string().trim().min(1, { error: () => translate('addressSchema.vui_long_nhap_so_nha') }),
  ward: z.string(),
  district: z.string(),
  city: z.string().trim().min(1, { error: () => translate('addressSchema.vui_long_nhap_tinh_thanh') }),
  note: z.string(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
