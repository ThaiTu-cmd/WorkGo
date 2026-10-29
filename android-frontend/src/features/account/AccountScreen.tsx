import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Avatar, Button, Card, colors, font, Screen, spacing } from '@/ui';

export function AccountScreen() {
  const { status, claims, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={claims?.sub ?? '?'} size={56} />
        <Text style={styles.title}>{claims?.sub}</Text>
      </View>
      <Button title="Đăng xuất" variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.body, color: colors.muted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
