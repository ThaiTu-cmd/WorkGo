import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Text, View } from 'react-native';

import type { RowStatus } from '@/api/adapters';
import { catalogErrorMessage, errorMessage } from '@/api/errors';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { EXECUTION_LABEL } from '@/features/catalog/ServiceCardView';
import { formatVnd } from '@/lib/format';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, font, makeStyles, Screen, SkeletonList, spacing } from '@/ui';

import { isForbidden, useDeleteService, useMyServices, useSetServiceStatus } from './hooks';
import { NotProviderNotice } from './NotProviderNotice';
import { translate, useT } from '@/i18n';

const STATUS_LABEL: Record<RowStatus, string> = {
  get ACTIVE() {
    return translate('myServicesScreen.dang_ban');
  },
  get DRAFT() {
    return translate('myServicesScreen.nhap');
  },
  get PAUSED() {
    return translate('myServicesScreen.tam_dung');
  },
};
const TABS: (RowStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'PAUSED', 'DRAFT'];

export function MyServicesScreen() {
  const t = useT();
  const styles = useStyles();
  const signedIn = useRequireAuth();
  const router = useRouter();
  const services = useMyServices(signedIn);
  const setStatus = useSetServiceStatus();
  const remove = useDeleteService();
  const [tab, setTab] = React.useState<RowStatus | 'ALL'>('ALL');

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (services.isError && isForbidden(services.error)) {
    return (
      <Screen edges={['bottom']}>
        <NotProviderNotice onRefreshed={() => void services.refetch()} />
      </Screen>
    );
  }

  const rows = (services.data ?? []).filter((r) => tab === 'ALL' || r.status === tab);
  const onError = (err: unknown) => Alert.alert(t('myServicesScreen.khong_thuc_hien_duoc'), catalogErrorMessage(err));

  return (
    <Screen edges={['bottom']} onRefresh={() => void services.refetch()} refreshing={services.isRefetching}>
      <View style={styles.stats}>
        <Stat label={t('myServicesScreen.dich_vu')} value={services.data?.length ?? 0} />
        <Stat label={t('myServicesScreen.dang_ban')} value={(services.data ?? []).filter((r) => r.status === 'ACTIVE').length} />
        <Stat label={t('myServicesScreen.don')} value={(services.data ?? []).reduce((n, r) => n + r.ordersCount, 0)} />
      </View>
      <Button title={t('myServicesScreen.tao_dich_vu')} onPress={() => router.push('/provider/services/new')} />
      <View style={styles.tabs}>
        {TABS.map((key) => (
          <Chip
            key={key}
            label={key === 'ALL' ? t('myServicesScreen.tat_ca') : STATUS_LABEL[key]}
            selected={tab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </View>

      {services.isPending ? (
        <SkeletonList count={3} height={140} />
      ) : services.isError ? (
        <ErrorState message={errorMessage(services.error)} onRetry={() => void services.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title={t('myServicesScreen.chua_co_dich_vu')} hint={t('myServicesScreen.tao_dich_vu_dau_tien')} />
      ) : (
        rows.map((r) => (
          <Card key={r.serviceId}>
            <View style={styles.row}>
              <Badge
                label={STATUS_LABEL[r.status]}
                tone={r.status === 'ACTIVE' ? 'success' : r.status === 'DRAFT' ? 'neutral' : 'warning'}
              />
              <Text style={styles.muted}>{EXECUTION_LABEL[r.executionType]}</Text>
            </View>
            <Text style={styles.title}>{r.title}</Text>
            <Text style={styles.muted}>
              {t('myServicesScreen.goi_don', {
                p0: r.basePrice === r.maxPrice ? formatVnd(r.basePrice) : `${formatVnd(r.basePrice)} – ${formatVnd(r.maxPrice)}`,
                p1: r.packagesCount,
                p2: ' ',
                p3: r.ordersCount,
              })}
            </Text>
            <View style={styles.actions}>
              <Button
                title={t('myServicesScreen.sua')}
                variant="secondary"
                style={styles.flex}
                onPress={() => router.push(`/provider/services/${r.serviceId}/edit`)}
              />
              <Button
                title={t('myServicesScreen.lich_trong')}
                variant="secondary"
                style={styles.flex}
                onPress={() => router.push(`/provider/services/${r.serviceId}/availability`)}
              />
            </View>
            <View style={styles.actions}>
              <Button
                title={r.status === 'ACTIVE' ? t('myServicesScreen.tam_dung') : t('myServicesScreen.dang_ban_2')}
                variant="secondary"
                style={styles.flex}
                loading={setStatus.isPending && setStatus.variables?.serviceId === r.serviceId}
                onPress={() =>
                  setStatus.mutate({ serviceId: r.serviceId, status: r.status === 'ACTIVE' ? 'PAUSED' : 'PUBLISHED' }, { onError })
                }
              />
              <Button
                title={t('myServicesScreen.xoa')}
                variant="secondary"
                style={styles.flex}
                onPress={() =>
                  Alert.alert(t('myServicesScreen.xoa_dich_vu'), t('myServicesScreen.xoa_2', { p0: r.title }), [
                    { text: t('myServicesScreen.huy'), style: 'cancel' },
                    { text: t('myServicesScreen.xoa'), style: 'destructive', onPress: () => remove.mutate(r.serviceId, { onError }) },
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
  const styles = useStyles();
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', padding: spacing.md, gap: 2 },
  statValue: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.body + 1, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.small + 1, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
}));
