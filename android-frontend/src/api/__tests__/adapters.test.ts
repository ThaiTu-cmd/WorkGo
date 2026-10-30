import {
  fromAddressForm,
  joinFullName,
  pageItems,
  splitFullName,
  toAddons,
  toAddress,
  toPackages,
  toServiceCard,
  toServiceDetail,
} from '../adapters';
import { instantToTime, timeToInstant } from '../availabilityApi';

test('pageItems reads wrapped and bare pages', () => {
  expect(pageItems({ result: { data: [1] } })).toEqual([1]);
  expect(pageItems({ data: [2] })).toEqual([2]);
  expect(pageItems(undefined)).toEqual([]);
  expect(pageItems(null)).toEqual([]);
});

test('toPackages keeps ACTIVE, sorts by price, max 3, tiers BASIC/STANDARD/PREMIUM', () => {
  const pkgs = toPackages([
    { packageId: 'd', name: 'D', price: 50, packageStatus: 'ACTIVE' },
    { packageId: 'x', name: 'X', price: 1, packageStatus: 'INACTIVE' },
    { packageId: 'c', name: 'C', price: 30 },
    { packageId: 'a', name: 'A', price: '10' },
    { packageId: 'b', name: 'B', price: 20, packageStatus: 'ACTIVE' },
  ]);
  expect(pkgs.map((p) => [p.id, p.tier, p.price])).toEqual([
    ['a', 'BASIC', 10],
    ['b', 'STANDARD', 20],
    ['c', 'PREMIUM', 30],
  ]);
});

test('toAddons drops add-ons without addOnId', () => {
  const addons = toAddons([
    { addOnId: null, name: 'old', price: 5 },
    { addOnId: 'a1', name: 'Gấp', price: '100000', status: 'ACTIVE' },
    { addOnId: 'a2', name: 'Off', price: 1, status: 'INACTIVE' },
  ]);
  expect(addons).toEqual([{ id: 'a1', name: 'Gấp', description: '', price: 100000 }]);
});

test('toAddress builds detail "line1, ward, district, city" skipping blanks', () => {
  const a = toAddress({
    addressId: 'ad1',
    contactName: 'An',
    contactPhone: '0901234567',
    line1: '12 Lê Lợi',
    ward: null,
    district: 'Quận 1',
    city: 'TP.HCM',
  });
  expect(a.id).toBe('ad1');
  expect(a.receiver).toBe('An');
  expect(a.detail).toBe('12 Lê Lợi, Quận 1, TP.HCM');
});

test('fromAddressForm sends nulls for empty optional fields and countryCode VN', () => {
  expect(
    fromAddressForm({ label: 'Nhà', receiver: 'An', phone: '0901234567', line1: '12 Lê Lợi', ward: '', district: '', city: 'Huế', note: '' })
  ).toEqual({
    label: 'Nhà',
    contactName: 'An',
    contactPhone: '0901234567',
    line1: '12 Lê Lợi',
    ward: null,
    district: null,
    city: 'Huế',
    note: null,
    countryCode: 'VN',
  });
});

test('splitFullName("Nguyễn Văn An") → { firstName: "An", lastName: "Nguyễn Văn" }', () => {
  expect(splitFullName('Nguyễn Văn An')).toEqual({ firstName: 'An', lastName: 'Nguyễn Văn' });
  expect(splitFullName('  An ')).toEqual({ firstName: 'An', lastName: '' });
  expect(joinFullName({ firstName: 'An', lastName: 'Nguyễn Văn', userName: 'an' })).toBe('Nguyễn Văn An');
  expect(joinFullName({ userName: 'an' })).toBe('an');
});

test('timeToInstant/instantToTime round-trip "08:30"', () => {
  expect(instantToTime(timeToInstant('08:30'))).toBe('08:30');
});

test('toServiceCard falls back to a default provider name and category name', () => {
  const card = toServiceCard(
    { serviceId: 's1', providerId: 'p1', categoryId: 'c1', title: 'Sửa máy lạnh', executionType: 'ONSITE', basePrice: '200000' },
    { category: { categoryId: 'c1', name: 'Điện lạnh', slug: 'dien-lanh' }, provider: null }
  );
  expect(card.provider.name).toBe('Nhà cung cấp');
  expect(card.categoryName).toBe('Điện lạnh');
  expect(card.basePrice).toBe(200000);
});

test('toServiceDetail uses the cheapest package as base price and cover image first', () => {
  const detail = toServiceDetail({
    service: { serviceId: 's1', providerId: 'p1', categoryId: 'c1', title: 'T', executionType: 'DIGITAL', basePrice: 999 },
    packages: [{ packageId: 'p', name: 'P', price: 150 }],
    medias: [
      { serviceMediaId: 'm1', url: 'data:a', mediaType: 'IMAGE', cover: false },
      { serviceMediaId: 'm2', url: 'data:b', mediaType: 'IMAGE', cover: true },
    ],
  });
  expect(detail.basePrice).toBe(150);
  expect(detail.mediaList.map((m) => m.id)).toEqual(['m2', 'm1']);
  expect(detail.avgRating).toBeNull();
});
