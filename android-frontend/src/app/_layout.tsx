import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/AuthProvider';
import { colors, OfflineBanner } from '@/ui';

// React Query refetches stale data when the app comes back to the foreground.
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener('change', (s) => setFocused(s === 'active'));
  return () => sub.remove();
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider queryClient={queryClient}>
          <StatusBar style="dark" />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerTintColor: colors.text,
              headerBackTitle: 'Quay lại',
              contentStyle: { backgroundColor: colors.bg },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ title: 'Đăng nhập' }} />
            <Stack.Screen name="auth/register" options={{ title: 'Đăng ký' }} />
            <Stack.Screen name="service/[id]" options={{ title: 'Chi tiết dịch vụ' }} />
            <Stack.Screen name="checkout" options={{ title: 'Đặt dịch vụ' }} />
            <Stack.Screen name="orders/[id]" options={{ title: 'Chi tiết đơn hàng' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
