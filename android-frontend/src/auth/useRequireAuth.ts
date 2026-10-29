import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';

import { useAuth } from './AuthProvider';

// Sends guests to the login screen and brings them back here afterwards.
// Returns true once the user is signed in.
export function useRequireAuth(): boolean {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'guest') router.replace({ pathname: '/auth/login', params: { redirect: pathname } });
  }, [status, router, pathname]);

  return status === 'signedIn';
}

// Only in-app paths are honoured as a post-login destination.
export function safeRedirect(redirect: unknown): string {
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
}
