import { Appearance, ColorSchemeName, StyleSheet, useColorScheme } from 'react-native';

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  text: string;
  muted: string;
  border: string;
  bg: string;
  card: string;
  white: string;
  darkBg: string;
  darkCard: string;
  darkText: string;
  darkBorder: string;
  darkMuted: string;
};

export const lightColors: ThemeColors = {
  primary: '#1dbf73',
  primaryDark: '#158852',
  primaryLight: '#f0fbf5',
  success: '#15803d',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#1dbf73',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
  card: '#ffffff',
  white: '#ffffff',
  darkBg: '#121212',
  darkCard: '#1e1e1e',
  darkText: '#e8e8e8',
  darkBorder: '#2a2a2a',
  darkMuted: '#8a8a8a',
};

export const darkColors: ThemeColors = {
  ...lightColors,
  text: '#e8e8e8',
  muted: '#8a8a8a',
  border: '#2a2a2a',
  bg: '#121212',
  card: '#1e1e1e',
};

export const colors = new Proxy({} as ThemeColors, {
  get(_target, prop: string | symbol) {
    const scheme = Appearance.getColorScheme();
    return getColors(scheme)[prop as keyof ThemeColors];
  },
});

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };
export const font = { small: 12, body: 15, title: 18, hero: 24 };

export function getColors(scheme: ColorSchemeName | null | undefined): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useColors(): ThemeColors {
  const scheme = useColorScheme();
  return getColors(scheme);
}

// Builds a style hook from a factory of the theme colours. The sheet is made
// once per scheme and the hook re-renders its component when Android switches
// between light and dark, so screens recolour without restarting the app.
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: ThemeColors) => T) {
  const sheets: { light?: T; dark?: T } = {};
  return function useStyles(): T {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    return (sheets[scheme] ??= StyleSheet.create(factory(getColors(scheme))));
  };
}
