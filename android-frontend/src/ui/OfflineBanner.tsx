import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, spacing, useColors } from './theme';

export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const insets = useSafeAreaInsets();
  const c = useColors();
  if (isConnected !== false) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: c.danger, paddingTop: insets.top + spacing.xs }]}>
      <Text style={[styles.text, { color: c.white }]}>Mất kết nối mạng</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingBottom: spacing.xs, alignItems: 'center' },
  text: { fontSize: font.small, fontWeight: '600' },
});
