import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Button, Card, colors, EmptyState, ErrorState, font, Screen, SkeletonList, spacing } from '@/ui';

import { useAddresses, useDeleteAddress } from './hooks';

export function AddressesScreen() {
  const signedIn = useRequireAuth();
  const router = useRouter();
  const addresses = useAddresses(signedIn);
  const remove = useDeleteAddress();

  if (!signedIn) return null;

  const confirmDelete = (id: string, name: string) =>
    Alert.alert('Xoá địa chỉ', `Xoá địa chỉ "${name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => remove.mutate(id, { onError: (err) => Alert.alert('Không xoá được', errorMessage(err)) }),
      },
    ]);

  return (
    <Screen edges={['bottom']} onRefresh={() => void addresses.refetch()} refreshing={addresses.isRefetching}>
      <Button title="Thêm địa chỉ" onPress={() => router.push('/account/addresses/new')} />
      {addresses.isPending ? (
        <SkeletonList count={3} height={90} />
      ) : addresses.isError ? (
        <ErrorState message={errorMessage(addresses.error)} onRetry={() => void addresses.refetch()} />
      ) : addresses.data.length === 0 ? (
        <EmptyState title="Chưa có địa chỉ" hint="Thêm địa chỉ để đặt dịch vụ tại nhà." />
      ) : (
        addresses.data.map((a) => (
          <Card key={a.id}>
            <Text style={styles.title}>{a.label || a.receiver}</Text>
            <Text style={styles.text}>
              {a.receiver} · {a.phone}
            </Text>
            <Text style={styles.muted}>{a.detail}</Text>
            <View style={styles.actions}>
              <Button title="Sửa" variant="secondary" style={styles.flex} onPress={() => router.push(`/account/addresses/${a.id}`)} />
              <Button title="Xoá" variant="secondary" style={styles.flex} onPress={() => confirmDelete(a.id, a.label || a.detail)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.small + 1, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
