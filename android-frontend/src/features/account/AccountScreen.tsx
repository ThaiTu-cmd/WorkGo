import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { Avatar, Badge, Button, Card, colors, font, Screen, spacing } from '@/ui';

export function AccountScreen() {
  const { status, claims, signOut, refresh } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  if (status !== 'signedIn') {
    return (
      <Screen>
        <Text style={styles.title}>Tài khoản</Text>
        <Card>
          <Text style={styles.hint}>Đăng nhập để đặt dịch vụ, theo dõi đơn hàng và quản lý dịch vụ của bạn.</Text>
          <Button title="Đăng nhập" onPress={() => router.push('/auth/login')} />
          <Button title="Đăng ký" variant="secondary" onPress={() => router.push('/auth/register')} />
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
    Alert.alert(ok ? 'Đã cập nhật quyền' : 'Không cập nhật được, hãy đăng nhập lại.');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={claims?.sub ?? '?'} size={56} />
        <View style={styles.flex}>
          <Text style={styles.title}>{claims?.sub}</Text>
          <Badge label={isProvider ? 'Chuyên gia' : 'Khách hàng'} tone={isProvider ? 'success' : 'neutral'} />
        </View>
      </View>

      <Card style={styles.menu}>
        <MenuItem icon="person-outline" label="Thông tin cá nhân" href="/account/profile" />
        <MenuItem icon="location-outline" label="Sổ địa chỉ" href="/account/addresses" />
      </Card>

      <Card style={styles.menu}>
        {isProvider ? (
          <>
            <MenuItem icon="briefcase-outline" label="Dịch vụ của tôi" href="/provider/services" />
            <MenuItem icon="receipt-outline" label="Đơn khách đặt" href="/orders" />
          </>
        ) : (
          <MenuItem icon="ribbon-outline" label="Trở thành chuyên gia" href="/provider/onboarding" />
        )}
      </Card>

      <Button title="Cập nhật quyền" variant="secondary" loading={refreshing} onPress={() => void updateRoles()} />
      <Button title="Đăng xuất" variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

function MenuItem({ icon, label, href }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; href: Href }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} style={styles.item}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={styles.itemLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.body, color: colors.muted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  menu: { paddingVertical: spacing.xs, gap: 0 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  itemLabel: { flex: 1, fontSize: font.body, color: colors.text },
});
