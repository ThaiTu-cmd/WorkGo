import type { QueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { AppState } from 'react-native';

import { authApi, type AuthTokens } from '@/api/authApi';
import { configureClient } from '@/api/client';
import { ApiError } from '@/api/errors';

import { decodeToken, isExpired, needsRefresh, type JwtClaims } from './jwt';
import { clearToken, readSession, writeSession } from './tokenStore';

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
  const refreshRef = React.useRef<string | null>(null);
  const sessionRef = React.useRef<AuthTokens | null>(null);
  const rotationPending = React.useRef(false);
  const generation = React.useRef(0);
  const storageWork = React.useRef<Promise<void>>(Promise.resolve());

  const adopt = React.useCallback(async (next: AuthTokens, version: number) => {
    storageWork.current = storageWork.current.catch(() => {}).then(async () => {
      if (generation.current === version) await writeSession(next);
    });
    await storageWork.current;
    if (generation.current !== version) return false;
    tokenRef.current = next.token;
    refreshRef.current = next.refreshToken;
    sessionRef.current = next;
    rotationPending.current = false;
    setToken(next.token);
    setStatus('signedIn');
    return true;
  }, []);

  const dropSession = React.useCallback(() => {
    generation.current++;
    tokenRef.current = null;
    refreshRef.current = null;
    sessionRef.current = null;
    rotationPending.current = false;
    setToken(null);
    setStatus('guest');
    // Cached orders/addresses/profile belong to the user who just left.
    queryClient?.clear();
    storageWork.current = storageWork.current.catch(() => {}).then(() => clearToken());
  }, [queryClient]);

  // Rotation is one-use. Share the flight within this session generation.
  const refreshing = React.useRef<{ version: number; promise: Promise<boolean> } | null>(null);
  const refresh = React.useCallback((): Promise<boolean> => {
    const version = generation.current;
    if (refreshing.current?.version === version) return refreshing.current.promise;
    if (rotationPending.current) return Promise.reject(new ApiError(503, { message: 'Refresh outcome unknown. Sign in again.' }));
    const current = refreshRef.current;
    if (!current) return Promise.resolve(false);
    const promise = (async () => {
      try {
        // Persist before sending: a crash/lost response must not replay a one-use credential.
        rotationPending.current = true;
        const stored = sessionRef.current;
        storageWork.current = storageWork.current.catch(() => {}).then(async () => {
          if (generation.current === version && stored) await writeSession({ ...stored, rotationPending: true });
        });
        await storageWork.current;
        if (generation.current !== version) return false;
        return await adopt(await authApi.refresh(current), version);
      } catch (error) {
        if (generation.current !== version) return false;
        if (error instanceof ApiError && error.status === 401) { dropSession(); return false; }
        throw error;
      } finally {
        if (refreshing.current?.version === version) refreshing.current = null;
      }
    })();
    refreshing.current = { version, promise };
    return promise;
  }, [adopt, dropSession]);

  const refreshIfDue = React.useCallback(() => {
    const claims = decodeToken(tokenRef.current);
    if (claims && (isExpired(claims, Date.now()) || needsRefresh(claims, Date.now()))) void refresh().catch(() => false);
  }, [refresh]);

  React.useEffect(() => {
    configureClient({
      getToken: () => tokenRef.current,
      getSessionVersion: () => generation.current,
      onRefresh: refresh,
      // A 401 for a token a refresh already replaced says nothing about the session.
      onUnauthorized: (sentToken) => {
        if (sentToken === tokenRef.current) dropSession();
      },
    });
  }, [dropSession, refresh]);

  React.useEffect(() => {
    let cancelled = false;
    const version = generation.current;
    (async () => {
      const stored = await readSession();
      if (cancelled || generation.current !== version) return;
      const claims = decodeToken(stored?.token || null);
      if (!stored || !claims || stored.rotationPending) {
        if (stored) {
          storageWork.current = storageWork.current.catch(() => {}).then(async () => {
            if (generation.current === version) await clearToken();
          });
          await storageWork.current;
        }
        if (!cancelled && generation.current === version) setStatus('guest');
        return;
      }
      tokenRef.current = stored.token;
      refreshRef.current = stored.refreshToken;
      sessionRef.current = stored;
      if (isExpired(claims, Date.now())) {
        try { await refresh(); } catch { if (!cancelled && generation.current === version) setStatus('guest'); }
        return;
      }
      setToken(stored.token);
      setStatus('signedIn');
      refreshIfDue();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshIfDue, refresh]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      refreshIfDue();
    });
    return () => sub.remove();
  }, [dropSession, refreshIfDue]);

  React.useEffect(() => {
    const timer = setInterval(refreshIfDue, 30_000);
    return () => clearInterval(timer);
  }, [refreshIfDue]);

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
    const credential = refreshRef.current;
    dropSession();
    queryClient?.clear();
    await storageWork.current;
    if (current || credential) await authApi.logout(current, credential);
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
