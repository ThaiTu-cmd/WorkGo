import { validateRule } from '../AvailabilityScreen';

jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({}) }));

const ok = { ruleId: null, dayOfWeek: 2, start: '08:00', end: '17:00', duration: '60' };

test('accepts a normal working day', () => {
  expect(validateRule(ok)).toBeNull();
});

test('rejects malformed times', () => {
  expect(validateRule({ ...ok, start: '8h' })).toBe('Giờ theo dạng HH:mm, ví dụ 08:30.');
  expect(validateRule({ ...ok, end: '24:00' })).toBe('Giờ theo dạng HH:mm, ví dụ 08:30.');
});

test('rejects end before start and too-short or too-long slots', () => {
  expect(validateRule({ ...ok, start: '17:00', end: '08:00' })).toBe('Giờ kết thúc phải sau giờ bắt đầu.');
  expect(validateRule({ ...ok, duration: '10' })).toBe('Thời lượng mỗi lượt tối thiểu 15 phút.');
  expect(validateRule({ ...ok, start: '08:00', end: '08:30', duration: '60' })).toBe('Thời lượng dài hơn khung giờ.');
});
