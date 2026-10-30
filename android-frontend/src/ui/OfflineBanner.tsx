import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, spacing } from './theme';

export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const insets = useSafeAreaInsets();
  // null = not known yet: only warn once NetInfo says we are offline.
  if (isConnected !== false) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { paddingTop: insets.top + spacing.xs }]}>
      <Text style={styles.text}>Mất kết nối mạng</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.danger, paddingBottom: spacing.xs, alignItems: 'center' },
  text: { color: colors.white, fontSize: font.small, fontWeight: '600' },
});
