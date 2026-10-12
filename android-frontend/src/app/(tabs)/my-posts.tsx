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
import { PressableScale } from '@/components/pressable-scale';
import { LoadingSkeleton, EmptyState } from '@/components/states';
import { useAuth } from '@/store/auth';
import { formatVND } from '@/utils/format';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMyPosts } from '@/hooks/use-my-posts';

export default function MyPostsScreen() {
  const theme = useTheme();
  const { session, loading: authLoading } = useAuth();
  const {
    posts: allPosts,
    stats,
    loading: postsLoading,
    refreshing,
    closingId,
    refresh: handleRefresh,
    closePost: handleClosePost,
  } = useMyPosts();

  const PAGE_SIZE = 10;
  const [page, setPage] = React.useState(1);

  const posts = React.useMemo(() => {
    return allPosts.slice(0, page * PAGE_SIZE);
  }, [allPosts, page]);

  const handleEndReached = () => {
    if (posts.length < allPosts.length) {
      setPage((prev) => prev + 1);
    }
  };

  const loading = authLoading || postsLoading;

  if (!authLoading && !session) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Yêu cầu đăng nhập"
              description="Vui lòng đăng nhập để xem và quản lý các bài đăng tuyển dụng của bạn."
              ctaLabel="Đăng nhập ngay"
              onCtaPress={() => router.push('/(auth)/login')}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.headerTitle}>Quản lý tin đăng</ThemedText>
          <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]}>
            Danh sách việc bạn đã tạo trên WorkGo
          </ThemedText>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {stats.total}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Tổng tin
            </ThemedText>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {stats.open}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Đang mở
            </ThemedText>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.statValue, { color: theme.textSecondary }]}>
              {stats.closed}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Đã đóng
            </ThemedText>
          </View>
        </View>

        {loading ? (
          <View style={styles.padding}>
            <LoadingSkeleton count={3} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Chưa có bài đăng nào"
              description="Bạn chưa đăng tin tuyển dụng nào trên nền tảng. Hãy tạo bài đăng để tiếp cận hàng ngàn đối tác chuyên nghiệp."
              ctaLabel="Khám phá việc làm"
              onCtaPress={() => router.push('/catalog')}
            />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.postId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardDismissMode="on-drag"
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            renderItem={({ item }) => {
              const isClosed = item.status === 'CLOSED';
              return (
                <View
                  style={[
                    styles.postCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isClosed ? '#F3F4F6' : '#ECFDF5',
                            borderColor: isClosed ? '#E5E7EB' : '#A7F3D0',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusBadgeText,
                            { color: isClosed ? '#6B7280' : '#047857' },
                          ]}
                        >
                          {isClosed ? 'Đã đóng' : 'Đang mở'}
                        </ThemedText>
                      </View>
                      {item.categoryName && (
                        <ThemedText
                          numberOfLines={1}
                          style={[styles.categoryTag, { color: theme.textSecondary }]}
                        >
                          🏷️ {item.categoryName}
                        </ThemedText>
                      )}
                    </View>

                    <ThemedText numberOfLines={2} style={styles.postTitle}>
                      {item.title}
                    </ThemedText>

                    <View style={styles.priceRow}>
                      <ThemedText style={[styles.pricePrefix, { color: theme.textSecondary }]}>
                        Ngân sách:
                      </ThemedText>
                      <ThemedText style={[styles.priceValue, { color: theme.primary }]}>
                        {formatVND(item.budgetMin)}
                        {item.budgetMax ? ` - ${formatVND(item.budgetMax)}` : ''}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <View style={styles.applicantsInfo}>
                      {item.proposalsCount !== undefined ? (
                        <ThemedText style={[styles.applicantsText, { color: theme.textSecondary }]}>
                          💬 {item.proposalsCount} đề xuất
                        </ThemedText>
                      ) : (
                        <ThemedText style={[styles.applicantsText, { color: theme.textSecondary }]}>
                          💼 Tuyển dụng WorkGo
                        </ThemedText>
                      )}
                    </View>

                    <View style={styles.actionButtons}>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel="Xem chi tiết việc"
                        style={[
                          styles.detailBtn,
                          { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: '/detail',
                            params: { id: item.postId },
                          })
                        }
                      >
                        <ThemedText style={styles.detailBtnText}>Xem chi tiết</ThemedText>
                      </PressableScale>

                      {!isClosed && (
                        <PressableScale
                          accessibilityRole="button"
                          accessibilityLabel="Đóng tin tuyển dụng"
                          accessibilityHint="Đóng tin tuyển dụng để dừng nhận đề xuất"
                          style={[
                            styles.closeBtn,
                            {
                              opacity: closingId === item.postId ? 0.6 : 1,
                            },
                          ]}
                          onPress={() => handleClosePost(item)}
                          disabled={closingId === item.postId}
                        >
                          <ThemedText style={styles.closeBtnText}>
                            {closingId === item.postId ? 'Đang đóng...' : 'Đóng tin'}
                          </ThemedText>
                        </PressableScale>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  statCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
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
    gap: Spacing.three,
  },
  postCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  cardHeader: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTag: {
    fontSize: 12,
    flexShrink: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  pricePrefix: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  applicantsInfo: {
    flex: 1,
  },
  applicantsText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  detailBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
});
