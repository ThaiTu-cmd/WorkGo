import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Appearance } from 'react-native';

import { getLanguage, setLanguage, subscribeLanguage, type Language } from '@/i18n';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Preferences = { theme: ThemePreference; language: Language };

const THEME_KEY = 'workgo.theme';
const LANGUAGE_KEY = 'workgo.language';
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGES: Language[] = ['vi', 'en'];

const listeners = new Set<() => void>();
let theme: ThemePreference = 'system';
let snapshot: Preferences = { theme, language: getLanguage() };

function emit() {
  snapshot = { theme, language: getLanguage() };
  listeners.forEach((listener) => listener());
}
subscribeLanguage(emit);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPreferences(): Preferences {
  return snapshot;
}

export function usePreferences(): Preferences {
  return React.useSyncExternalStore(subscribe, getPreferences, getPreferences);
}

function applyTheme(next: ThemePreference) {
  theme = next;
  // 'unspecified' hands the scheme back to the Android setting.
  Appearance.setColorScheme(next === 'system' ? 'unspecified' : next);
  emit();
}

async function save(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // keystore unavailable: the choice still applies until the app restarts
  }
}

async function read(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setThemePreference(next: ThemePreference) {
  applyTheme(next);
  await save(THEME_KEY, next);
}

export async function setLanguagePreference(next: Language) {
  setLanguage(next);
  await save(LANGUAGE_KEY, next);
}

// Applies the saved choices; anything unknown falls back to the defaults.
export async function loadPreferences() {
  const [savedTheme, savedLanguage] = await Promise.all([read(THEME_KEY), read(LANGUAGE_KEY)]);
  applyTheme(THEMES.includes(savedTheme as ThemePreference) ? (savedTheme as ThemePreference) : 'system');
  setLanguage(LANGUAGES.includes(savedLanguage as Language) ? (savedLanguage as Language) : 'vi');
}
