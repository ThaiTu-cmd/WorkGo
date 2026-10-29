import { z } from 'zod';

// Step 1 — what the service is.
export const serviceInfoSchema = z.object({
  title: z.string().trim().min(5, 'Tiêu đề tối thiểu 5 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  executionType: z.enum(['DIGITAL', 'ONSITE']),
  description: z.string().trim().min(20, 'Mô tả tối thiểu 20 ký tự'),
});

const optionalInt = z.number().int().nonnegative().optional();

// Step 2 — 1 to 3 packages (BASIC / STANDARD / PREMIUM by price).
export const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Vui lòng nhập tên gói'),
  price: z.number().positive('Giá phải lớn hơn 0'),
  deliveryDay: optionalInt,
  durationMinute: optionalInt,
  revisionLimit: optionalInt,
});

export const packagesSchema = z.object({
  packages: z.array(packageSchema).min(1, 'Cần ít nhất 1 gói').max(3, 'Tối đa 3 gói'),
});

// Step 3 — up to 5 new images (data URLs).
export const MAX_SERVICE_IMAGES = 5;

export type ServiceInfo = z.infer<typeof serviceInfoSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
