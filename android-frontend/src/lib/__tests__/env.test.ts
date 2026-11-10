import { resolveApiBaseUrl } from '../env';

test('falls back to emulator gateway', () => {
  expect(resolveApiBaseUrl({})).toBe('http://10.0.2.2:8888/api/v1');
});

test('uses EXPO_PUBLIC_API_BASE_URL and strips trailing slash', () => {
  expect(resolveApiBaseUrl({ EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com/api/v1/' })).toBe(
    'https://api.example.com/api/v1'
  );
});

test('ignores a blank EXPO_PUBLIC_API_BASE_URL', () => {
  expect(resolveApiBaseUrl({ EXPO_PUBLIC_API_BASE_URL: '  ' })).toBe('http://10.0.2.2:8888/api/v1');
});
