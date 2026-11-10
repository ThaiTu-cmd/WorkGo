import type { ServiceCard } from '@/api/adapters';

import { filterServices } from '../filterServices';

const card = (over: Partial<ServiceCard>): ServiceCard => ({
  serviceId: 's',
  providerId: 'p',
  categoryId: 'c',
  categoryName: 'Điện lạnh',
  title: 'Sửa máy lạnh',
  executionType: 'ONSITE',
  provider: { providerId: 'p', name: 'Thợ Bảo', isVerified: true, bio: '', providerType: null, verificationStatus: null, joinedAt: null },
  avgRating: 0,
  reviewCount: 0,
  orderCount: 0,
  basePrice: 300000,
  ...over,
});

const cards = [
  card({ serviceId: 'a' }),
  card({ serviceId: 'b', title: 'Thiết kế logo', categoryName: 'Thiết kế', executionType: 'DIGITAL', basePrice: 1500000 }),
  card({ serviceId: 'c', title: 'Vệ sinh máy giặt', basePrice: 150000 }),
];

const ids = (list: ServiceCard[]) => list.map((c) => c.serviceId);

test('filterServices matches "sua may lanh" against "Sửa máy lạnh"', () => {
  expect(ids(filterServices(cards, { query: 'sua may lanh' }))).toEqual(['a']);
  expect(ids(filterServices(cards, { query: 'SỬA' }))).toEqual(['a']);
});

test('filterServices matches category and provider names', () => {
  expect(ids(filterServices(cards, { query: 'thiet ke' }))).toEqual(['b']);
  expect(ids(filterServices(cards, { query: 'tho bao' }))).toEqual(['a', 'b', 'c']);
});

test('filterServices combines executionType and price range', () => {
  expect(ids(filterServices(cards, { executionType: 'ONSITE', maxPrice: 200000 }))).toEqual(['c']);
  expect(ids(filterServices(cards, { minPrice: 1000000 }))).toEqual(['b']);
});

test('filterServices by categoryId and blank query returns all of that category', () => {
  const list = [card({ serviceId: 'x', categoryId: 'c9' }), card({ serviceId: 'y' })];
  expect(ids(filterServices(list, { categoryId: 'c9', query: '   ' }))).toEqual(['x']);
});
