import * as React from 'react';

import { en } from './en';
import { vi, type MessageKey } from './vi';

export type { MessageKey } from './vi';
export type Language = 'vi' | 'en';
export type TranslateParams = Record<string, string | number>;

const dictionaries: Record<Language, Record<MessageKey, string>> = { vi, en };
const listeners = new Set<() => void>();
let current: Language = 'vi';

export function getLanguage(): Language {
  return current;
}

export function setLanguage(language: Language) {
  if (language === current) return;
  current = language;
  listeners.forEach((listener) => listener());
}

export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Usable outside components (error mappers, alerts): reads the language at call time.
export function translate(key: MessageKey, params?: TranslateParams): string {
  const text = dictionaries[current][key] ?? vi[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (hole, name: string) => (name in params ? String(params[name]) : hole));
}

export function useLanguage(): Language {
  return React.useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

// The component re-renders when the language changes.
export function useT() {
  const language = useLanguage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback((key: MessageKey, params?: TranslateParams) => translate(key, params), [language]);
}
