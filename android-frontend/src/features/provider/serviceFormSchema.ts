import { z } from 'zod';
import { translate } from '@/i18n';

// Step 1 — what the service is.
export const serviceInfoSchema = z.object({
  title: z.string().trim().min(5, { error: () => translate('serviceFormSchema.tieu_de_toi_thieu_5') }),
  categoryId: z.string().min(1, { error: () => translate('serviceFormSchema.vui_long_chon_danh_muc') }),
  executionType: z.enum(['DIGITAL', 'ONSITE']),
  description: z.string().trim().min(20, { error: () => translate('serviceFormSchema.mo_ta_toi_thieu_20') }),
});

const optionalInt = z.number().int().nonnegative().optional();

// Step 2 — 1 to 3 packages (BASIC / STANDARD / PREMIUM by price).
export const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { error: () => translate('serviceFormSchema.vui_long_nhap_ten_goi') }),
  price: z.number().positive({ error: () => translate('serviceFormSchema.gia_phai_lon_hon_0') }),
  deliveryDay: optionalInt,
  durationMinute: optionalInt,
  revisionLimit: optionalInt,
});

export const packagesSchema = z.object({
  packages: z.array(packageSchema).min(1, { error: () => translate('serviceFormSchema.can_it_nhat_1_goi') }).max(3, { error: () => translate('serviceFormSchema.toi_da_3_goi') }),
});

// Step 3 — up to 5 new images (data URLs).
export const MAX_SERVICE_IMAGES = 5;

export type ServiceInfo = z.infer<typeof serviceInfoSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
