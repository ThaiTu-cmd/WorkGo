import type { ServiceCard } from '@/api/adapters';

import { buildHomeRails } from '../homeRails';

let n = 0;
const card = (over: Partial<ServiceCard>): ServiceCard => ({
  serviceId: `s${++n}`,
  providerId: 'p',
  categoryId: 'c',
  categorySlug: null,
  categoryName: '',
  title: 'T',
  executionType: 'ONSITE',
  provider: { providerId: 'p', name: 'P', isVerified: false, bio: '', providerType: null, verificationStatus: null, joinedAt: null },
  avgRating: 0,
  reviewCount: 0,
  orderCount: 0,
  basePrice: 0,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

const ids = (cards: ServiceCard[]) => cards.map((c) => c.serviceId);

test('popular rail: top 8 by order count', () => {
  const cards = Array.from({ length: 10 }, (_, i) => card({ serviceId: `p${i}`, orderCount: i }));
  const popular = buildHomeRails(cards).find((r) => r.key === 'popular')!;
  expect(ids(popular.items)).toEqual(['p9', 'p8', 'p7', 'p6', 'p5', 'p4', 'p3', 'p2']);
  expect(popular.explore).toEqual({});
});

test('onsite and digital rails filter by execution type, sort by rating, and link Explore with that filter', () => {
  const cards = [
    card({ serviceId: 'on-low', executionType: 'ONSITE', avgRating: 4.1 }),
    card({ serviceId: 'on-high', executionType: 'ONSITE', avgRating: 4.9 }),
    card({ serviceId: 'dig', executionType: 'DIGITAL', avgRating: 4.5 }),
  ];
  const rails = buildHomeRails(cards);
  const onsite = rails.find((r) => r.key === 'onsite')!;
  const digital = rails.find((r) => r.key === 'digital')!;
  expect(ids(onsite.items)).toEqual(['on-high', 'on-low']);
  expect(onsite.explore).toEqual({ executionType: 'ONSITE' });
  expect(ids(digital.items)).toEqual(['dig']);
  expect(digital.explore).toEqual({ executionType: 'DIGITAL' });
});

test('new rail: newest first', () => {
  const cards = [
    card({ serviceId: 'old', createdAt: '2026-01-01T00:00:00Z' }),
    card({ serviceId: 'new', createdAt: '2026-10-01T00:00:00Z' }),
  ];
  expect(ids(buildHomeRails(cards).find((r) => r.key === 'new')!.items)).toEqual(['new', 'old']);
});

test('empty rails are left out', () => {
  const rails = buildHomeRails([card({ executionType: 'ONSITE' })]);
  expect(rails.map((r) => r.key)).toEqual(['popular', 'onsite', 'new']);
  expect(buildHomeRails([])).toEqual([]);
});
