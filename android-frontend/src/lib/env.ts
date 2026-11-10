// Backend gateway the app talks to, chosen at build time (see .env.example).
// Without EXPO_PUBLIC_API_BASE_URL the app targets the gateway on the dev
// machine as seen from the Android emulator (10.0.2.2 = host loopback).
const EMULATOR_GATEWAY = 'http://10.0.2.2:8888/api/v1';

export function resolveApiBaseUrl(env: Record<string, string | undefined>): string {
  const fromEnv = env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!fromEnv) return EMULATOR_GATEWAY;
  return fromEnv.replace(/\/+$/, '');
}

// Metro inlines EXPO_PUBLIC_* only for direct `process.env.NAME` reads.
export const API_BASE_URL = resolveApiBaseUrl({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
});
