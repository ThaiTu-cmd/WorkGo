import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { AppState, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/AuthProvider';
import { loadPreferences } from '@/settings/preferences';
import { OfflineBanner } from '@/ui';
import { navigationTheme } from '@/ui/navigationTheme';
import { useT } from '@/i18n';

// React Query refetches stale data when the app comes back to the foreground.
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener('change', (s) => setFocused(s === 'active'));
  return () => sub.remove();
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const t = useT();
  const scheme = useColorScheme();
  React.useEffect(() => {
    void loadPreferences();
  }, []);
  const isDark = scheme === 'dark';
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider queryClient={queryClient}>
          <ThemeProvider value={navigationTheme(scheme)}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <OfflineBanner />
            <Stack screenOptions={{ headerBackTitle: t('stack.quay_lai') }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ title: t('stack.dang_nhap') }} />
              <Stack.Screen name="auth/register" options={{ title: t('stack.dang_ky') }} />
              <Stack.Screen name="service/[id]" options={{ title: t('stack.chi_tiet_dich_vu') }} />
              <Stack.Screen name="checkout" options={{ title: t('stack.dat_dich_vu') }} />
              <Stack.Screen name="orders/[id]" options={{ title: t('stack.chi_tiet_don_hang') }} />
              <Stack.Screen name="payment/[orderId]" options={{ title: t('stack.thanh_toan') }} />
              <Stack.Screen name="account/profile" options={{ title: t('stack.thong_tin_ca_nhan') }} />
              <Stack.Screen name="account/addresses/index" options={{ title: t('stack.so_dia_chi') }} />
              <Stack.Screen name="account/addresses/[id]" options={{ title: t('stack.dia_chi') }} />
              <Stack.Screen name="account/settings" options={{ title: t('stack.cai_dat') }} />
              <Stack.Screen name="provider/onboarding" options={{ title: t('stack.tro_thanh_chuyen_gia') }} />
              <Stack.Screen name="provider/services/index" options={{ title: t('stack.dich_vu_cua_toi') }} />
              <Stack.Screen name="provider/services/new" options={{ title: t('stack.tao_dich_vu') }} />
              <Stack.Screen name="provider/services/[id]/edit" options={{ title: t('stack.sua_dich_vu') }} />
              <Stack.Screen name="provider/services/[id]/availability" options={{ title: t('stack.lich_trong') }} />
            </Stack>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
