import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import type { OrderRole } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Chip, colors, EmptyState, ErrorState, font, SkeletonList, spacing } from '@/ui';

import { useOrders } from './hooks';
import { OrderRow } from './OrderRow';

export function OrdersScreen() {
  const signedIn = useRequireAuth();
  const { claims } = useAuth();
  const router = useRouter();
  const isProvider = hasRole(claims, 'PROVIDER');
  const [role, setRole] = React.useState<OrderRole>('CLIENT');
  const activeRole: OrderRole = isProvider ? role : 'CLIENT';
  const orders = useOrders(activeRole, signedIn);

  // Coming back to the tab shows fresh statuses.
  const { refetch } = orders;
  useFocusEffect(
    React.useCallback(() => {
      if (signedIn) void refetch();
    }, [signedIn, refetch])
  );

  if (!signedIn) return null;
  const items = orders.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Đơn hàng</Text>
        {isProvider ? (
          <View style={styles.switch}>
            <Chip label="Tôi đặt" selected={activeRole === 'CLIENT'} onPress={() => setRole('CLIENT')} />
            <Chip label="Tôi nhận" selected={activeRole === 'PROVIDER'} onPress={() => setRole('PROVIDER')} />
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
              title="Chưa có đơn hàng"
              hint={activeRole === 'CLIENT' ? 'Các dịch vụ bạn đặt sẽ hiện ở đây.' : 'Đơn khách đặt dịch vụ của bạn sẽ hiện ở đây.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  switch: { flexDirection: 'row', gap: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  pad: { padding: spacing.lg },
});
