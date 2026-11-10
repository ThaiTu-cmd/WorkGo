import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';

import { useAuth } from './AuthProvider';

// For screens that need a signed-in user. When a guest reaches one while it is
// focused, the login screen is pushed ON TOP of it (once): the screen keeps its
// params underneath, login returns with back(), and hardware Back from login
// lands on this screen's inline <LoginRequired /> instead of leaving the app.
// Tab screens pass { prompt: false } and only show the inline state.
export function useRequireAuth({ prompt = true }: { prompt?: boolean } = {}): boolean {
  const { status } = useAuth();
  const router = useRouter();
  const prompted = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (status !== 'guest' || !prompt || prompted.current) return;
      prompted.current = true;
      router.push('/auth/login');
    }, [status, prompt, router])
  );

  return status === 'signedIn';
}

export function buildRedirect(pathname: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== '')
  ).toString();
  return query ? `${pathname}?${query}` : pathname;
}

// Only in-app paths are honoured as a post-login destination.
export function safeRedirect(redirect: unknown): string | null {
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null;
}
