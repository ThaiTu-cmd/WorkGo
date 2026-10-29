import { QueryClient } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { AppState, Text } from 'react-native';

import { authApi } from '@/api/authApi';
import { http } from '@/api/client';
import { ApiError } from '@/api/errors';

import { AuthProvider, useAuth } from '../AuthProvider';
import { readToken, writeToken } from '../tokenStore';
import { HOUR, tokenExpiringIn } from '@/test-utils/token';

jest.mock('@/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(async () => {}),
    refresh: jest.fn(),
  },
}));

const mocked = authApi as jest.Mocked<typeof authApi>;

let appStateHandler: ((s: string) => void) | undefined;

beforeEach(() => {
  (SecureStore as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  appStateHandler = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateHandler = handler as (s: string) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

let api: ReturnType<typeof useAuth>;
function Probe() {
  const auth = useAuth();
  React.useEffect(() => {
    api = auth;
  });
  return <Text testID="status">{auth.status}</Text>;
}

async function renderAuth(queryClient?: QueryClient) {
  await render(
    <AuthProvider queryClient={queryClient}>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByTestId('status').props.children).not.toBe('loading'));
}

test('no stored token → guest', async () => {
  await renderAuth();
  expect(api.status).toBe('guest');
  expect(api.claims).toBeNull();
});

test('expired stored token → guest and cleared', async () => {
  await writeToken(tokenExpiringIn(-HOUR));
  await renderAuth();
  expect(api.status).toBe('guest');
  expect(await readToken()).toBeNull();
});

test('valid stored token → signedIn with claims', async () => {
  await writeToken(tokenExpiringIn(10 * HOUR, { sub: 'an', providerId: 'p1' }));
  await renderAuth();
  expect(api.status).toBe('signedIn');
  expect(api.claims?.sub).toBe('an');
  expect(api.claims?.providerId).toBe('p1');
});

test('AppState active with token near expiry → refresh called and new token stored', async () => {
  const old = tokenExpiringIn(10 * HOUR);
  await writeToken(old);
  await renderAuth();
  expect(mocked.refresh).not.toHaveBeenCalled();

  const fresh = tokenExpiringIn(34 * HOUR, { sub: 'an' });
  mocked.refresh.mockResolvedValue(fresh);
  // 9 hours pass while the app sits in the background.
  const realNow = Date.now();
  const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(realNow + 9 * HOUR);

  await act(async () => {
    appStateHandler?.('active');
  });

  await waitFor(() => expect(mocked.refresh).toHaveBeenCalledWith(old));
  await waitFor(async () => expect(await readToken()).toBe(fresh));
  expect(api.token).toBe(fresh);
  nowSpy.mockRestore();
});

test('AppState active with plenty of time left → no refresh', async () => {
  await writeToken(tokenExpiringIn(10 * HOUR));
  await renderAuth();
  await act(async () => {
    appStateHandler?.('active');
  });
  expect(mocked.refresh).not.toHaveBeenCalled();
});

test('refresh failure keeps old token', async () => {
  const old = tokenExpiringIn(HOUR);
  mocked.refresh.mockRejectedValue(new ApiError(401, { code: 1006 }));
  await writeToken(old);
  await renderAuth();

  let ok = true;
  await act(async () => {
    ok = await api.refresh();
  });
  expect(ok).toBe(false);
  expect(api.status).toBe('signedIn');
  expect(await readToken()).toBe(old);
});

test('signIn stores the token returned by login', async () => {
  const t = tokenExpiringIn(24 * HOUR);
  mocked.login.mockResolvedValue(t);
  await renderAuth();
  await act(async () => {
    await api.signIn('an', 'pw');
  });
  expect(mocked.login).toHaveBeenCalledWith('an', 'pw');
  expect(api.status).toBe('signedIn');
  expect(await readToken()).toBe(t);
});

test('signOut clears token, calls logout, clears query cache', async () => {
  const t = tokenExpiringIn(10 * HOUR);
  await writeToken(t);
  const queryClient = new QueryClient();
  const clear = jest.spyOn(queryClient, 'clear');
  await renderAuth(queryClient);

  await act(async () => {
    await api.signOut();
  });
  expect(api.status).toBe('guest');
  expect(await readToken()).toBeNull();
  expect(mocked.logout).toHaveBeenCalledWith(t);
  expect(clear).toHaveBeenCalled();
});

test('client onUnauthorized → guest', async () => {
  await writeToken(tokenExpiringIn(10 * HOUR));
  await renderAuth();
  global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ code: 1006 }) })) as never;

  await act(async () => {
    await http.get('/order/orders').catch(() => {});
  });
  expect(api.status).toBe('guest');
  await waitFor(async () => expect(await readToken()).toBeNull());
});
