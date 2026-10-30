import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, colors, font, Screen } from '@/ui';

// Inline state for a protected screen seen by a guest.
export function LoginRequired({ message = 'Đăng nhập để tiếp tục.', edges }: { message?: string; edges?: ('top' | 'bottom')[] }) {
  const router = useRouter();
  return (
    <Screen edges={edges}>
      <Card>
        <Text style={styles.title}>Bạn chưa đăng nhập</Text>
        <Text style={styles.text}>{message}</Text>
        <Button title="Đăng nhập" onPress={() => router.push('/auth/login')} />
        <Button title="Đăng ký" variant="secondary" onPress={() => router.push('/auth/register')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.muted },
});
