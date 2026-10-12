import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch }) {
  const [keyword, setKeyword] = useState('');
  const [executionType, setExecutionType] = useState('ALL');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ keyword, executionType });
    }
  };

  return (
    <form className={styles.searchBarContainer} onSubmit={handleSubmit}>
      {/* Dropdown execution type filter */}
      <div className={styles.filterWrapper}>
        <select
          value={executionType}
          onChange={(e) => setExecutionType(e.target.value)}
          className={styles.filterSelect}
          aria-label="Chọn hình thức thực hiện"
        >
          <option value="ALL">Tất cả hình thức</option>
          <option value="DIGITAL">🌐 Dịch vụ Online (Digital)</option>
          <option value="ONSITE">🏠 Dịch vụ Tại nhà (Onsite)</option>
          <option value="DELIVERY">🚚 Giao nhận (Delivery)</option>
          <option value="APPOINTMENT">📅 Đặt lịch hẹn (Appointment)</option>
        </select>
        <ChevronDown size={16} className={styles.chevronIcon} />
      </div>

      <div className={styles.divider} />

      {/* Main search text input */}
      <div className={styles.inputWrapper}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Bạn đang cần dịch vụ gì? (VD: Thiết kế logo, Lập trình website, Sửa điện nước...)"
          className={styles.searchInput}
        />
      </div>

      {/* Action submit button */}
      <button type="submit" className={styles.submitBtn}>
        <span>Tìm kiếm</span>
        <Search size={18} className={styles.btnIcon} />
      </button>
    </form>
  );
}
