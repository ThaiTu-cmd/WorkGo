import * as React from 'react';
import {
  FlatList,
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
import { postsApi, type MobilePostItem } from '@/api/posts';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FEATURED_CHIPS = ['Thiết kế Logo', 'Lập trình Web', 'Dịch thuật Anh - Việt'];

export default function CatalogScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();

  const [query, setQuery] = React.useState<string>(params.q ?? '');
  const [selectedExecType, setSelectedExecType] = React.useState<ExecutionTypeChip>('ALL');
  const [filters, setFilters] = React.useState<FilterState>({
    category: params.category,
    executionType: undefined,
  });
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);

  const [categories, setCategories] = React.useState<MobileCategory[]>([]);
  const [posts, setPosts] = React.useState<MobilePostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtering, setFiltering] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

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

  const fetchMorePosts = async (nextPage: number) => {
    try {
      const resolvedExecType =
        selectedExecType !== 'ALL'
          ? selectedExecType
          : filters.executionType && filters.executionType !== 'ALL'
            ? filters.executionType
            : undefined;

      const res = await postsApi.list({
        q: query.trim() || undefined,
        category: filters.category,
        executionType: resolvedExecType,
        budgetMin: filters.budgetMin,
        budgetMax: filters.budgetMax,
        page: nextPage,
        limit: 10,
      });

      setPosts((prev) => [...prev, ...res.data]);
      setTotalPages(res.meta.totalPages);
      setPage(nextPage);
    } catch {
      // Keep existing list on pagination failure
    }
  };

  // Fetch when filters or query changes
  React.useEffect(() => {
    let active = true;

    // Trigger filtering asynchronously to avoid synchronous effect setState
    Promise.resolve().then(() => {
      if (active) setFiltering(true);
    });

    const resolvedExecType =
      selectedExecType !== 'ALL'
        ? selectedExecType
        : filters.executionType && filters.executionType !== 'ALL'
          ? filters.executionType
          : undefined;

    postsApi
      .list({
        q: query.trim() || undefined,
        category: filters.category,
        executionType: resolvedExecType,
        budgetMin: filters.budgetMin,
        budgetMax: filters.budgetMax,
        page: 1,
        limit: 10,
      })
      .then((res) => {
        if (active) {
          setPosts(res.data);
          setTotalPages(res.meta.totalPages);
          setPage(1);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ WorkGo'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setFiltering(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query, selectedExecType, filters]);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    const resolvedExecType =
      selectedExecType !== 'ALL'
        ? selectedExecType
        : filters.executionType && filters.executionType !== 'ALL'
          ? filters.executionType
          : undefined;

    postsApi
      .list({
        q: query.trim() || undefined,
        category: filters.category,
        executionType: resolvedExecType,
        budgetMin: filters.budgetMin,
        budgetMax: filters.budgetMax,
        page: 1,
        limit: 10,
      })
      .then((res) => {
        setPosts(res.data);
        setTotalPages(res.meta.totalPages);
        setPage(1);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ WorkGo'
        );
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [query, selectedExecType, filters]);

  const handleLoadMore = () => {
    if (page < totalPages && !loading && !filtering) {
      fetchMorePosts(page + 1);
    }
  };

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.budgetMin !== undefined || filters.budgetMax !== undefined ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

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
