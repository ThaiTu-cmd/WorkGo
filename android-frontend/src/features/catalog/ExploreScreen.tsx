import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { Chip, colors, EmptyState, ErrorState, font, radius, SkeletonList, spacing } from '@/ui';

import { FilterSheet } from './FilterSheet';
import { filterServices, type ServiceFilters } from './filterServices';
import { useCategories, useServices } from './hooks';
import { ServiceCardView } from './ServiceCardView';

export function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [filters, setFilters] = React.useState<ServiceFilters>({ categoryId: params.categoryId });
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const services = useServices();
  const categories = useCategories();

  // Coming from a Home category chip: adopt the new param once per change.
  const [seenCategoryParam, setSeenCategoryParam] = React.useState(params.categoryId);
  if (params.categoryId !== seenCategoryParam) {
    setSeenCategoryParam(params.categoryId);
    if (params.categoryId) setFilters((f) => ({ ...f, categoryId: params.categoryId }));
  }

  const results = React.useMemo(() => filterServices(services.data ?? [], filters), [services.data, filters]);
  const filterCount = [filters.executionType, filters.minPrice, filters.maxPrice].filter((v) => v !== undefined).length;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            accessibilityLabel="Tìm dịch vụ"
            placeholder="Tìm dịch vụ, danh mục, chuyên gia…"
            placeholderTextColor={colors.muted}
            value={filters.query ?? ''}
            onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
            style={styles.searchInput}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Bộ lọc" onPress={() => setSheetOpen(true)} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={filterCount ? colors.primaryDark : colors.text} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
        <Chip label="Tất cả" selected={!filters.categoryId} onPress={() => setFilters((f) => ({ ...f, categoryId: undefined }))} />
        {(categories.data?.all ?? []).map((c) => (
          <Chip
            key={c.categoryId}
            label={c.name}
            selected={filters.categoryId === c.categoryId}
            onPress={() => setFilters((f) => ({ ...f, categoryId: c.categoryId }))}
          />
        ))}
      </ScrollView>

      {services.isPending ? (
        <View style={styles.pad}>
          <SkeletonList count={4} height={120} />
        </View>
      ) : services.isError ? (
        <ErrorState message={errorMessage(services.error)} onRetry={() => void services.refetch()} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(s) => s.serviceId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={services.isRefetching} onRefresh={() => void services.refetch()} />}
          renderItem={({ item }) => <ServiceCardView service={item} onPress={() => router.push(`/service/${item.serviceId}`)} />}
          ListEmptyComponent={<EmptyState title="Không tìm thấy dịch vụ" hint="Thử từ khoá khác hoặc bỏ bớt bộ lọc." />}
        />
      )}

      {sheetOpen ? (
        <FilterSheet
          visible
          value={filters}
          onClose={() => setSheetOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setSheetOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: font.body, color: colors.text },
  filterBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  chipBar: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  pad: { padding: spacing.lg },
});
