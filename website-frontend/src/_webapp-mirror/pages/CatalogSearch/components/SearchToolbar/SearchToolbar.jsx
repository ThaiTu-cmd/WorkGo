import { useTranslations } from "next-intl";
import React from 'react';
import { SlidersHorizontal, ChevronRight, X, ArrowUpDown, LayoutGrid } from 'lucide-react';
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
  const tr = useTranslations("misc");
  const sortOptions = [{
    value: 'POPULAR',
    label: tr("m427")
  }, {
    value: 'RATING_DESC',
    label: tr("m428")
  }, {
    value: 'PRICE_ASC',
    label: tr("m429")
  }, {
    value: 'PRICE_DESC',
    label: tr("m430")
  }, {
    value: 'NEWEST',
    label: tr("m431")
  }];
  return <div className={styles.toolbarContainer}>
      {/* Breadcrumb Row */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button type="button" onClick={onGoHome} className={styles.breadcrumbLink}>{tr("m242")}</button>
        <ChevronRight size={14} className={styles.breadcrumbSep} />
        <span className={styles.breadcrumbCurrent}>{categoryName || tr("m432")}</span>
        {searchQuery && <>
            <ChevronRight size={14} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbQuery}>{tr("m1485")}{searchQuery}"</span>
          </>}
      </nav>

      {/* Main Bar: Title, Count, Mobile Toggle, Sort Dropdown */}
      <div className={styles.mainBar}>
        <div className={styles.leftInfo}>
          <h1 className={styles.pageTitle}>
            <LayoutGrid size={26} className={styles.titleIcon} aria-hidden="true" />
            {categoryName === tr("m102") ? tr("m433") : categoryName}
          </h1>
          <span className={styles.resultCount} aria-live="polite" aria-atomic="true">{tr("m437")} <strong>{totalResults}</strong> {tr("m438")}</span>
        </div>

        <div className={styles.rightControls}>
          {/* Mobile Filter Toggle Button */}
          <button type="button" className={styles.mobileFilterBtn} onClick={onOpenMobileFilter}>
            <SlidersHorizontal size={16} />
            <span>{tr("m439")}</span>
            {activeFilterCount > 0 && <span className={styles.activeFilterBadge}>{activeFilterCount}</span>}
          </button>

          {/* Sort Selector */}
          <div className={styles.sortWrapper}>
            <label htmlFor="sortSelect" className={styles.sortLabel}>
              <ArrowUpDown size={15} />
              <span>{tr("m440")}</span>
            </label>
            <select id="sortSelect" value={sortBy} onChange={e => onChangeSortBy(e.target.value)} className={styles.sortSelect}>
              {sortOptions.map(opt => <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters && activeFilters.length > 0 && <div className={styles.chipRow}>
          <span className={styles.chipLabel}>{tr("m441")}</span>
          {activeFilters.map((chip, idx) => <span key={idx} className={styles.filterChip}>
              <span>{chip.label}</span>
              <button type="button" onClick={chip.onRemove} className={styles.chipRemoveBtn} aria-label={`Remove filter ${chip.label}`}>
                <X size={12} />
              </button>
            </span>)}
        </div>}
    </div>;
}