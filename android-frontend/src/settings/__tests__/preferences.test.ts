import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

import { getLanguage } from '@/i18n';

import { getPreferences, loadPreferences, setLanguagePreference, setThemePreference } from '../preferences';

const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

beforeEach(async () => {
  (SecureStore as unknown as { __reset: () => void }).__reset();
  setColorScheme.mockClear();
  await setThemePreference('system');
  await setLanguagePreference('vi');
  setColorScheme.mockClear();
});

test('choosing dark forces the app to dark and is saved', async () => {
  await setThemePreference('dark');
  expect(setColorScheme).toHaveBeenLastCalledWith('dark');
  expect(getPreferences().theme).toBe('dark');
  expect(await SecureStore.getItemAsync('workgo.theme')).toBe('dark');
});

test('choosing system hands the scheme back to Android', async () => {
  await setThemePreference('light');
  await setThemePreference('system');
  expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
});

test('choosing English switches the language and is saved', async () => {
  await setLanguagePreference('en');
  expect(getLanguage()).toBe('en');
  expect(getPreferences().language).toBe('en');
  expect(await SecureStore.getItemAsync('workgo.language')).toBe('en');
});

test('saved choices are applied at startup', async () => {
  await SecureStore.setItemAsync('workgo.theme', 'light');
  await SecureStore.setItemAsync('workgo.language', 'en');
  await loadPreferences();
  expect(setColorScheme).toHaveBeenLastCalledWith('light');
  expect(getPreferences()).toEqual({ theme: 'light', language: 'en' });
  expect(getLanguage()).toBe('en');
});

test('unknown saved values fall back to the defaults', async () => {
  await SecureStore.setItemAsync('workgo.theme', 'purple');
  await SecureStore.setItemAsync('workgo.language', 'fr');
  await loadPreferences();
  expect(getPreferences()).toEqual({ theme: 'system', language: 'vi' });
});
