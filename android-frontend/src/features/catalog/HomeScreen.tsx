import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { Chip, colors, ErrorState, font, Screen, SkeletonList, spacing } from '@/ui';

import { useCategories, useServices } from './hooks';
import { ServiceCardView } from './ServiceCardView';

export function HomeScreen() {
  const router = useRouter();
  const services = useServices();
  const categories = useCategories();
  const popular = [...(services.data ?? [])].sort((a, b) => b.orderCount - a.orderCount).slice(0, 6);

  const refresh = () => {
    void services.refetch();
    void categories.refetch();
  };

  return (
    <Screen onRefresh={refresh} refreshing={services.isRefetching}>
      <View style={styles.hero}>
        <Text style={styles.brand}>WorkGo</Text>
        <Text style={styles.tagline}>Tìm và đặt dịch vụ uy tín, thanh toán an toàn qua Escrow.</Text>
      </View>

      <Text style={styles.section}>Danh mục</Text>
      <View style={styles.chips}>
        {(categories.data?.roots ?? []).map((c) => (
          <Chip
            key={c.categoryId}
            label={c.name}
            onPress={() => router.push({ pathname: '/explore', params: { categoryId: c.categoryId } })}
          />
        ))}
      </View>

      <Text style={styles.section}>Dịch vụ nổi bật</Text>
      {services.isPending ? (
        <SkeletonList count={3} height={120} />
      ) : services.isError ? (
        <ErrorState message={errorMessage(services.error)} onRetry={refresh} />
      ) : (
        popular.map((s) => (
          <ServiceCardView key={s.serviceId} service={s} onPress={() => router.push(`/service/${s.serviceId}`)} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: spacing.xl, gap: spacing.sm },
  brand: { fontSize: 30, fontWeight: '800', color: colors.white },
  tagline: { fontSize: font.body, color: colors.white },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
