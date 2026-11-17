import type { QueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { AppState } from 'react-native';

import { authApi } from '@/api/authApi';
import { configureClient } from '@/api/client';
import { ApiError } from '@/api/errors';

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
  const generation = React.useRef(0);
  const storageWork = React.useRef<Promise<void>>(Promise.resolve());

  const adopt = React.useCallback(async (next: string, version: number) => {
    storageWork.current = storageWork.current.catch(() => {}).then(async () => {
      if (generation.current === version) await writeToken(next);
    });
    await storageWork.current;
    if (generation.current !== version) return false;
    tokenRef.current = next;
    setToken(next);
    setStatus('signedIn');
    return true;
  }, []);

  const dropSession = React.useCallback(() => {
    generation.current++;
    tokenRef.current = null;
    setToken(null);
    setStatus('guest');
    // Cached orders/addresses/profile belong to the user who just left.
    queryClient?.clear();
    storageWork.current = storageWork.current.catch(() => {}).then(() => clearToken());
  }, [queryClient]);

  // /auth/refresh invalidates the token it receives, so a second concurrent
  // call would send a dead token: share the one in flight.
  const refreshing = React.useRef<{ version: number; promise: Promise<boolean> } | null>(null);
  const refresh = React.useCallback((): Promise<boolean> => {
    const version = generation.current;
    if (refreshing.current?.version === version) return refreshing.current.promise;
    const current = tokenRef.current;
    if (!current) return Promise.resolve(false);
    const promise = (async () => {
      try {
        return await adopt(await authApi.refresh(current), version);
      } catch (error) {
        if (generation.current === version && error instanceof ApiError && error.status === 401) dropSession();
        return false;
      } finally {
        if (refreshing.current?.version === version) refreshing.current = null;
      }
    })();
    refreshing.current = { version, promise };
    return promise;
  }, [adopt, dropSession]);

  const refreshIfDue = React.useCallback(() => {
    const claims = decodeToken(tokenRef.current);
    if (claims && needsRefresh(claims, Date.now())) void refresh();
  }, [refresh]);

  React.useEffect(() => {
    configureClient({
      getToken: () => tokenRef.current,
      getSessionVersion: () => generation.current,
      // A 401 for a token a refresh already replaced says nothing about the session.
      onUnauthorized: (sentToken) => {
        if (sentToken === tokenRef.current) dropSession();
      },
    });
  }, [dropSession]);

  React.useEffect(() => {
    let cancelled = false;
    const version = generation.current;
    (async () => {
      const stored = await readToken();
      if (cancelled || generation.current !== version) return;
      const claims = decodeToken(stored);
      if (!stored || !claims || isExpired(claims, Date.now())) {
        if (stored) {
          storageWork.current = storageWork.current.catch(() => {}).then(async () => {
            if (generation.current === version) await clearToken();
          });
          await storageWork.current;
        }
        if (!cancelled && generation.current === version) setStatus('guest');
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
      dropSession();
      const version = generation.current;
      await adopt(await authApi.login(userName, password), version);
    },
    [adopt, dropSession]
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
