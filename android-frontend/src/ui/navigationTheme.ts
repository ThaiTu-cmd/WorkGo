import { DarkTheme, DefaultTheme } from 'expo-router';
import type { ColorSchemeName } from 'react-native';

import { getColors } from './theme';

// Theme for Stack headers and the tab bar, built from the app palette.
export function navigationTheme(scheme: ColorSchemeName | null | undefined) {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = getColors(scheme);
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.bg,
      card: c.card,
      text: c.text,
      border: c.border,
    },
  };
}
