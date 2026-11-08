import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SHORTCUTS: { label: string; icon: IconName; href: () => Href }[] = [
  { label: 'Dịch vụ của tôi', icon: 'briefcase-outline', href: () => '/provider/services' },
  { label: 'Đơn nhận', icon: 'file-tray-full-outline', href: () => ({ pathname: '/orders', params: { role: 'PROVIDER', t: String(Date.now()) } }) },
  { label: 'Tạo dịch vụ', icon: 'add-circle-outline', href: () => '/provider/services/new' },
];

export function ProviderShortcuts() {
  const router = useRouter();
  return (
    <View style={styles.row}>
      {SHORTCUTS.map((s) => (
        <Pressable key={s.label} accessibilityRole="button" accessibilityLabel={s.label} onPress={() => router.push(s.href())} style={styles.item}>
          <Ionicons name={s.icon} size={20} color={colors.primaryDark} />
          <Text style={styles.label} numberOfLines={1}>
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#E1F5EE',
  },
  label: { fontSize: font.small, fontWeight: '600', color: colors.primaryDark },
});
