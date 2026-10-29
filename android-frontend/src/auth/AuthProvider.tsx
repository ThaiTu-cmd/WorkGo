import type { QueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { AppState } from 'react-native';

import { authApi } from '@/api/authApi';
import { configureClient } from '@/api/client';

import { decodeToken, isExpired, needsRefresh, type JwtClaims } from './jwt';
import { clearToken, readToken, writeToken } from './tokenStore';

type Status = 'loading' | 'guest' | 'signedIn';

export type AuthState = {
  status: Status;
  token: string | null;
  claims: JwtClaims | null;
  signIn: (userName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children, queryClient }: { children: React.ReactNode; queryClient?: QueryClient }) {
  const [status, setStatus] = React.useState<Status>('loading');
  const [token, setToken] = React.useState<string | null>(null);
  // The API client reads the token synchronously on every request.
  const tokenRef = React.useRef<string | null>(null);

  const adopt = React.useCallback(async (next: string) => {
    await writeToken(next);
    tokenRef.current = next;
    setToken(next);
    setStatus('signedIn');
  }, []);

  const dropSession = React.useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    setStatus('guest');
    void clearToken();
  }, []);

  const refresh = React.useCallback(async (): Promise<boolean> => {
    const current = tokenRef.current;
    if (!current) return false;
    try {
      await adopt(await authApi.refresh(current));
      return true;
    } catch {
      // keep the current token until it actually expires
      return false;
    }
  }, [adopt]);

  const refreshIfDue = React.useCallback(() => {
    const claims = decodeToken(tokenRef.current);
    if (claims && needsRefresh(claims, Date.now())) void refresh();
  }, [refresh]);

  React.useEffect(() => {
    configureClient({ getToken: () => tokenRef.current, onUnauthorized: dropSession });
  }, [dropSession]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readToken();
      if (cancelled) return;
      const claims = decodeToken(stored);
      if (!stored || !claims || isExpired(claims, Date.now())) {
        if (stored) await clearToken();
        if (!cancelled) setStatus('guest');
        return;
      }
      tokenRef.current = stored;
      setToken(stored);
      setStatus('signedIn');
      refreshIfDue();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshIfDue]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const claims = decodeToken(tokenRef.current);
      if (claims && isExpired(claims, Date.now())) dropSession();
      else refreshIfDue();
    });
    return () => sub.remove();
  }, [dropSession, refreshIfDue]);

  const signIn = React.useCallback(
    async (userName: string, password: string) => {
      await adopt(await authApi.login(userName, password));
    },
    [adopt]
  );

  const signOut = React.useCallback(async () => {
    const current = tokenRef.current;
    dropSession();
    queryClient?.clear();
    if (current) await authApi.logout(current);
  }, [dropSession, queryClient]);

  const value = React.useMemo<AuthState>(
    () => ({ status, token, claims: decodeToken(token), signIn, signOut, refresh }),
    [status, token, signIn, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
