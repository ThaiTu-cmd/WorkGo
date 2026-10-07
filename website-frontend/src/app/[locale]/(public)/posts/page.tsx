"use client";

import * as React from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from "@/components/ui/drawer";
import { PostCard } from "@/components/composed/post-card";
import { FilterSidebar, type FilterValues } from "@/components/composed/filter-sidebar";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { catalogApi, type CategoryItem } from "@/lib/adapters/catalog";
import { cn } from "@/lib/utils";

function PostsMarketplaceContent() {
  const t = useTranslations("posts");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  // URL state
  const qParam = searchParams.get("q") || "";
  const catParam = searchParams.get("category") || "";
  const execParam = searchParams.get("executionType") || "";
  const bMinParam = searchParams.get("budgetMin");
  const bMaxParam = searchParams.get("budgetMax");
  const sortParam = searchParams.get("sort") || "newest";
  const pageParam = Number(searchParams.get("page")) || 1;

  // Local state
  const [searchInput, setSearchInput] = React.useState(qParam);
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [meta, setMeta] = React.useState({ page: 1, limit: 6, total: 0, totalPages: 1 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  // Load categories on mount
  React.useEffect(() => {
    catalogApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Sync search input when URL changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(qParam);
  }, [qParam]);

  const [retryKey, setRetryKey] = React.useState(0);
  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setRetryKey((k) => k + 1);
  };

  // Load posts
  React.useEffect(() => {
    let active = true;
    postsApi
      .list({
        q: qParam || undefined,
        category: catParam || undefined,
        executionType: execParam || undefined,
        budgetMin: bMinParam ? Number(bMinParam) : undefined,
        budgetMax: bMaxParam ? Number(bMaxParam) : undefined,
        sort: sortParam,
        page: pageParam,
        limit: 6,
      })
      .then((res) => {
        if (active) {
          setPosts(res.data);
          setMeta(res.meta);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [qParam, catParam, execParam, bMinParam, bMaxParam, sortParam, pageParam, retryKey]);

  // Update URL helper
  const updateQuery = React.useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      });
      router.push(`/${locale}/posts?${next.toString()}`);
    },
    [router, locale, searchParams]
  );

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== qParam) {
        updateQuery({ q: searchInput || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, qParam, updateQuery]);

  const filterValues: FilterValues = {
    q: qParam,
    category: catParam || undefined,
    executionType: execParam || undefined,
    budgetMin: bMinParam ? Number(bMinParam) : undefined,
    budgetMax: bMaxParam ? Number(bMaxParam) : undefined,
    sort: sortParam,
  };

  const handleFilterChange = (newValues: FilterValues) => {
    updateQuery({
      category: newValues.category,
      executionType: newValues.executionType,
      budgetMin: newValues.budgetMin,
      budgetMax: newValues.budgetMax,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    router.push(`/${locale}/posts`);
    setSearchInput("");
  };

  const hasActiveFilters = Boolean(
    qParam || catParam || execParam || bMinParam || bMaxParam
  );

  return (
    <PageContainer size="wide">
      {/* Page Title with Mock Chip and Live Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fg">
              {t("marketplaceTitle")}
            </h1>
          </div>
          <p className="text-sm text-fg-secondary mt-1">{t("marketplaceSubtitle")}</p>
        </div>

        {/* Live post counter badge */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-subtle text-primary text-xs font-semibold border border-primary/20 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>
              {meta.total} {t("jobsAvailable")}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            prefixIcon={<Search className="h-4 w-4" />}
            className="h-11 pl-10"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                updateQuery({ q: undefined, page: 1 });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-tertiary hover:text-fg p-1 cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Mobile Filter Trigger */}
          <Button
            variant="outline"
            className="md:hidden flex-1 sm:flex-initial gap-2 h-11"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{tCommon("filter")}</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* Sort Select */}
          <select
            value={sortParam}
            onChange={(e) => updateQuery({ sort: e.target.value, page: 1 })}
            className="h-11 rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-48"
            aria-label={t("sort")}
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="budget_high">{t("sortBudgetHigh")}</option>
            <option value="budget_low">{t("sortBudgetLow")}</option>
          </select>
        </div>
      </div>

      {/* Quick Category Pills Carousel */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => updateQuery({ category: undefined, page: 1 })}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95",
                !catParam
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "bg-surface border border-border text-fg-secondary hover:text-fg hover:border-border-strong hover:bg-muted"
              )}
            >
              {t("allCategories")}
            </button>
            {categories.map((cat) => {
              const isSelected = catParam === cat.categoryId;
              return (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() =>
                    updateQuery({
                      category: isSelected ? undefined : cat.categoryId,
                      page: 1,
                    })
                  }
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95",
                    isSelected
                      ? "bg-primary text-white shadow-xs font-semibold"
                      : "bg-surface border border-border text-fg-secondary hover:text-fg hover:border-border-strong hover:bg-muted"
                  )}
                >
                  {cat.categoryName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-6 text-xs">
          <span className="text-fg-tertiary font-medium">Bộ lọc đang áp dụng:</span>

          {catParam && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span>{categories.find((c) => c.categoryId === catParam)?.categoryName || catParam}</span>
              <button
                onClick={() => updateQuery({ category: undefined, page: 1 })}
                className="hover:text-danger cursor-pointer p-0.5"
                aria-label="Xóa bộ lọc danh mục"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {execParam && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span>{execParam}</span>
              <button
                onClick={() => updateQuery({ executionType: undefined, page: 1 })}
                className="hover:text-danger cursor-pointer p-0.5"
                aria-label="Xóa bộ lọc hình thức"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(bMinParam || bMaxParam) && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span>
                Ngân sách: {bMinParam ? `${Number(bMinParam).toLocaleString("vi-VN")}₫` : "0₫"} -{" "}
                {bMaxParam ? `${Number(bMaxParam).toLocaleString("vi-VN")}₫` : "∞"}
              </span>
              <button
                onClick={() => updateQuery({ budgetMin: undefined, budgetMax: undefined, page: 1 })}
                className="hover:text-danger cursor-pointer p-0.5"
                aria-label="Xóa bộ lọc ngân sách"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-danger hover:text-danger h-6 px-2"
          >
            {tCommon("clearFilters")}
          </Button>
        </div>
      )}

      {/* Main Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left: Desktop Filter Sidebar */}
        <div className="hidden md:block md:col-span-1">
          <div className="sticky top-6 p-5 rounded-card bg-surface border border-border shadow-xs">
            <FilterSidebar
              categories={categories}
              values={filterValues}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        </div>

        {/* Right: Posts Grid / States */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-card border border-border bg-surface p-5 space-y-4"
                >
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title={tCommon("loading")}
              description="Không thể tải danh sách việc làm. Vui lòng kiểm tra lại kết nối và thử lại."
              onRetry={handleRetry}
            />
          ) : posts.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description="Thử điều chỉnh hoặc xóa các điều kiện lọc để tìm kiếm các bài đăng việc làm khác."
              action={
                hasActiveFilters ? (
                  <Button variant="primary" onClick={handleClearFilters}>
                    {tCommon("clearFilters")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post) => (
                  <PostCard key={post.postId} post={post} locale={locale} />
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(p) => updateQuery({ page: p })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent side="bottom">
          <DrawerHeader>
            <DrawerTitle>{tCommon("filter")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <FilterSidebar
              categories={categories}
              values={filterValues}
              onChange={(v) => {
                handleFilterChange(v);
                setMobileDrawerOpen(false);
              }}
              onClear={() => {
                handleClearFilters();
                setMobileDrawerOpen(false);
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}

export default function PostsMarketplacePage() {
  return (
    <React.Suspense fallback={null}>
      <PostsMarketplaceContent />
    </React.Suspense>
  );
}
