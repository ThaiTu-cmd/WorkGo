import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button, Card, font, makeStyles, Screen } from '@/ui';
import { useT } from '@/i18n';

// Inline state for a protected screen seen by a guest.
export function LoginRequired({ message, edges }: { message?: string; edges?: ('top' | 'bottom')[] }) {
  const t = useT();
  const styles = useStyles();
  const router = useRouter();
  return (
    <Screen edges={edges}>
      <Card>
        <Text style={styles.title}>{t('loginRequired.ban_chua_dang_nhap')}</Text>
        <Text style={styles.text}>{message ?? t('loginRequired.dang_nhap_de_tiep_tuc')}</Text>
        <Button title={t('loginRequired.dang_nhap')} onPress={() => router.push('/auth/login')} />
        <Button title={t('loginRequired.dang_ky')} variant="secondary" onPress={() => router.push('/auth/register')} />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.muted },
}));
