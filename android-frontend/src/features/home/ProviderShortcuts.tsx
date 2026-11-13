import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { font, makeStyles, radius, spacing, useColors } from '@/ui';
import { translate } from '@/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SHORTCUTS: { label: string; icon: IconName; href: () => Href }[] = [
  {
    get label() {
      return translate('providerShortcuts.dich_vu_cua_toi');
    },
    icon: 'briefcase-outline',
    href: () => '/provider/services',
  },
  {
    get label() {
      return translate('providerShortcuts.don_nhan');
    },
    icon: 'file-tray-full-outline',
    href: () => ({ pathname: '/orders', params: { role: 'PROVIDER', t: String(Date.now()) } }),
  },
  {
    get label() {
      return translate('providerShortcuts.tao_dich_vu');
    },
    icon: 'add-circle-outline',
    href: () => '/provider/services/new',
  },
];

export function ProviderShortcuts() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  return (
    <View style={styles.row}>
      {SHORTCUTS.map((s) => (
        <Pressable
          key={s.label}
          accessibilityRole="button"
          accessibilityLabel={s.label}
          onPress={() => router.push(s.href())}
          style={styles.item}>
          <Ionicons name={s.icon} size={20} color={colors.primaryDark} />
          <Text style={styles.label} numberOfLines={1}>
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
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
}));
