import * as React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

export type WebAppPrototype = { slug: string; titleVi: string; titleEn: string };

export const WEBAPP_PROTOTYPES: WebAppPrototype[] = [
  { slug: 'catalog-search.html', titleVi: 'Tìm kiếm dịch vụ (Catalog)', titleEn: 'Catalog Search' },
  { slug: 'service-detail.html', titleVi: 'Chi tiết dịch vụ', titleEn: 'Service Detail' },
  { slug: 'my-services.html', titleVi: 'Dịch vụ của tôi', titleEn: 'My Services' },
  { slug: 'service-form.html', titleVi: 'Tạo dịch vụ (Form 3 bước)', titleEn: 'Service Form' },
];

export function resolveMirrorBase(opts?: { devHost?: string }): string {
  const fromEnv = process.env.EXPO_PUBLIC_MIRROR_BASE_URL;
  if (fromEnv) return fromEnv;
  if (opts?.devHost) return opts.devHost;
  // Android emulator cannot reach host `localhost`; 10.0.2.2 maps to the host loopback.
  if (__DEV__ && Platform.OS === 'android') return 'http://10.0.2.2:5191';
  return 'http://localhost:5191';
}

export async function openPrototype(slug: string, baseUrl?: string): Promise<void> {
  const url = `${baseUrl ?? resolveMirrorBase()}/${slug}`;
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}

export default function WebAppPreviewScreen() {
  const [base, setBase] = React.useState<string>(resolveMirrorBase());

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.hero}>WebApp Mirror Preview</Text>
        <Text>Base đang dùng: {base}</Text>
        <Text style={styles.guide}>
          Mở máy chủ prototypes trước: node scripts/serve-mirrors.mjs (cổng :5191 website,
          :5193 android). Trên emulator Android dùng base 10.0.2.2; có thể ghi đè qua
          EXPO_PUBLIC_MIRROR_BASE_URL.
        </Text>
        <View style={styles.list}>
          {WEBAPP_PROTOTYPES.map((proto) => (
            <Pressable
              key={proto.slug}
              accessibilityRole="button"
              accessibilityLabel={`Mở ${proto.titleVi}`}
              onPress={() => openPrototype(proto.slug, base)}
              style={styles.button}>
              <Text style={styles.buttonTitle}>{proto.titleVi}</Text>
              <Text>{proto.slug}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đổi base URL sang cổng Android 5193"
          onPress={() => setBase('http://10.0.2.2:5193')}
          style={styles.button}>
          <Text style={styles.buttonTitle}>Dùng base Android :5193</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 16 },
  hero: { fontSize: 26, fontWeight: '700' },
  guide: { fontSize: 13, opacity: 0.7 },
  list: { gap: 8 },
  button: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  buttonTitle: { fontSize: 15, fontWeight: '600' },
});
