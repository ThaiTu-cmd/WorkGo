import * as React from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export function resolveWebAppUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEBAPP_URL;
  if (fromEnv) return fromEnv;
  // Android emulator cannot reach host `localhost`; 10.0.2.2 maps to the host loopback.
  if (__DEV__) return 'http://10.0.2.2:3000/vi';
  return 'http://localhost:3000/vi';
}

export default function HomeScreen() {
  const [uri] = React.useState<string>(resolveWebAppUrl);
  const [failed, setFailed] = React.useState<boolean>(false);
  const [nonce, setNonce] = React.useState<number>(0);
  const webViewRef = React.useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = React.useState<boolean>(false);

  // F4: hardware Back closes web overlays first (best-effort Escape inject —
  // native cannot know modal state, no 2-way bridge by design), then goes
  // back in WebView history, and only exits when history is empty.
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      webViewRef.current?.injectJavaScript(
        "window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));true;"
      );
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const retry = React.useCallback(() => {
    setFailed(false);
    setNonce((n) => n + 1);
  }, []);

  if (failed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Không tải được giao diện WebApp</Text>
          <Text style={styles.hint}>
            Hãy chắc website đang chạy (npm run dev tại website-frontend, cổng 3000) rồi thử lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử tải lại giao diện WebApp"
            onPress={retry}
            style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <WebView
        key={nonce}
        ref={webViewRef}
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        onNavigationStateChange={(ns) => setCanGoBack(ns.canGoBack)}
        accessibilityLabel="Giao diện WebApp WorkGo"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  hint: { fontSize: 13, textAlign: 'center', opacity: 0.7 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2563EB' },
  retryText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
