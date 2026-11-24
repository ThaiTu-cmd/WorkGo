import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '@/api/authApi';

const TOKEN_KEY = 'workgo.session';

export async function readSession(): Promise<AuthTokens | null> {
  try {
    const value = JSON.parse(await SecureStore.getItemAsync(TOKEN_KEY) || 'null') as AuthTokens | null;
    return value && typeof value.token === 'string' && typeof value.refreshToken === 'string'
      && /^[A-Za-z0-9_-]{43}$/.test(value.refreshToken) && typeof value.expiresAt === 'string' ? value : null;
  } catch { return null; }
}

export async function writeSession(session: AuthTokens): Promise<void> {
  // One encrypted record avoids half-written access/refresh pairs after a crash.
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(session));
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
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync('workgo.accessToken');
  } catch {
    // nothing stored or keystore unavailable: the in-memory session is already gone
  }
}
