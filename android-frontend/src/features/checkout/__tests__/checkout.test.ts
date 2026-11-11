import type { Addon, Address, Package } from '@/api/adapters';

import { estimateTotal, validateCheckout } from '../checkout';

const pkg: Package = {
  id: 'pk1',
  tier: 'BASIC',
  name: 'Cơ bản',
  description: '',
  price: 200000,
  deliveryDays: null,
  durationMinute: 60,
  revisionLimit: 0,
};
const addons: Addon[] = [
  { id: 'a1', name: 'Gấp', description: '', price: 50000 },
  { id: 'a2', name: 'Vật tư', description: '', price: 30000 },
];
const address: Address = {
  id: 'ad1',
  label: 'Nhà',
  receiver: 'An',
  phone: '0901234567',
  line1: '12 Lê Lợi',
  ward: '',
  district: 'Quận 1',
  city: 'TP.HCM',
  note: '',
  detail: '12 Lê Lợi, Quận 1, TP.HCM',
};

const base = {
  packageId: 'pk1',
  addonIds: ['a1'],
  slotId: null,
  address: null,
  availableSlotCount: 0,
  addressCount: 0,
};

test('estimateTotal = package price + selected add-ons only', () => {
  expect(estimateTotal(pkg, addons, ['a2'])).toBe(230000);
  expect(estimateTotal(pkg, addons, [])).toBe(200000);
  expect(estimateTotal(null, addons, ['a1'])).toBe(50000);
});

test('validateCheckout requires a package', () => {
  expect(validateCheckout({ ...base, packageId: null, service: { serviceId: 's1', executionType: 'DIGITAL' } })).toEqual({
    ok: false,
    error: 'Vui lòng chọn gói dịch vụ.',
  });
});

test('validateCheckout DIGITAL → body without bookingSlotId/address', () => {
  expect(validateCheckout({ ...base, service: { serviceId: 's1', executionType: 'DIGITAL' } })).toEqual({
    ok: true,
    body: { serviceId: 's1', packageId: 'pk1', addonIds: ['a1'] },
  });
});

test('validateCheckout ONSITE with no available slots → slot error', () => {
  const r = validateCheckout({ ...base, addressCount: 1, address, service: { serviceId: 's1', executionType: 'ONSITE' } });
  expect(r).toEqual({ ok: false, error: 'Dịch vụ chưa có lịch trống. Vui lòng quay lại sau.' });
});

test('validateCheckout ONSITE without a chosen slot → choose-time error', () => {
  const r = validateCheckout({ ...base, availableSlotCount: 3, service: { serviceId: 's1', executionType: 'ONSITE' } });
  expect(r).toEqual({ ok: false, error: 'Vui lòng chọn thời gian.' });
});

test('validateCheckout ONSITE with no addresses → address error', () => {
  const r = validateCheckout({ ...base, availableSlotCount: 3, slotId: 'sl1', service: { serviceId: 's1', executionType: 'ONSITE' } });
  expect(r).toEqual({ ok: false, error: 'Bạn chưa có địa chỉ. Hãy thêm địa chỉ trong Tài khoản.' });
});

test('validateCheckout ONSITE with addresses but none chosen → choose-address error', () => {
  const r = validateCheckout({
    ...base,
    availableSlotCount: 3,
    slotId: 'sl1',
    addressCount: 2,
    service: { serviceId: 's1', executionType: 'ONSITE' },
  });
  expect(r).toEqual({ ok: false, error: 'Vui lòng chọn địa chỉ.' });
});

test('validateCheckout ONSITE ok → body.address === address.detail and bookingSlotId', () => {
  const r = validateCheckout({
    ...base,
    availableSlotCount: 3,
    slotId: 'sl1',
    addressCount: 1,
    address,
    service: { serviceId: 's1', executionType: 'ONSITE' },
  });
  expect(r).toEqual({
    ok: true,
    body: { serviceId: 's1', packageId: 'pk1', addonIds: ['a1'], bookingSlotId: 'sl1', address: '12 Lê Lợi, Quận 1, TP.HCM' },
  });
});
