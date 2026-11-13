import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import type { OrderRole } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Chip, EmptyState, ErrorState, font, makeStyles, SkeletonList, spacing } from '@/ui';

import { useOrders } from './hooks';
import { OrderRow } from './OrderRow';
import { useT } from '@/i18n';

export function OrdersScreen() {
  const t = useT();
  const styles = useStyles();
  const signedIn = useRequireAuth({ prompt: false });
  const { claims } = useAuth();
  const router = useRouter();
  const isProvider = hasRole(claims, 'PROVIDER');
  // `role=PROVIDER` (home shortcut "Đơn nhận", account menu) opens the received-orders side.
  const params = useLocalSearchParams<{ role?: string; t?: string }>();
  const [role, setRole] = React.useState<OrderRole>(params.role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT');
  const roleKey = `${params.role ?? ''}|${params.t ?? ''}`;
  const [seenRoleKey, setSeenRoleKey] = React.useState(roleKey);
  if (roleKey !== seenRoleKey) {
    setSeenRoleKey(roleKey);
    if (params.role === 'PROVIDER' || params.role === 'CLIENT') setRole(params.role);
  }
  const activeRole: OrderRole = isProvider ? role : 'CLIENT';
  const orders = useOrders(activeRole, signedIn);

  // Coming back to the tab shows fresh statuses.
  const { refetch } = orders;
  useFocusEffect(
    React.useCallback(() => {
      if (signedIn) void refetch();
    }, [signedIn, refetch])
  );

  if (!signedIn) return <LoginRequired edges={['top']} message={t('ordersScreen.dang_nhap_de_xem_don')} />;
  const items = orders.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('ordersScreen.don_hang')}</Text>
        {isProvider ? (
          <View style={styles.switch}>
            <Chip label={t('ordersScreen.toi_dat')} selected={activeRole === 'CLIENT'} onPress={() => setRole('CLIENT')} />
            <Chip label={t('ordersScreen.toi_nhan')} selected={activeRole === 'PROVIDER'} onPress={() => setRole('PROVIDER')} />
          </View>
        ) : null}
      </View>

      {orders.isPending ? (
        <View style={styles.pad}>
          <SkeletonList count={4} height={96} />
        </View>
      ) : orders.isError ? (
        <ErrorState message={errorMessage(orders.error)} onRetry={() => void orders.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => o.orderId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => void orders.refetch()} />}
          onEndReached={() => {
            if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
          }}
          ListFooterComponent={orders.isFetchingNextPage ? <ActivityIndicator /> : null}
          renderItem={({ item }) => (
            <OrderRow
              order={item}
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.orderId, role: activeRole } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('ordersScreen.chua_co_don_hang')}
              hint={activeRole === 'CLIENT' ? t('ordersScreen.cac_dich_vu_ban_dat') : t('ordersScreen.don_khach_dat_dich_vu')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  switch: { flexDirection: 'row', gap: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  pad: { padding: spacing.lg },
}));
