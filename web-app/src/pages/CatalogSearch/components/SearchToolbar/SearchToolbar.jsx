import React from 'react';
import { SlidersHorizontal, ChevronRight, X, ArrowUpDown } from 'lucide-react';
import styles from './SearchToolbar.module.css';

export default function SearchToolbar({
  categoryName,
  totalResults,
  sortBy,
  onChangeSortBy,
  activeFilterCount,
  onOpenMobileFilter,
  onGoHome,
  searchQuery,
  onClearSearchQuery,
  activeFilters,
  onRemoveFilter
}) {
  const sortOptions = [
    { value: 'POPULAR', label: 'Phổ biến nhất' },
    { value: 'RATING_DESC', label: 'Đánh giá cao nhất' },
    { value: 'PRICE_ASC', label: 'Giá: Thấp đến Cao' },
    { value: 'PRICE_DESC', label: 'Giá: Cao đến Thấp' },
    { value: 'NEWEST', label: 'Mới nhất' },
  ];

  return (
    <div className={styles.toolbarContainer}>
      {/* Breadcrumb Row */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button type="button" onClick={onGoHome} className={styles.breadcrumbLink}>
          Trang chủ
        </button>
        <ChevronRight size={14} className={styles.breadcrumbSep} />
        <span className={styles.breadcrumbCurrent}>{categoryName || 'Tất cả dịch vụ'}</span>
        {searchQuery && (
          <>
            <ChevronRight size={14} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbQuery}>Từ khóa: "{searchQuery}"</span>
          </>
        )}
      </nav>

      {/* Main Bar: Title, Count, Mobile Toggle, Sort Dropdown */}
      <div className={styles.mainBar}>
        <div className={styles.leftInfo}>
          <h1 className={styles.pageTitle}>
            {categoryName === 'Tất cả danh mục' ? 'Khám phá tất cả dịch vụ' : categoryName}
          </h1>
          <span className={styles.resultCount}>
            Tìm thấy <strong>{totalResults}</strong> dịch vụ
          </span>
        </div>

        <div className={styles.rightControls}>
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            className={styles.mobileFilterBtn}
            onClick={onOpenMobileFilter}
          >
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className={styles.activeFilterBadge}>{activeFilterCount}</span>
            )}
          </button>

          {/* Sort Selector */}
          <div className={styles.sortWrapper}>
            <label htmlFor="sortSelect" className={styles.sortLabel}>
              <ArrowUpDown size={15} />
              <span>Sắp xếp:</span>
            </label>
            <select
              id="sortSelect"
              value={sortBy}
              onChange={(e) => onChangeSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters && activeFilters.length > 0 && (
        <div className={styles.chipRow}>
          <span className={styles.chipLabel}>Đang lọc:</span>
          {activeFilters.map((chip, idx) => (
            <span key={idx} className={styles.filterChip}>
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className={styles.chipRemoveBtn}
                aria-label={`Remove filter ${chip.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
