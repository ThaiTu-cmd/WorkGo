import * as React from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ServiceCard } from '@/components/service-card';
import { LoadingSkeleton, EmptyState } from '@/components/states';
import { postsApi, type MobilePostItem } from '@/api/posts';
import { useSavedJobs } from '@/store/saved';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SavedJobsScreen() {
  const theme = useTheme();
  const { savedIds, loading: storeLoading } = useSavedJobs();
  const [loadedState, setLoadedState] = React.useState<{ idsKey: string; posts: MobilePostItem[] }>({
    idsKey: '',
    posts: [],
  });
  const [refreshing, setRefreshing] = React.useState(false);

  const idsKey = savedIds.join(',');
  const isFetching = !storeLoading && savedIds.length > 0 && loadedState.idsKey !== idsKey;
  const posts = savedIds.length === 0 ? [] : loadedState.posts;
  const loading = storeLoading || isFetching;

  React.useEffect(() => {
    if (storeLoading || savedIds.length === 0) return;
    let active = true;
    Promise.allSettled(savedIds.map((id) => postsApi.get(id)))
      .then((settled) => {
        if (!active) return;
        const loaded: MobilePostItem[] = [];
        for (const res of settled) {
          if (res.status === 'fulfilled' && res.value) {
            loaded.push(res.value);
          }
        }
        setLoadedState({ idsKey, posts: loaded });
      })
      .catch(() => {
        if (active) setLoadedState({ idsKey, posts: [] });
      });
    return () => {
      active = false;
    };
  }, [storeLoading, savedIds, idsKey]);

  const handleRefresh = React.useCallback(() => {
    if (savedIds.length === 0) return;
    setRefreshing(true);
    Promise.allSettled(savedIds.map((id) => postsApi.get(id)))
      .then((settled) => {
        const loaded: MobilePostItem[] = [];
        for (const res of settled) {
          if (res.status === 'fulfilled' && res.value) {
            loaded.push(res.value);
          }
        }
        setLoadedState({ idsKey, posts: loaded });
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [savedIds, idsKey]);

  const handleCardPress = React.useCallback((postId: string) => {
    router.push({
      pathname: '/detail',
      params: { id: postId },
    });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.headerTitle}>Việc đã lưu</ThemedText>
          <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]}>
            {savedIds.length} công việc đã lưu
          </ThemedText>
        </View>

        {loading || storeLoading ? (
          <View style={styles.padding}>
            <LoadingSkeleton count={3} />
          </View>
        ) : savedIds.length === 0 || posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Chưa lưu việc nào"
              description="Bạn chưa lưu tin tuyển dụng nào. Hãy khám phá và lưu lại những công việc phù hợp nhất."
              ctaLabel="Khám phá việc làm"
              onCtaPress={() => router.push('/catalog')}
            />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.postId}
            renderItem={({ item }) => (
              <ServiceCard post={item} onPress={handleCardPress} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />
        )}
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  padding: {
    padding: Spacing.four,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
  },
});
