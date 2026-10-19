import React, { useState, useMemo, useEffect, useRef } from 'react';
import FilterSidebar from './components/FilterSidebar/FilterSidebar';
import SearchToolbar from './components/SearchToolbar/SearchToolbar';
import Pagination from './components/Pagination/Pagination';
import ServiceCard from '../../components/common/ServiceCard/ServiceCard';
import SkeletonServiceCard from '../../components/common/Skeleton/SkeletonServiceCard';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { useServiceList } from '../../hooks/useServiceList';
import { SearchX, RotateCcw, X } from 'lucide-react';
import styles from './CatalogSearchPage.module.css';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function CatalogSearchPage({
  initialCategory = 'ALL',
  initialExecutionType = 'ALL',
  initialSearchQuery = '',
  onSelectService,
  onGoHome,
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState(initialExecutionType);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [deliveryTime, setDeliveryTime] = useState('ALL');
  const [minRating, setMinRating] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState('POPULAR');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  // C2-3: brief skeleton shimmer while filters settle (debounced, local only).
  const [isFiltering, setIsFiltering] = useState(false);

  const pageSize = 6;
  const { categories, status: categoriesStatus } = useCatalogCategories();
  // All PUBLISHED services; category / type / price / rating / keyword filters
  // and sorting below run on this list (the API has no keyword search).
  const { services: listedServices, status: servicesStatus } = useServiceList();

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 250);
    return () => clearTimeout(t);
  }, [selectedCategory, selectedType, priceRange, deliveryTime, minRating, onlyVerified, searchQuery, sortBy]);

  // R3: Escape closes the mobile filter drawer.
  useEffect(() => {
    if (!mobileFilterOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileFilterOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileFilterOpen]);
  // F3: keep Tab cycling inside the filter drawer while open.
  const filterDrawerRef = useRef(null);
  useFocusTrap(filterDrawerRef, mobileFilterOpen);
  // V3-trap needs focus INSIDE first: on open, move it to the close button
  // (same pattern as the header drawer). Otherwise Tab walks the background.
  useEffect(() => {
    if (!mobileFilterOpen) return;
    const closeBtn = filterDrawerRef.current
      ? filterDrawerRef.current.querySelector("button")
      : null;
    if (closeBtn) closeBtn.focus();
  }, [mobileFilterOpen]);

  // Resolve category display name
  const currentCategoryObj = useMemo(() => {
    if (selectedCategory === 'ALL') return null;
    return categories.find((c) => c.slug === selectedCategory);
  }, [selectedCategory, categories]);

  const categoryName = currentCategoryObj ? currentCategoryObj.name : 'Tất cả danh mục';

  // Real-time multi-criteria filtering
  const filteredServices = useMemo(() => {
    return listedServices.filter((service) => {
      // 1. Category filter
      if (selectedCategory !== 'ALL' && service.categorySlug !== selectedCategory) {
        return false;
      }

      // 2. Execution type filter
      if (selectedType !== 'ALL' && service.executionType !== selectedType) {
        return false;
      }

      // 3. Price range filter
      if (priceRange.min !== null && service.basePrice < priceRange.min) {
        return false;
      }
      if (priceRange.max !== null && service.basePrice > priceRange.max) {
        return false;
      }

      // 4. Delivery time filter
      if (deliveryTime !== 'ALL' && service.deliveryDays > Number(deliveryTime)) {
        return false;
      }

      // 5. Min Rating filter
      if (minRating > 0 && service.avgRating < minRating) {
        return false;
      }

      // 6. Only verified providers
      if (onlyVerified && !service.provider.isVerified) {
        return false;
      }

      // 7. Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = service.title.toLowerCase().includes(q);
        const matchesCategory = service.categoryName.toLowerCase().includes(q);
        const matchesProvider = service.provider.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesProvider) {
          return false;
        }
      }

      return true;
    });
  }, [listedServices, selectedCategory, selectedType, priceRange, deliveryTime, minRating, onlyVerified, searchQuery]);

  // Sorting
  const sortedServices = useMemo(() => {
    const list = [...filteredServices];
    switch (sortBy) {
      case 'RATING_DESC':
        return list.sort((a, b) => b.avgRating - a.avgRating);
      case 'PRICE_ASC':
        return list.sort((a, b) => a.basePrice - b.basePrice);
      case 'PRICE_DESC':
        return list.sort((a, b) => b.basePrice - a.basePrice);
      case 'NEWEST':
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'POPULAR':
      default:
        return list.sort((a, b) => b.orderCount - a.orderCount);
    }
  }, [filteredServices, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedServices.length / pageSize) || 1;
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedServices.slice(start, start + pageSize);
  }, [sortedServices, currentPage, pageSize]);

  // Count active filters
  const activeFilters = useMemo(() => {
    const chips = [];

    if (selectedCategory !== 'ALL' && currentCategoryObj) {
      chips.push({
        label: `Danh mục: ${currentCategoryObj.name}`,
        onRemove: () => {
          setSelectedCategory('ALL');
          setCurrentPage(1);
        },
      });
    }

    if (selectedType !== 'ALL') {
      const typeLabelMap = {
        DIGITAL: 'Online / Digital',
        ONSITE: 'Tại nhà / Onsite',
        DELIVERY: 'Giao nhận',
        APPOINTMENT: 'Lịch hẹn',
      };
      chips.push({
        label: `Hình thức: ${typeLabelMap[selectedType] || selectedType}`,
        onRemove: () => {
          setSelectedType('ALL');
          setCurrentPage(1);
        },
      });
    }

    if (priceRange.min !== null || priceRange.max !== null) {
      let priceLabel = 'Giá: ';
      if (priceRange.min !== null && priceRange.max !== null) {
        priceLabel += `${priceRange.min.toLocaleString('vi-VN')}₫ - ${priceRange.max.toLocaleString('vi-VN')}₫`;
      } else if (priceRange.min !== null) {
        priceLabel += `Từ ${priceRange.min.toLocaleString('vi-VN')}₫`;
      } else {
        priceLabel += `Đến ${priceRange.max.toLocaleString('vi-VN')}₫`;
      }
      chips.push({
        label: priceLabel,
        onRemove: () => {
          setPriceRange({ min: null, max: null });
          setCurrentPage(1);
        },
      });
    }

    if (deliveryTime !== 'ALL') {
      chips.push({
        label: `Giao việc: ≤ ${deliveryTime} ngày`,
        onRemove: () => {
          setDeliveryTime('ALL');
          setCurrentPage(1);
        },
      });
    }

    if (minRating > 0) {
      chips.push({
        label: `Đánh giá: ≥ ${minRating}⭐`,
        onRemove: () => {
          setMinRating(0);
          setCurrentPage(1);
        },
      });
    }

    if (onlyVerified) {
      chips.push({
        label: 'Chuyên gia Verified',
        onRemove: () => {
          setOnlyVerified(false);
          setCurrentPage(1);
        },
      });
    }

    return chips;
  }, [selectedCategory, currentCategoryObj, selectedType, priceRange, deliveryTime, minRating, onlyVerified]);

  const hasActiveFilters = activeFilters.length > 0;

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedType('ALL');
    setPriceRange({ min: null, max: null });
    setDeliveryTime('ALL');
    setMinRating(0);
    setOnlyVerified(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className={styles.catalogPage}>
      <div className="container">
        {/* Top Search Toolbar */}
        <SearchToolbar
          categoryName={categoryName}
          totalResults={sortedServices.length}
          sortBy={sortBy}
          onChangeSortBy={(val) => {
            setSortBy(val);
            setCurrentPage(1);
          }}
          activeFilterCount={activeFilters.length}
          onOpenMobileFilter={() => setMobileFilterOpen(true)}
          onGoHome={onGoHome}
          searchQuery={searchQuery}
          onClearSearchQuery={() => {
            setSearchQuery('');
            setCurrentPage(1);
          }}
          activeFilters={activeFilters}
        />

        {/* Main Content Layout: Sidebar + Grid */}
        <div className={styles.mainLayout}>
          {/* Desktop Filter Sidebar */}
          <div className={styles.sidebarColumn}>
            <FilterSidebar
              categories={categories}
              categoriesStatus={categoriesStatus}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              selectedType={selectedType}
              onSelectType={(t) => {
                setSelectedType(t);
                setCurrentPage(1);
              }}
              priceRange={priceRange}
              onChangePriceRange={(r) => {
                setPriceRange(r);
                setCurrentPage(1);
              }}
              deliveryTime={deliveryTime}
              onChangeDeliveryTime={(d) => {
                setDeliveryTime(d);
                setCurrentPage(1);
              }}
              minRating={minRating}
              onChangeMinRating={(r) => {
                setMinRating(r);
                setCurrentPage(1);
              }}
              onlyVerified={onlyVerified}
              onToggleVerified={(v) => {
                setOnlyVerified(v);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Services Grid Column */}
          <main className={styles.servicesColumn}>
            {isFiltering || servicesStatus === 'loading' ? (
              <div className={styles.servicesGrid} aria-busy="true" aria-label="Đang tải dịch vụ">
                <SkeletonServiceCard count={pageSize} />
              </div>
            ) : paginatedServices.length > 0 ? (
              <>
                <div className={styles.servicesGrid}>
                  {paginatedServices.map((service) => (
                    <div
                      key={service.serviceId}
                      className={styles.cardItem}
                      onClick={() => onSelectService && onSelectService(service)}
                    >
                      <ServiceCard service={service} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                />
              </>
            ) : (
              /* Empty State */
              <div className={styles.emptyState}>
                <div className={styles.emptyIconBox}>
                  <SearchX size={48} className={styles.emptyIcon} />
                </div>
                <h3 className={styles.emptyTitle}>
                  {servicesStatus === 'ready' && listedServices.length > 0
                    ? 'Không tìm thấy dịch vụ phù hợp'
                    : 'Chưa có dịch vụ để hiển thị'}
                </h3>
                <p className={styles.emptyDesc}>
                  {servicesStatus === 'needs-login'
                    ? 'Đăng nhập để duyệt dịch vụ trên WorkGo.'
                    : servicesStatus === 'error'
                      ? 'Không tải được danh sách dịch vụ. Kiểm tra kết nối tới máy chủ rồi thử lại.'
                      : listedServices.length > 0
                        ? 'Không có dịch vụ nào khớp với bộ lọc hiện tại. Hãy nới khoảng giá, đổi hình thức hoặc xóa bộ lọc.'
                        : 'Hiện chưa có dịch vụ nào được đăng.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles.emptyResetBtn}
                    onClick={handleResetFilters}
                  >
                    <RotateCcw size={16} />
                    <span>Xóa tất cả bộ lọc</span>
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Filter Modal */}
      {mobileFilterOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileFilterOpen(false)}>
          <div className={styles.mobileDrawer} ref={filterDrawerRef} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Bộ lọc dịch vụ</h3>
              <button
                type="button"
                className={styles.closeDrawerBtn}
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Đóng bộ lọc"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <FilterSidebar
                categories={categories}
                categoriesStatus={categoriesStatus}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                selectedType={selectedType}
                onSelectType={(t) => {
                  setSelectedType(t);
                  setCurrentPage(1);
                }}
                priceRange={priceRange}
                onChangePriceRange={(r) => {
                  setPriceRange(r);
                  setCurrentPage(1);
                }}
                deliveryTime={deliveryTime}
                onChangeDeliveryTime={(d) => {
                  setDeliveryTime(d);
                  setCurrentPage(1);
                }}
                minRating={minRating}
                onChangeMinRating={(r) => {
                  setMinRating(r);
                  setCurrentPage(1);
                }}
                onlyVerified={onlyVerified}
                onToggleVerified={(v) => {
                  setOnlyVerified(v);
                  setCurrentPage(1);
                }}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.applyDrawerBtn}
                onClick={() => setMobileFilterOpen(false)}
              >
                Xem {sortedServices.length} kết quả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
