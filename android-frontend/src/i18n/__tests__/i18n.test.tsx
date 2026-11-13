import { act, renderHook } from '@testing-library/react-native';

import { en } from '../en';
import { setLanguage, translate, useT } from '../index';
import { vi } from '../vi';

afterEach(() => setLanguage('vi'));

test('Vietnamese is the default', () => {
  expect(translate('states.thu_lai')).toBe('Thử lại');
});

test('translate follows the current language', () => {
  setLanguage('en');
  expect(translate('states.thu_lai')).toBe('Try again');
});

test('placeholders are filled in', () => {
  expect(translate('packagePicker.phut', { p0: 30 })).toBe('30 phút');
  setLanguage('en');
  expect(translate('packagePicker.phut', { p0: 30 })).toBe('30 min');
});

test('useT re-renders when the language changes', async () => {
  const { result } = await renderHook(() => useT());
  expect(result.current('states.thu_lai')).toBe('Thử lại');
  await act(async () => setLanguage('en'));
  expect(result.current('states.thu_lai')).toBe('Try again');
});

// Every key exists in both languages with the same placeholders.
test('English has every Vietnamese key with matching placeholders', () => {
  const holes = (text: string) => (text.match(/\{p\d+\}/g) ?? []).sort().join(',');
  const missing = Object.keys(vi).filter((key) => !(key in en) || holes(vi[key as keyof typeof vi]) !== holes(en[key as keyof typeof en]));
  expect(missing).toEqual([]);
});
