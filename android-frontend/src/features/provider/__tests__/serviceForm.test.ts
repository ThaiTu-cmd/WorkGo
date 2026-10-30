import { packagesSchema, serviceInfoSchema } from '../serviceFormSchema';
import { slugify } from '../slugify';

test('slugify("Sửa máy lạnh Đà Nẵng") === "sua-may-lanh-da-nang"', () => {
  expect(slugify('Sửa máy lạnh Đà Nẵng')).toBe('sua-may-lanh-da-nang');
  expect(slugify('  Logo & nhận diện!! ')).toBe('logo-nhan-dien');
});

const info = {
  title: 'Thiết kế logo',
  categoryId: 'c1',
  executionType: 'DIGITAL' as const,
  description: 'Thiết kế logo chuyên nghiệp cho cửa hàng nhỏ.',
};

test('serviceInfoSchema requires a 5+ char title and 20+ char description', () => {
  expect(serviceInfoSchema.safeParse(info).success).toBe(true);
  expect(serviceInfoSchema.safeParse({ ...info, title: 'Logo' }).success).toBe(false);
  expect(serviceInfoSchema.safeParse({ ...info, description: 'ngắn' }).success).toBe(false);
  expect(serviceInfoSchema.safeParse({ ...info, categoryId: '' }).success).toBe(false);
});

const pkg = { name: 'Cơ bản', price: 100000, deliveryDay: 3, durationMinute: undefined, revisionLimit: 1 };

test('serviceFormSchema rejects package price 0 and more than 3 packages', () => {
  expect(packagesSchema.safeParse({ packages: [pkg] }).success).toBe(true);
  expect(packagesSchema.safeParse({ packages: [{ ...pkg, price: 0 }] }).success).toBe(false);
  expect(packagesSchema.safeParse({ packages: [pkg, pkg, pkg, pkg] }).success).toBe(false);
  expect(packagesSchema.safeParse({ packages: [] }).success).toBe(false);
});
