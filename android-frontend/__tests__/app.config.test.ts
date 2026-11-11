import type { ExpoConfig } from 'expo/config';

import appConfig from '../app.config';

const ORIGINAL_ENV = process.env;

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

function build(env: Record<string, string>): ExpoConfig {
  process.env = { ...ORIGINAL_ENV, ...env };
  return appConfig({ config: {} } as Parameters<typeof appConfig>[0]);
}

function cleartextOf(config: ExpoConfig): unknown {
  const entry = config.plugins?.find(
    (p): p is [string, { android?: { usesCleartextTraffic?: boolean } }] =>
      Array.isArray(p) && p[0] === 'expo-build-properties'
  );
  return entry?.[1]?.android?.usesCleartextTraffic;
}

test('identity', () => {
  const config = build({});
  expect(config.name).toBe('WorkGo');
  expect(config.slug).toBe('workgo');
  expect(config.scheme).toBe('workgo');
  expect(config.android?.package).toBe('com.workgo.app');
});

test('cleartext only with WORKGO_ALLOW_HTTP=1', () => {
  expect(cleartextOf(build({ WORKGO_ALLOW_HTTP: '1' }))).toBe(true);
  expect(cleartextOf(build({ WORKGO_ALLOW_HTTP: '' }))).toBe(false);
});

test('typed routes are off so tsc does not need generated route types', () => {
  expect(build({}).experiments?.typedRoutes).toBeFalsy();
});
