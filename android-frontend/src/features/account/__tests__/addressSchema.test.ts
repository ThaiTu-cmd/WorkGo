import { addressSchema } from '../addressSchema';

const valid = {
  label: '',
  receiver: 'Nguyễn An',
  phone: '0901234567',
  line1: '12 Lê Lợi',
  ward: '',
  district: '',
  city: 'Huế',
  note: '',
};

test('accepts a minimal valid address', () => {
  expect(addressSchema.safeParse(valid).success).toBe(true);
});

test('rejects a phone that is not 10 digits starting with 0', () => {
  const r = addressSchema.safeParse({ ...valid, phone: '12345' });
  expect(r.success).toBe(false);
  expect(r.error?.issues[0].message).toBe('Số điện thoại gồm 10 số, bắt đầu bằng 0');
});

test('requires receiver, street and city', () => {
  const r = addressSchema.safeParse({ ...valid, receiver: ' ', line1: '', city: '' });
  expect(r.success).toBe(false);
  expect(r.error?.issues.map((i) => i.path[0]).sort()).toEqual(['city', 'line1', 'receiver']);
});
