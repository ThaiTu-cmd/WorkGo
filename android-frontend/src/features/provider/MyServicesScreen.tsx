import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import type { RowStatus } from '@/api/adapters';
import { errorMessage } from '@/api/errors';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { EXECUTION_LABEL } from '@/features/catalog/ServiceCardView';
import { formatVnd } from '@/lib/format';
import { Badge, Button, Card, Chip, colors, EmptyState, ErrorState, font, Screen, SkeletonList, spacing } from '@/ui';

import { isForbidden, useDeleteService, useMyServices, useSetServiceStatus } from './hooks';
import { NotProviderNotice } from './NotProviderNotice';

const STATUS_LABEL: Record<RowStatus, string> = { ACTIVE: 'Đang bán', DRAFT: 'Nháp', PAUSED: 'Tạm dừng' };
const TABS: (RowStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'PAUSED', 'DRAFT'];

export function MyServicesScreen() {
  const signedIn = useRequireAuth();
  const router = useRouter();
  const services = useMyServices(signedIn);
  const setStatus = useSetServiceStatus();
  const remove = useDeleteService();
  const [tab, setTab] = React.useState<RowStatus | 'ALL'>('ALL');

  if (!signedIn) return null;
  if (services.isError && isForbidden(services.error)) {
    return (
      <Screen edges={['bottom']}>
        <NotProviderNotice onRefreshed={() => void services.refetch()} />
      </Screen>
    );
  }

  const rows = (services.data ?? []).filter((r) => tab === 'ALL' || r.status === tab);
  const onError = (err: unknown) => Alert.alert('Không thực hiện được', errorMessage(err));

  return (
    <Screen edges={['bottom']} onRefresh={() => void services.refetch()} refreshing={services.isRefetching}>
      <View style={styles.stats}>
        <Stat label="Dịch vụ" value={services.data?.length ?? 0} />
        <Stat label="Đang bán" value={(services.data ?? []).filter((r) => r.status === 'ACTIVE').length} />
        <Stat label="Đơn" value={(services.data ?? []).reduce((n, r) => n + r.ordersCount, 0)} />
      </View>
      <Button title="Tạo dịch vụ" onPress={() => router.push('/provider/services/new')} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Chip key={t} label={t === 'ALL' ? 'Tất cả' : STATUS_LABEL[t]} selected={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>

      {services.isPending ? (
        <SkeletonList count={3} height={140} />
      ) : services.isError ? (
        <ErrorState message={errorMessage(services.error)} onRetry={() => void services.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có dịch vụ" hint="Tạo dịch vụ đầu tiên để khách tìm thấy bạn." />
      ) : (
        rows.map((r) => (
          <Card key={r.serviceId}>
            <View style={styles.row}>
              <Badge label={STATUS_LABEL[r.status]} tone={r.status === 'ACTIVE' ? 'success' : r.status === 'DRAFT' ? 'neutral' : 'warning'} />
              <Text style={styles.muted}>{EXECUTION_LABEL[r.executionType]}</Text>
            </View>
            <Text style={styles.title}>{r.title}</Text>
            <Text style={styles.muted}>
              {r.basePrice === r.maxPrice ? formatVnd(r.basePrice) : `${formatVnd(r.basePrice)} – ${formatVnd(r.maxPrice)}`} · {r.packagesCount} gói ·{' '}
              {r.ordersCount} đơn
            </Text>
            <View style={styles.actions}>
              <Button title="Sửa" variant="secondary" style={styles.flex} onPress={() => router.push(`/provider/services/${r.serviceId}/edit`)} />
              <Button
                title="Lịch trống"
                variant="secondary"
                style={styles.flex}
                onPress={() => router.push(`/provider/services/${r.serviceId}/availability`)}
              />
            </View>
            <View style={styles.actions}>
              <Button
                title={r.status === 'ACTIVE' ? 'Tạm dừng' : 'Đăng bán'}
                variant="secondary"
                style={styles.flex}
                loading={setStatus.isPending && setStatus.variables?.serviceId === r.serviceId}
                onPress={() =>
                  setStatus.mutate({ serviceId: r.serviceId, status: r.status === 'ACTIVE' ? 'PAUSED' : 'PUBLISHED' }, { onError })
                }
              />
              <Button
                title="Xoá"
                variant="secondary"
                style={styles.flex}
                onPress={() =>
                  Alert.alert('Xoá dịch vụ', `Xoá "${r.title}"?`, [
                    { text: 'Huỷ', style: 'cancel' },
                    { text: 'Xoá', style: 'destructive', onPress: () => remove.mutate(r.serviceId, { onError }) },
                  ])
                }
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', padding: spacing.md, gap: 2 },
  statValue: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.body + 1, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.small + 1, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
