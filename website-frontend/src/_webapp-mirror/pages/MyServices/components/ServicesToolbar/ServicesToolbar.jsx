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
  onOpenCreateModal,
}) {
  const tabs = [
    { key: 'ALL', label: 'Tất cả', count: tabCounts.all },
    { key: 'ACTIVE', label: 'Đang bán', count: tabCounts.active },
    { key: 'PENDING', label: 'Chờ duyệt', count: tabCounts.pending },
    { key: 'PAUSED', label: 'Tạm ngưng', count: tabCounts.paused },
    { key: 'DRAFT', label: 'Bản nháp', count: tabCounts.draft },
  ];

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onSelectTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className={`${styles.countBadge} ${isActive ? styles.badgeActive : ''}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.actionsRow}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên dịch vụ..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBox}>
          <Filter size={15} className={styles.filterIcon} />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={styles.categorySelect}
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="lap-trinh-cong-nghe">Lập trình & Công nghệ</option>
            <option value="thiet-ke-do-hoa">Thiết kế & Đồ họa</option>
            <option value="sua-chua-dien-nuoc">Sửa chữa Điện nước</option>
            <option value="ve-sinh-don-dep">Vệ sinh & Dọn dẹp</option>
          </select>
        </div>

        <button
          type="button"
          className={styles.createBtn}
          onClick={onOpenCreateModal}
        >
          <Plus size={18} />
          <span>Tạo dịch vụ mới</span>
        </button>
      </div>
    </div>
  );
}
