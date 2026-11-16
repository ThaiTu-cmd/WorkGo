import { useRouter } from 'expo-router';
import * as React from 'react';
import { Text } from 'react-native';

import { notProviderMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Card, font, makeStyles } from '@/ui';
import { useT } from '@/i18n';

// Shown when a provider endpoint answers 403 (account not a verified provider,
// or the token predates the approval).
export function NotProviderNotice({ onRefreshed }: { onRefreshed?: () => void }) {
  const t = useT();
  const styles = useStyles();
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = React.useState(false);
  return (
    <Card>
      <Text style={styles.title}>{t('notProviderNotice.ban_chua_la_chuyen_gia')}</Text>
      <Text style={styles.text}>{notProviderMessage()}</Text>
      <Button title={t('notProviderNotice.lam_provider')} onPress={() => router.push('/provider/onboarding')} />
      <Button
        title={t('notProviderNotice.cap_nhat_quyen')}
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

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.muted },
}));
