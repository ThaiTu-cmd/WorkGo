import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, spacing, useColors } from './theme';
import { useT } from '@/i18n';

export function OfflineBanner() {
  const t = useT();
  const { isConnected } = useNetInfo();
  const insets = useSafeAreaInsets();
  const c = useColors();
  if (isConnected !== false) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: c.danger, paddingTop: insets.top + spacing.xs }]}>
      <Text style={[styles.text, { color: c.white }]}>{t('offlineBanner.mat_ket_noi_mang')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingBottom: spacing.xs, alignItems: 'center' },
  text: { fontSize: font.small, fontWeight: '600' },
});
