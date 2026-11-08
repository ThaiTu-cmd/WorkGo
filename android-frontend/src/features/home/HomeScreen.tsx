import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { joinFullName } from '@/api/adapters';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { useMe } from '@/features/account/hooks';
import { buildHomeRails } from '@/features/catalog/homeRails';
import { useCategories, useServices } from '@/features/catalog/hooks';
import { useActiveOrder } from '@/features/orders/hooks';
import { colors, ErrorState, Skeleton, spacing } from '@/ui';

import { ActiveOrderCard } from './ActiveOrderCard';
import { CategoryGrid } from './CategoryGrid';
import { HomeHeader } from './HomeHeader';
import { ProviderShortcuts } from './ProviderShortcuts';
import { ServiceRail } from './ServiceRail';

export function HomeScreen() {
  const { status, claims } = useAuth();
  const signedIn = status === 'signedIn';
  const services = useServices();
  const categories = useCategories();
  const me = useMe(signedIn);
  const activeOrder = useActiveOrder(signedIn);

  const rails = React.useMemo(() => buildHomeRails(services.data ?? []), [services.data]);
  const name = signedIn ? joinFullName(me.data) || claims?.sub || null : null;

  const refresh = () => {
    void services.refetch();
    void categories.refetch();
    if (signedIn) void activeOrder.refetch();
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={services.isRefetching} onRefresh={refresh} />}>
      <HomeHeader name={name} />

      <View style={styles.section}>
        {categories.isPending ? <Skeleton height={150} /> : <CategoryGrid categories={categories.data?.roots ?? []} />}
      </View>

      {signedIn && activeOrder.data ? (
        <View style={styles.section}>
          <ActiveOrderCard order={activeOrder.data} />
        </View>
      ) : null}

      {hasRole(claims, 'PROVIDER') ? (
        <View style={styles.section}>
          <ProviderShortcuts />
        </View>
      ) : null}

      {services.isPending ? (
        <View style={styles.section}>
          <Skeleton height={180} />
        </View>
      ) : services.isError ? (
        <ErrorState message={errorMessage(services.error)} onRetry={refresh} />
      ) : (
        rails.map((rail) => <ServiceRail key={rail.key} rail={rail} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { gap: spacing.xl, paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.lg },
});
