import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { Avatar, Badge, Button, Card, font, makeStyles, Screen, spacing, useColors } from '@/ui';
import { useT } from '@/i18n';

export function AccountScreen() {
  const t = useT();
  const styles = useStyles();
  const { status, claims, signOut, refresh } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  if (status !== 'signedIn') {
    return (
      <Screen>
        <Text style={styles.title}>{t('accountScreen.tai_khoan')}</Text>
        <Card>
          <Text style={styles.hint}>{t('accountScreen.dang_nhap_de_dat_dich')}</Text>
          <Button title={t('accountScreen.dang_nhap')} onPress={() => router.push('/auth/login')} />
          <Button title={t('accountScreen.dang_ky')} variant="secondary" onPress={() => router.push('/auth/register')} />
        </Card>
        <Card style={styles.menu}>
          <MenuItem icon="settings-outline" label={t('accountScreen.cai_dat')} href="/account/settings" />
        </Card>
      </Screen>
    );
  }

  const isProvider = hasRole(claims, 'PROVIDER');

  // Picks up the PROVIDER role once an admin approves the profile, without signing out.
  const updateRoles = async () => {
    setRefreshing(true);
    const ok = await refresh();
    setRefreshing(false);
    Alert.alert(ok ? t('accountScreen.da_cap_nhat_quyen') : t('accountScreen.khong_cap_nhat_duoc_hay'));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={claims?.sub ?? '?'} size={56} />
        <View style={styles.flex}>
          <Text style={styles.title}>{claims?.sub}</Text>
          <Badge label={isProvider ? t('accountScreen.chuyen_gia') : t('accountScreen.khach_hang')} tone={isProvider ? 'success' : 'neutral'} />
        </View>
      </View>

      <Card style={styles.menu}>
        <MenuItem icon="person-outline" label={t('accountScreen.thong_tin_ca_nhan')} href="/account/profile" />
        <MenuItem icon="location-outline" label={t('accountScreen.so_dia_chi')} href="/account/addresses" />
      </Card>

      <Card style={styles.menu}>
        {isProvider ? (
          <>
            <MenuItem icon="briefcase-outline" label={t('accountScreen.dich_vu_cua_toi')} href="/provider/services" />
            <MenuItem icon="receipt-outline" label={t('accountScreen.don_khach_dat')} href="/orders?role=PROVIDER" />
          </>
        ) : (
          <MenuItem icon="ribbon-outline" label={t('accountScreen.tro_thanh_chuyen_gia')} href="/provider/onboarding" />
        )}
      </Card>

      <Card style={styles.menu}>
        <MenuItem icon="settings-outline" label={t('accountScreen.cai_dat')} href="/account/settings" />
      </Card>

      <Button title={t('accountScreen.cap_nhat_quyen')} variant="secondary" loading={refreshing} onPress={() => void updateRoles()} />
      <Button title={t('accountScreen.dang_xuat')} variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

function MenuItem({ icon, label, href }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; href: Href }) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} style={styles.item}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={styles.itemLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.body, color: colors.muted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  menu: { paddingVertical: spacing.xs, gap: 0 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  itemLabel: { flex: 1, fontSize: font.body, color: colors.text },
}));
