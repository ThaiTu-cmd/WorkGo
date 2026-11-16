import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Button, Card, EmptyState, ErrorState, font, makeStyles, Screen, SkeletonList, spacing } from '@/ui';

import { useAddresses, useDeleteAddress } from './hooks';
import { useT } from '@/i18n';

export function AddressesScreen() {
  const t = useT();
  const styles = useStyles();
  const signedIn = useRequireAuth();
  const router = useRouter();
  const addresses = useAddresses(signedIn);
  const remove = useDeleteAddress();

  if (!signedIn) return <LoginRequired edges={['bottom']} />;

  const confirmDelete = (id: string, name: string) =>
    Alert.alert(t('addressesScreen.xoa_dia_chi'), t('addressesScreen.xoa_dia_chi_2', { p0: name }), [
      { text: t('addressesScreen.huy'), style: 'cancel' },
      {
        text: t('addressesScreen.xoa'),
        style: 'destructive',
        onPress: () => remove.mutate(id, { onError: (err) => Alert.alert(t('addressesScreen.khong_xoa_duoc'), errorMessage(err)) }),
      },
    ]);

  return (
    <Screen edges={['bottom']} onRefresh={() => void addresses.refetch()} refreshing={addresses.isRefetching}>
      <Button title={t('addressesScreen.them_dia_chi')} onPress={() => router.push('/account/addresses/new')} />
      {addresses.isPending ? (
        <SkeletonList count={3} height={90} />
      ) : addresses.isError ? (
        <ErrorState message={errorMessage(addresses.error)} onRetry={() => void addresses.refetch()} />
      ) : addresses.data.length === 0 ? (
        <EmptyState title={t('addressesScreen.chua_co_dia_chi')} hint={t('addressesScreen.them_dia_chi_de_dat')} />
      ) : (
        addresses.data.map((a) => (
          <Card key={a.id}>
            <Text style={styles.title}>{a.label || a.receiver}</Text>
            <Text style={styles.text}>
              {a.receiver} · {a.phone}
            </Text>
            <Text style={styles.muted}>{a.detail}</Text>
            <View style={styles.actions}>
              <Button title={t('addressesScreen.sua')} variant="secondary" style={styles.flex} onPress={() => router.push(`/account/addresses/${a.id}`)} />
              <Button title={t('addressesScreen.xoa')} variant="secondary" style={styles.flex} onPress={() => confirmDelete(a.id, a.label || a.detail)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.small + 1, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
}));
