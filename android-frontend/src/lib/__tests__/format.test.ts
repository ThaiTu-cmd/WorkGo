import { formatDateTime, formatVnd } from '../format';

test('formatVnd(1500000) === "1.500.000 ₫"', () => {
  expect(formatVnd(1500000)).toBe('1.500.000 ₫');
  expect(formatVnd(0)).toBe('0 ₫');
});

test('formatDateTime renders dd/MM/yyyy HH:mm in local time', () => {
  const iso = new Date(2026, 9, 5, 8, 7).toISOString();
  expect(formatDateTime(iso)).toBe('05/10/2026 08:07');
});

test('formatDateTime returns empty string for missing or invalid input', () => {
  expect(formatDateTime(null)).toBe('');
  expect(formatDateTime('nope')).toBe('');
});
