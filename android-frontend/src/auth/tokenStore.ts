import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthTokens } from '@/api/authApi';

const TOKEN_KEY = 'workgo.session';

// Expo SecureStore has no web implementation. A browser tab uses its own
// session storage; native apps retain the encrypted SecureStore record.
async function getItem(key: string): Promise<string | null> {
  return Platform.OS === 'web' ? globalThis.sessionStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key);
}
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!globalThis.sessionStorage) throw new Error('Trình duyệt không cho phép lưu phiên đăng nhập.');
    globalThis.sessionStorage.setItem(key, value);
  } else await SecureStore.setItemAsync(key, value);
}
async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') globalThis.sessionStorage?.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export async function readSession(): Promise<AuthTokens | null> {
  try {
    const value = JSON.parse(await getItem(TOKEN_KEY) || 'null') as AuthTokens | null;
    return value && typeof value.token === 'string' && typeof value.refreshToken === 'string'
      && /^[A-Za-z0-9_-]{43}$/.test(value.refreshToken) && typeof value.expiresAt === 'string' ? value : null;
  } catch { return null; }
}

export async function writeSession(session: AuthTokens): Promise<void> {
  // One encrypted record avoids half-written access/refresh pairs after a crash.
  await setItem(TOKEN_KEY, JSON.stringify(session));
}

export async function readToken(): Promise<string | null> {
  try {
    return (await readSession())?.token || null;
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await removeItem(TOKEN_KEY);
    await removeItem('workgo.accessToken');
  } catch {
    // nothing stored or keystore unavailable: the in-memory session is already gone
  }
}
