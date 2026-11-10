import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text } from 'react-native';

import { NOT_PROVIDER_MESSAGE } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Card, colors, font } from '@/ui';

// Shown when a provider endpoint answers 403 (account not a verified provider,
// or the token predates the approval).
export function NotProviderNotice({ onRefreshed }: { onRefreshed?: () => void }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = React.useState(false);
  return (
    <Card>
      <Text style={styles.title}>Bạn chưa là chuyên gia</Text>
      <Text style={styles.text}>{NOT_PROVIDER_MESSAGE}</Text>
      <Button title="Làm provider" onPress={() => router.push('/provider/onboarding')} />
      <Button
        title="Cập nhật quyền"
        variant="secondary"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          const ok = await refresh();
          setBusy(false);
          if (ok) onRefreshed?.();
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.muted },
});
