import { categoryVisual } from '../categoryVisuals';

const SEED_SLUGS = [
  'thiet-ke-do-hoa',
  'lap-trinh-it',
  'viet-lach-dich-thuat',
  'marketing-quang-cao',
  'sua-chua-bao-tri',
  've-sinh-don-dep',
  'van-chuyen-giao-hang',
  'giao-duc-gia-su',
];

test('every seeded category has its own icon and short label', () => {
  const visuals = SEED_SLUGS.map(categoryVisual);
  expect(new Set(visuals.map((v) => v.icon)).size).toBe(SEED_SLUGS.length);
  expect(new Set(visuals.map((v) => v.short)).size).toBe(SEED_SLUGS.length);
  expect(categoryVisual('sua-chua-bao-tri')).toMatchObject({ icon: 'construct-outline', short: 'Sửa chữa' });
});

test('unknown or missing slug falls back to a neutral visual', () => {
  const fallback = categoryVisual(undefined);
  expect(fallback.icon).toBe('grid-outline');
  expect(categoryVisual('khong-ton-tai')).toEqual(fallback);
  expect(categoryVisual(null)).toEqual(fallback);
});
