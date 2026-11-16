import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { Chip, EmptyState, ErrorState, font, makeStyles, radius, SkeletonList, spacing, useColors } from '@/ui';

import { filtersFromParams } from './exploreParams';
import { FilterSheet } from './FilterSheet';
import { filterServices, type ServiceFilters } from './filterServices';
import { useCategories, useServices } from './hooks';
import { ServiceCardView } from './ServiceCardView';
import { useT } from '@/i18n';

export function ExploreScreen() {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  // `t` is a nonce the home screen sends so the same link re-applies on a tab that is already open.
  const params = useLocalSearchParams<{ categoryId?: string; executionType?: string; focus?: string; t?: string }>();
  const [filters, setFilters] = React.useState<ServiceFilters>(() => filtersFromParams(params));
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const services = useServices();
  const categories = useCategories();
  const searchRef = React.useRef<TextInput>(null);

  // Coming from the home screen: adopt the new filters once per navigation.
  const paramKey = `${params.categoryId ?? ''}|${params.executionType ?? ''}|${params.t ?? ''}`;
  const [seenParamKey, setSeenParamKey] = React.useState(paramKey);
  if (paramKey !== seenParamKey) {
    setSeenParamKey(paramKey);
    setFilters(filtersFromParams(params));
  }

  // The home search box opens Explore ready to type.
  React.useEffect(() => {
    if (params.focus === '1') searchRef.current?.focus();
  }, [params.focus, params.t]);

  const results = React.useMemo(() => filterServices(services.data ?? [], filters), [services.data, filters]);
  const filterCount = [filters.executionType, filters.minPrice, filters.maxPrice].filter((v) => v !== undefined).length;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            ref={searchRef}
            accessibilityLabel={t('exploreScreen.tim_dich_vu')}
            placeholder={t('exploreScreen.tim_dich_vu_danh_muc')}
            placeholderTextColor={colors.muted}
            value={filters.query ?? ''}
            onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
            style={styles.searchInput}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('exploreScreen.bo_loc')} onPress={() => setSheetOpen(true)} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={filterCount ? colors.primaryDark : colors.text} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
        <Chip label={t('exploreScreen.tat_ca')} selected={!filters.categoryId} onPress={() => setFilters((f) => ({ ...f, categoryId: undefined }))} />
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
          ListEmptyComponent={<EmptyState title={t('exploreScreen.khong_tim_thay_dich_vu')} hint={t('exploreScreen.thu_tu_khoa_khac_hoac')} />}
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

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
  },
  // ScrollView shrinks by default: without flexShrink 0 a long list below squeezes the chips.
  chipBar: { flexGrow: 0, flexShrink: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  pad: { padding: spacing.lg },
}));
