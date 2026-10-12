import * as React from 'react';
import { Alert } from 'react-native';
import { postsApi, type MobilePostItem } from '@/api/posts';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/toast';
import { hapticFeedback } from '@/utils/haptics';

export function appendUniquePosts(prev: MobilePostItem[], next: MobilePostItem[]): MobilePostItem[] {
  const existingIds = new Set(prev.map((p) => String(p.postId)));
  const uniqueNext = next.filter((p) => !existingIds.has(String(p.postId)));
  return [...prev, ...uniqueNext];
}

export function useMyPosts() {
  const { session, loading: authLoading } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = React.useState<MobilePostItem[]>([]);
  const [fetching, setFetching] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [closingId, setClosingId] = React.useState<string | null>(null);

  const currentUserId = session?.userId ?? null;

  React.useEffect(() => {
    if (authLoading || !currentUserId) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setFetching(true);
    });
    postsApi
      .getMyPosts()
      .then((data) => {
        if (!active) return;
        setPosts(data);
      })
      .catch(() => {
        if (!active) return;
        toast.show('Không thể tải danh sách bài đăng', 'error');
        setPosts([]);
      })
      .finally(() => {
        if (active) setFetching(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, currentUserId, toast]);

  const refresh = React.useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    try {
      const data = await postsApi.getMyPosts();
      setPosts(data);
    } catch {
      toast.show('Không thể tải danh sách bài đăng', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId, toast]);

  const closePost = React.useCallback(
    (post: MobilePostItem) => {
      Alert.alert(
        'Xác nhận đóng tin',
        `Bạn có chắc chắn muốn đóng tin "${post.title}" không? Sau khi đóng, đối tác sẽ không thể gửi báo giá mới.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đóng tin',
            style: 'destructive',
            onPress: async () => {
              try {
                setClosingId(post.postId);
                await postsApi.close(post.postId);
                await hapticFeedback.success();
                toast.show('Đã đóng tin tuyển dụng thành công', 'success');
                await refresh();
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Không thể đóng bài đăng';
                toast.show(msg, 'error');
              } finally {
                setClosingId(null);
              }
            },
          },
        ]
      );
    },
    [refresh, toast]
  );

  const stats = React.useMemo(() => {
    const total = posts.length;
    const open = posts.filter((p) => p.status === 'OPEN').length;
    const closed = posts.filter((p) => p.status === 'CLOSED').length;
    return { total, open, closed };
  }, [posts]);

  return {
    posts,
    stats,
    loading: authLoading || fetching,
    refreshing,
    closingId,
    refresh,
    closePost,
  };
}
