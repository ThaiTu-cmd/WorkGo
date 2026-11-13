import { fireEvent, render, screen } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { setLanguage } from '@/i18n';
import { getPreferences, setThemePreference } from '@/settings/preferences';

import { SettingsScreen } from '../SettingsScreen';

jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

beforeEach(async () => {
  await setThemePreference('system');
  setLanguage('vi');
});

test('picking Tối switches the app to dark', async () => {
  await render(<SettingsScreen />);
  expect(screen.getByRole('radio', { name: 'Theo hệ thống' })).toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Tối' }));
  expect(getPreferences().theme).toBe('dark');
  expect(screen.getByRole('radio', { name: 'Tối' })).toBeChecked();
});

test('picking English redraws the screen in English', async () => {
  await render(<SettingsScreen />);
  await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  expect(getPreferences().language).toBe('en');
  expect(screen.getByText('Appearance')).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Dark' })).toBeTruthy();
});
