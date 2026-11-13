import { navigationTheme } from '../navigationTheme';
import { darkColors, lightColors } from '../theme';

// Stack headers and the tab bar draw on the navigation theme's card colour.
// Without a dark theme they stay white while the title turns light.
test('dark scheme gives dark headers with light text', () => {
  const theme = navigationTheme('dark');
  expect(theme.dark).toBe(true);
  expect(theme.colors.card).toBe(darkColors.card);
  expect(theme.colors.text).toBe(darkColors.text);
  expect(theme.colors.background).toBe(darkColors.bg);
});

test('light scheme keeps white headers with dark text', () => {
  const theme = navigationTheme('light');
  expect(theme.dark).toBe(false);
  expect(theme.colors.card).toBe(lightColors.card);
  expect(theme.colors.text).toBe(lightColors.text);
  expect(theme.colors.background).toBe(lightColors.bg);
});
