import { Stack } from 'expo-router';

// Minimal stack: WebView home + preserved static-prototypes preview screen
// (kept because no dev-build toolchain exists in this environment).
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="webapp-preview" />
    </Stack>
  );
}
