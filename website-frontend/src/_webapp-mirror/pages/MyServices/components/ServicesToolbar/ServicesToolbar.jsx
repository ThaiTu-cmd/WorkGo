import { useTranslations } from "next-intl";
import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import styles from './ServicesToolbar.module.css';
export default function ServicesToolbar({
  activeTab,
  onSelectTab,
  tabCounts,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onOpenCreateModal
}) {
  const tr = useTranslations("misc");
  const tabs = [{
    key: 'ALL',
    label: tr("m142"),
    count: tabCounts.all
  }, {
    key: 'ACTIVE',
    label: tr("m558"),
    count: tabCounts.active
  }, {
    key: 'PENDING',
    label: tr("m222"),
    count: tabCounts.pending
  }, {
    key: 'PAUSED',
    label: tr("m559"),
    count: tabCounts.paused
  }, {
    key: 'DRAFT',
    label: tr("m560"),
    count: tabCounts.draft
  }];
  return <div className={styles.toolbarContainer}>
      <div className={styles.tabsRow}>
        {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return <button key={tab.key} type="button" className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`} onClick={() => onSelectTab(tab.key)}>
              <span>{tab.label}</span>
              <span className={`${styles.countBadge} ${isActive ? styles.badgeActive : ''}`}>
                {tab.count}
              </span>
            </button>;
      })}
      </div>

      <div className={styles.actionsRow}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder={tr("m561")} className={styles.searchInput} />
        </div>

        <div className={styles.filterBox}>
          <Filter size={15} className={styles.filterIcon} />
          <select value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} className={styles.categorySelect}>
            <option value="ALL">{tr("m102")}</option>
            <option value="lap-trinh-cong-nghe">{tr("m562")}</option>
            <option value="thiet-ke-do-hoa">{tr("m563")}</option>
            <option value="sua-chua-dien-nuoc">{tr("m564")}</option>
            <option value="ve-sinh-don-dep">{tr("m565")}</option>
          </select>
        </div>

        <button type="button" className={styles.createBtn} onClick={onOpenCreateModal}>
          <Plus size={18} />
          <span>{tr("m542")}</span>
        </button>
      </div>
    </div>;
}