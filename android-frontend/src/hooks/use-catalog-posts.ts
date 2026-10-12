import * as React from 'react';
import { postsApi, type MobilePostItem, type MobilePostFilters } from '@/api/posts';

export interface UseCatalogPostsOptions {
  query?: string;
  category?: string;
  executionType?: string;
  budgetMin?: number;
  budgetMax?: number;
  limit?: number;
}

export function appendUniquePosts(prev: MobilePostItem[], next: MobilePostItem[]): MobilePostItem[] {
  const existingIds = new Set(prev.map((p) => String(p.postId)));
  const uniqueNext = next.filter((p) => !existingIds.has(String(p.postId)));
  return [...prev, ...uniqueNext];
}

export function useCatalogPosts(options: UseCatalogPostsOptions = {}) {
  const {
    query = '',
    category,
    executionType,
    budgetMin,
    budgetMax,
    limit = 10,
  } = options;

  const [posts, setPosts] = React.useState<MobilePostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtering, setFiltering] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Fetch when filters or query changes
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();

    Promise.resolve().then(() => {
      if (active) setFiltering(true);
    });

    const params: MobilePostFilters = {
      q: query.trim() || undefined,
      category,
      executionType: executionType && executionType !== 'ALL' ? executionType : undefined,
      budgetMin,
      budgetMax,
      page: 1,
      limit,
    };

    postsApi
      .list(params, { signal: controller.signal })
      .then((res) => {
        if (!active) return;
        setPosts(res.data);
        setTotalPages(res.meta.totalPages);
        setPage(1);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (
          err &&
          typeof err === 'object' &&
          ((err as { code?: string }).code === 'ABORTED' ||
            (err as { name?: string }).name === 'AbortError')
        ) {
          return;
        }
        setError(
          err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ WorkGo'
        );
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
      controller.abort();
    };
  }, [query, category, executionType, budgetMin, budgetMax, limit]);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await postsApi.list({
        q: query.trim() || undefined,
        category,
        executionType: executionType && executionType !== 'ALL' ? executionType : undefined,
        budgetMin,
        budgetMax,
        page: 1,
        limit,
      });
      setPosts(res.data);
      setTotalPages(res.meta.totalPages);
      setPage(1);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể làm mới danh sách bài đăng'
      );
    } finally {
      setRefreshing(false);
    }
  }, [query, category, executionType, budgetMin, budgetMax, limit]);

  const loadMore = React.useCallback(async () => {
    if (page >= totalPages || loading || filtering || refreshing) return;
    const nextPage = page + 1;
    try {
      const res = await postsApi.list({
        q: query.trim() || undefined,
        category,
        executionType: executionType && executionType !== 'ALL' ? executionType : undefined,
        budgetMin,
        budgetMax,
        page: nextPage,
        limit,
      });
      setPosts((prev) => appendUniquePosts(prev, res.data));
      setTotalPages(res.meta.totalPages);
      setPage(nextPage);
    } catch {
      // Keep existing list on pagination failure
    }
  }, [page, totalPages, loading, filtering, refreshing, query, category, executionType, budgetMin, budgetMax, limit]);

  return {
    posts,
    loading,
    filtering,
    refreshing,
    error,
    hasMore: page < totalPages,
    page,
    totalPages,
    refresh,
    loadMore,
  };
}
