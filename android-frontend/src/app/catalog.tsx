import * as React from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableScale } from '@/components/pressable-scale';
import { SearchBar, type ExecutionTypeChip } from '@/components/search-bar';
import { ServiceCard } from '@/components/service-card';
import { FilterSheet, type FilterState } from '@/components/filter-sheet';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/states';
import { catalogApi, type MobileCategory } from '@/api/catalog';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCatalogPosts } from '@/hooks/use-catalog-posts';

const FEATURED_CHIPS = ['Thiết kế Logo', 'Lập trình Web', 'Dịch thuật Anh - Việt'];

export default function CatalogScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();

  const [query, setQuery] = React.useState<string>(params.q ?? '');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selectedExecType, setSelectedExecType] = React.useState<ExecutionTypeChip>('ALL');
  const [filters, setFilters] = React.useState<FilterState>({
    category: params.category,
    executionType: undefined,
  });
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);

  const [categories, setCategories] = React.useState<MobileCategory[]>([]);

  // Fetch categories on mount
  React.useEffect(() => {
    let active = true;
    catalogApi.getRootCategories().then((cats) => {
      if (active) setCategories(cats);
    });
    return () => {
      active = false;
    };
  }, []);

  const resolvedExecType =
    selectedExecType !== 'ALL'
      ? selectedExecType
      : filters.executionType && filters.executionType !== 'ALL'
        ? filters.executionType
        : undefined;

  const {
    posts: rawPosts,
    loading,
    filtering,
    refreshing,
    error,
    refresh: handleRefresh,
    loadMore: handleLoadMore,
  } = useCatalogPosts({
    query: debouncedQuery,
    category: filters.category,
    executionType: resolvedExecType,
    budgetMin: filters.budgetMin,
    budgetMax: filters.budgetMax,
    limit: 10,
  });

  const posts = React.useMemo(() => {
    if (!filters.location || filters.location === 'ALL') return rawPosts;
    const loc = filters.location.toLowerCase();
    return rawPosts.filter((p) => p.locationSnapshot?.toLowerCase().includes(loc));
  }, [rawPosts, filters.location]);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.budgetMin !== undefined || filters.budgetMax !== undefined ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.location ? 1 : 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navigation / Header Row */}
        <View style={styles.topNav}>
          <PressableScale
            style={[
              styles.backBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <ThemedText style={styles.backBtnText}>←</ThemedText>
          </PressableScale>
          <ThemedText style={styles.screenTitle}>Khám phá việc làm</ThemedText>
          <View style={styles.navPlaceholder} />
        </View>

        {/* Search Bar + Execution Chips */}
        <SearchBar
          query={query}
          onChangeQuery={setQuery}
          onSubmitQuery={() => {}}
          selectedExecType={selectedExecType}
          onSelectExecType={(type) => {
            setSelectedExecType(type);
          }}
          onOpenFilter={() => setFilterSheetVisible(true)}
          activeFilterCount={activeFilterCount}
        />

        {/* Content Section */}
        {loading || filtering ? (
          <LoadingSkeleton count={4} />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={handleRefresh}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            title="Không tìm thấy việc phù hợp"
            description="Hãy thử từ khóa khác hoặc xóa bộ lọc để xem các công việc đang mở."
            featuredChips={FEATURED_CHIPS}
            onChipPress={(chip) => {
              setQuery(chip);
            }}
            ctaLabel="Đặt lại bộ lọc"
            onCtaPress={() => {
              setQuery('');
              setSelectedExecType('ALL');
              setFilters({});
            }}
          />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.postId}
            windowSize={5}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardDismissMode="on-drag"
            // Note: getItemLayout is omitted because service card height varies dynamically (~280-320px) depending on title length clamp (1-2 lines) and proposal badges
            renderItem={({ item }) => (
              <ServiceCard
                post={item}
                onPress={(id) => {
                  router.push({
                    pathname: '/detail',
                    params: { id },
                  });
                }}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
          />
        )}

        {/* Filter Sheet Modal */}
        <FilterSheet
          visible={filterSheetVisible}
          onClose={() => setFilterSheetVisible(false)}
          categories={categories}
          currentFilters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
          }}
          onReset={() => {
            setFilters({});
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  navPlaceholder: {
    width: 38,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
