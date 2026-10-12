import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/store/auth';
import { ToastProvider } from '@/components/toast';
import { SavedJobsProvider } from '@/store/saved';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SavedJobsProvider>
          <ToastProvider>
            <AnimatedSplashOverlay />
            <AppTabs />
          </ToastProvider>
        </SavedJobsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
