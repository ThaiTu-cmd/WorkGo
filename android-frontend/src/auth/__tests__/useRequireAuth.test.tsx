import { renderHook } from '@testing-library/react-native';
import * as React from 'react';

import { buildRedirect, safeRedirect, useRequireAuth } from '../useRequireAuth';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockFocused = true;
jest.mock('expo-router', () => {
  const R = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    // Runs the callback like a focus event when the screen is focused.
    useFocusEffect: (cb: () => void) => R.useEffect(() => (mockFocused ? cb() : undefined), [cb]),
  };
});

let mockStatus = 'guest';
jest.mock('../AuthProvider', () => ({ useAuth: () => ({ status: mockStatus }) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockFocused = true;
  mockStatus = 'guest';
});

test('buildRedirect keeps the query string', () => {
  expect(buildRedirect('/checkout', { serviceId: 's1', packageId: 'pk1' })).toBe('/checkout?serviceId=s1&packageId=pk1');
  expect(buildRedirect('/orders', {})).toBe('/orders');
});

test('safeRedirect only accepts in-app paths', () => {
  expect(safeRedirect('/checkout?serviceId=s1')).toBe('/checkout?serviceId=s1');
  expect(safeRedirect('https://evil.example')).toBeNull();
  expect(safeRedirect('//evil.example')).toBeNull();
  expect(safeRedirect(undefined)).toBeNull();
});

test('a focused guest screen pushes login (not replace) once', async () => {
  const { rerender } = await renderHook(() => useRequireAuth());
  await rerender({});
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/auth/login');
  expect(mockReplace).not.toHaveBeenCalled();
});

test('an unfocused screen (e.g. a tab visited earlier) does not navigate', async () => {
  mockFocused = false;
  await renderHook(() => useRequireAuth());
  expect(mockPush).not.toHaveBeenCalled();
});

test('prompt: false never navigates, signed-in never navigates', async () => {
  await renderHook(() => useRequireAuth({ prompt: false }));
  mockStatus = 'signedIn';
  const { result } = await renderHook(() => useRequireAuth());
  expect(result.current).toBe(true);
  expect(mockPush).not.toHaveBeenCalled();
  expect(React).toBeDefined();
});
