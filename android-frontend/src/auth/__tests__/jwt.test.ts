import { decodeToken, hasRole, isExpired, needsRefresh } from '../jwt';
import { makeToken } from '@/test-utils/token';

const NOW = 1_800_000_000_000;
const MIN = 60 * 1000;

test('hasRole reads ROLE_ prefixed scope', () => {
  const claims = { sub: 'a', exp: 0, scope: 'ROLE_CLIENT ROLE_PROVIDER' };
  expect(hasRole(claims, 'PROVIDER')).toBe(true);
  expect(hasRole(claims, 'ADMIN')).toBe(false);
  expect(hasRole(null, 'CLIENT')).toBe(false);
});

test('decodeToken reads UTF-8 payload claims', () => {
  const claims = decodeToken(makeToken({ sub: 'Nguyễn Văn An', exp: 10, userId: 'u1', providerId: null }));
  expect(claims).toEqual({ sub: 'Nguyễn Văn An', exp: 10, userId: 'u1', providerId: null });
});

test('decodeToken returns null for garbage and null', () => {
  expect(decodeToken('abc')).toBeNull();
  expect(decodeToken('a.!!!.c')).toBeNull();
  expect(decodeToken(null)).toBeNull();
});

test('isExpired compares exp seconds with now', () => {
  expect(isExpired({ sub: 'a', exp: NOW / 1000 - 1 }, NOW)).toBe(true);
  expect(isExpired({ sub: 'a', exp: NOW / 1000 + 60 }, NOW)).toBe(false);
});

test('needsRefresh true at 1h59m left, false at 2h01m, false when expired', () => {
  const at = (msLeft: number) => ({ sub: 'a', exp: (NOW + msLeft) / 1000 });
  expect(needsRefresh(at(119 * MIN), NOW)).toBe(true);
  expect(needsRefresh(at(121 * MIN), NOW)).toBe(false);
  expect(needsRefresh(at(-MIN), NOW)).toBe(false);
});
